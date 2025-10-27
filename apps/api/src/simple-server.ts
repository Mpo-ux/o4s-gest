import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware básico
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ],
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  console.log('🏥 Health check requested')
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'O4S Gestão API'
  })
})

// Rota de teste básica
app.get('/api/test', (_req, res) => {
  console.log('🧪 Test endpoint called')
  res.json({ 
    message: 'Servidor API funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Endpoint não encontrado' })
})

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Server error:', err.message)
  res.status(500).json({ message: 'Erro interno do servidor' })
})

app.listen(PORT, () => {
  console.log(`🚀 Simple API Server running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`)
})

export default app