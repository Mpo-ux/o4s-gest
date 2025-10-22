// Servidor de teste simples
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 5001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!' })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste funcionando na porta ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
})