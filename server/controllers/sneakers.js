// replace original import with a robust import pattern
import * as dbModule from '../config/database.js'
const pool = dbModule.pool ?? dbModule.default ?? dbModule
if (!pool || typeof pool.query !== 'function') {
	// helpful runtime error to aid debugging
	throw new Error('Database pool not found or invalid. Ensure server/config/database.js exports "pool" (named or default).')
}

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data')
const createdFile = path.join(dataDir, 'created.json')

// Helper: parse features from string/object
const parseFeatures = (maybe) => {
	// Accept either object or JSON string
	if (maybe === undefined || maybe === null) return {}
	if (typeof maybe === 'string') {
		try { return JSON.parse(maybe) } catch (e) { return null }
	}
	if (typeof maybe === 'object') return maybe
	return null
}

// Example impossible-combination checker (customize rules as needed)
const isValidCombination = (features) => {
	if (!features) return true
	const color = features.color && (typeof features.color === 'string' ? features.color : features.color.name)
	const material = features.material && (typeof features.material === 'string' ? features.material : features.material.name)
	// Example rule: neon color cannot be combined with leather
	if (color === 'neon' && material === 'leather') return false
	return true
}

// Calculate total price from basePrice + sum of feature option prices (if provided)
const calculateTotalPrice = (basePrice = 0, features = {}) => {
	let total = Number(basePrice) || 0
	Object.values(features || {}).forEach((opt) => {
		if (!opt) return
		if (typeof opt === 'object' && typeof opt.price === 'number') total += opt.price
		else if (typeof opt === 'number') total += opt
		else if (typeof opt === 'string' && !isNaN(Number(opt))) total += Number(opt)
	})
	return total
}

const readCreatedIds = async () => {
	try {
		await fs.mkdir(dataDir, { recursive: true })
		const raw = await fs.readFile(createdFile, 'utf8')
		return JSON.parse(raw)
	} catch (err) {
		if (err.code === 'ENOENT') return []
		console.error('readCreatedIds error', err)
		throw err
	}
}

const writeCreatedIds = async (ids) => {
	await fs.mkdir(dataDir, { recursive: true })
	await fs.writeFile(createdFile, JSON.stringify(ids, null, 2), 'utf8')
}

const addCreatedId = async (id) => {
	const ids = await readCreatedIds()
	const n = Number(id)
	if (!ids.includes(n)) {
		ids.push(n)
		await writeCreatedIds(ids)
	}
}

const removeCreatedId = async (id) => {
	const ids = await readCreatedIds()
	const n = Number(id)
	const next = ids.filter(x => x !== n)
	await writeCreatedIds(next)
}

const isDev = process.env.NODE_ENV !== 'production'

// GET /api/sneakers
export const getAllSneakers = async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM sneakers ORDER BY id')
		return res.json(result.rows)
	} catch (err) {
		console.error('getAllSneakers error:', err)
		return res.status(500).json({
			error: 'Server error fetching sneakers',
			details: err.message,
			...(isDev ? { stack: err.stack } : {})
		})
	}
}

// GET /api/sneakers/:id
export const getSneakerById = async (req, res) => {
	const { id } = req.params
	try {
		const result = await pool.query('SELECT * FROM sneakers WHERE id = $1', [id])
		if (result.rows.length === 0) return res.status(404).json({ error: 'Sneaker not found' })
		return res.json(result.rows[0])
	} catch (err) {
		console.error('getSneakerById error:', err)
		return res.status(500).json({
			error: 'Server error fetching sneaker',
			details: err.message,
			...(isDev ? { stack: err.stack } : {})
		})
	}
}

// POST /api/sneakers
export const createSneaker = async (req, res) => {
	const { name, base_price } = req.body
	const rawFeatures = req.body.features
	const features = parseFeatures(rawFeatures)

	if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' })
	if (features === null) return res.status(400).json({ error: 'features must be a valid JSON object' })
	if (!isValidCombination(features)) return res.status(400).json({ error: 'Selected feature combination is not allowed' })

	const total_price = calculateTotalPrice(base_price, features)

	try {
		const q = `INSERT INTO sneakers (name, base_price, features, total_price)
				   VALUES ($1, $2, $3::jsonb, $4) RETURNING *`
		const values = [name, base_price || 0, JSON.stringify(features), total_price]
		const result = await pool.query(q, values)

		// persist created id to server-side file
		try { await addCreatedId(result.rows[0].id) } catch (e) { console.error('addCreatedId failed', e) }

		return res.status(201).json(result.rows[0])
	} catch (err) {
		console.error('createSneaker error:', err)
		return res.status(500).json({
			error: 'Server error creating sneaker',
			details: err.message,
			...(isDev ? { stack: err.stack } : {})
		})
	}
}

// PUT /api/sneakers/:id
export const updateSneaker = async (req, res) => {
	const { id } = req.params
	const { name, base_price } = req.body
	const rawFeatures = req.body.features
	const features = rawFeatures === undefined ? undefined : parseFeatures(rawFeatures)

	if (name && typeof name !== 'string') return res.status(400).json({ error: 'name must be a string' })
	if (rawFeatures !== undefined && features === null) return res.status(400).json({ error: 'features must be a valid JSON object' })
	if (features !== undefined && !isValidCombination(features)) return res.status(400).json({ error: 'Selected feature combination is not allowed' })

	try {
		const existingQ = 'SELECT * FROM sneakers WHERE id = $1'
		const existingRes = await pool.query(existingQ, [id])
		if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Sneaker not found' })

		const existing = existingRes.rows[0]
		const updatedName = name ?? existing.name
		const updatedBase = (base_price !== undefined) ? base_price : existing.base_price
		const updatedFeatures = (rawFeatures !== undefined) ? features : existing.features
		const updatedTotal = calculateTotalPrice(updatedBase, updatedFeatures)

		const q = `UPDATE sneakers
				   SET name = $1, base_price = $2, features = $3::jsonb, total_price = $4
				   WHERE id = $5 RETURNING *`
		const values = [updatedName, updatedBase, JSON.stringify(updatedFeatures), updatedTotal, id]
		const result = await pool.query(q, values)
		return res.json(result.rows[0])
	} catch (err) {
		console.error('updateSneaker error:', err)
		return res.status(500).json({
			error: 'Server error updating sneaker',
			details: err.message,
			...(isDev ? { stack: err.stack } : {})
		})
	}
}

// DELETE /api/sneakers/:id
export const deleteSneaker = async (req, res) => {
	const { id } = req.params
	try {
		const q = 'DELETE FROM sneakers WHERE id = $1 RETURNING *'
		const result = await pool.query(q, [id])
		if (result.rows.length === 0) return res.status(404).json({ error: 'Sneaker not found' })

		// remove id from server-side created list
		try { await removeCreatedId(id) } catch (e) { console.error('removeCreatedId failed', e) }

		return res.json({ message: 'Sneaker deleted', sneaker: result.rows[0] })
	} catch (err) {
		console.error('deleteSneaker error:', err)
		return res.status(500).json({
			error: 'Server error deleting sneaker',
			details: err.message,
			...(isDev ? { stack: err.stack } : {})
		})
	}
}

// new: GET /api/sneakers/debug/tables  - quick check whether the sneakers table exists
export const debugTables = async (req, res) => {
	try {
		const result = await pool.query("SELECT to_regclass('public.sneakers') AS sneakers_table")
		return res.json({ sneakers_table: result.rows[0].sneakers_table })
	} catch (err) {
		console.error('debugTables error:', err)
		return res.status(500).json({
			error: 'Server error checking tables',
			details: err.message,
			...(isDev ? { stack: err.stack } : {})
		})
	}
}

// new: GET /api/sneakers/created
export const getCreatedSneakerIds = async (req, res) => {
	try {
		const ids = await readCreatedIds()
		return res.json(ids)
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error reading created ids' })
	}
}

// new: helper to verify DB connectivity before starting server
export const testDbConnection = async () => {
	try {
		// simple lightweight query
		await pool.query('SELECT 1')
		return { ok: true }
	} catch (err) {
		console.error('DB connectivity check failed:', err.message || err)
		return { ok: false, error: err.message || String(err) }
	}
}