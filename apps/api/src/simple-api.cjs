const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware básico
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'O4S Gestão API',
    version: '1.0.0'
  });
});

// API de teste básica
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({ 
    message: 'Servidor API funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health',
      'GET /api/test',
      'POST /api/auth/login',
      'GET /api/admin/users'
    ]
  });
});

// Mock Auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body.email);
  
  const { email, password } = req.body;
  
  // Credenciais de teste simples
  const testUsers = {
    'admin@o4s.tv': { password: 'admin123', role: 'ADMIN', name: 'Administrador' },
    'user@o4s.tv': { password: 'user123', role: 'USER', name: 'Utilizador' },
    'sergioramos@o4s.tv': { password: 'super123', role: 'SUPER_ADMIN', name: 'Sérgio Ramos' }
  };
  
  const user = testUsers[email];
  
  if (user && user.password === password) {
    const token = `mock-jwt-token-${Date.now()}`;
    res.json({
      token,
      user: {
        id: Math.floor(Math.random() * 1000),
        email,
        name: user.name,
        role: user.role
      }
    });
  } else {
    res.status(401).json({ message: 'Credenciais inválidas' });
  }
});

// Mock Admin Users endpoint
app.get('/api/admin/users', (req, res) => {
  console.log('👥 Admin users requested');
  
  const mockUsers = [
    {
      id: 1,
      name: 'Sérgio Ramos',
      email: 'sergioramos@o4s.tv',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      lastLogin: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Administrador',
      email: 'admin@o4s.tv', 
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLogin: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      name: 'Utilizador Teste',
      email: 'user@o4s.tv',
      role: 'USER', 
      status: 'ACTIVE',
      lastLogin: new Date(Date.now() - 172800000).toISOString()
    }
  ];
  
  res.json(mockUsers);
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`👥 Admin endpoint: http://localhost:${PORT}/api/admin/users`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app;