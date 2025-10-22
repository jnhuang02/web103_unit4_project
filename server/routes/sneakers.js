import express from 'express'
import {
	getAllSneakers,
	getSneakerById,
	createSneaker,
	updateSneaker,
	deleteSneaker,
	getCreatedSneakerIds
} from '../controllers/sneakers.js'

const router = express.Router()

router.get('/', getAllSneakers)
router.get('/created', getCreatedSneakerIds) // <-- added route
router.get('/:id', getSneakerById)
router.post('/', createSneaker)
router.put('/:id', updateSneaker)
router.delete('/:id', deleteSneaker)

export default router
