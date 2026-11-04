import { Router } from 'express'
import { getSummary } from '../controllers/dashboardController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authenticateToken)
router.get('/summary', getSummary)

export default router
