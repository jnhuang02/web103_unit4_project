import 'dotenv/config'
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ensure we load server/.env even if the process cwd is project root
const __dir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dir, '..', '.env')
dotenv.config({ path: envPath })

// normalize env values to safe types
const envToString = (v) => (v === undefined || v === null) ? undefined : String(v)
const envToNumber = (v) => {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

// Ensure all required env vars are present and are strings
const required = ['PGUSER', 'PGPASSWORD', 'PGHOST', 'PGPORT', 'PGDATABASE']
const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. Check your .env file.`)
}

const useSsl = process.env.PGHOST?.includes('.render.com') 
  ? { rejectUnauthorized: false }
  : false

const config = {
  user: envToString(process.env.PGUSER),
  password: envToString(process.env.PGPASSWORD),
  host: envToString(process.env.PGHOST),
  port: envToNumber(process.env.PGPORT),
  database: envToString(process.env.PGDATABASE),
  ssl: useSsl
}

export const pool = new pg.Pool(config)

// test connection helper (avoid printing secrets)
export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT 1 as ok')
    return { ok: true, rows: res.rows }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

// default export for compatibility
export default pool