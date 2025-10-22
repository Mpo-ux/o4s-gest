import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { users, findUserByEmail } from '../data/users.js'
import { JWT_SECRET } from '../config/constants.js'

const router = Router()

// Função para verificar passwords - simplificada para debug
const validatePassword = (email: string, password: string): boolean => {
  console.log('[AUTH] Validating password for email:', email)
  
  // Credenciais simples para debug - incluindo super admin
  const credentials: Record<string, string> = {
    'sergioramos@o4s.tv': 'super123',
    'admin@empresa.pt': 'admin123',
    'joao@empresa.pt': 'user123',
    'maria@teste.pt': 'pending123'
  }
  
  console.log('[AUTH] Available test accounts:', Object.keys(credentials))
  return credentials[email] === password
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('🔍 Login attempt received:', req.body)
    const { email, password } = req.body

    if (!email || !password) {
      console.log('❌ Missing email or password')
      return res.status(400).json({ 
        message: 'Email e password são obrigatórios' 
      })
    }

    // Procurar utilizador na base de dados
    const user = findUserByEmail(email)

    if (!user) {
      console.log('❌ User not found')
      return res.status(401).json({ 
        message: 'Credenciais inválidas' 
      })
    }

    // Verificar se o utilizador está ativo e aprovado
    if (!user.isActive || user.status !== 'APPROVED') {
      console.log('❌ User not active or not approved')
      return res.status(401).json({ 
        message: 'Conta não ativa ou aguarda aprovação' 
      })
    }

    // Verificar password
    if (!validatePassword(email, password)) {
      console.log('❌ Invalid password')
      return res.status(401).json({ 
        message: 'Credenciais inválidas' 
      })
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    console.log(`✅ Login successful for ${user.name} (${user.role})`)
    return res.json({
      message: 'Login efetuado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

// Logout endpoint (opcional - para invalidar tokens)
router.post('/logout', (_req, res) => {
  // Como estamos a usar JWT stateless, o logout é feito no frontend
  // removendo o token do localStorage/sessionStorage
  res.json({ message: 'Logout efetuado com sucesso' })
})

// Verificar token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = users.find(u => u.id === decoded.userId && u.isActive && u.status === 'APPROVED')

    if (!user) {
      return res.status(401).json({ message: 'Token inválido' })
    }

    res.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    res.status(401).json({ message: 'Token inválido' })
  }
})

export default router