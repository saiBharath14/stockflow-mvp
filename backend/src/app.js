import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import productRoutes from './routes/productRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ success: true, message: 'StockFlow API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/settings', settingsRoutes)

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({
    success: false,
    message: 'Internal server error',
  })
})

export default app
