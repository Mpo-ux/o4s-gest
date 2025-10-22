import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}))
app.use(express.json())

// Debug middleware para ver todas as chamadas
app.use('*', (req, _res, next) => {
  console.log(`📞 ${req.method} ${req.originalUrl}`)
  console.log('📦 Headers:', Object.keys(req.headers))
  if (req.headers.authorization) {
    console.log('🔑 Authorization header present')
  } else {
    console.log('❌ No authorization header')
  }
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Algo correu mal!' })
})

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Endpoint não encontrado' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
})

export default app