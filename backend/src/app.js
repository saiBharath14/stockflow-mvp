import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import productRoutes from './routes/productRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'

dotenv.config()

const app = express()

const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, 'http://localhost:5173']
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, '')),
)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
        return callback(null, true)
      }

      return callback(new Error('Origin is not allowed by CORS'))
    },
  }),
)
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
