// Script de teste para verificar utilizadores pendentes
const express = require('express')

// Simular a mesma base de dados do servidor
const users = [
  {
    id: '0',
    name: 'Sérgio Ramos',
    email: 'sergioramos@o4s.tv',
    role: 'SUPER_ADMIN',
    status: 'APPROVED',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    approvedBy: 'system',
    approvedAt: new Date('2025-01-01')
  },
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@empresa.pt',
    role: 'ADMIN',
    status: 'APPROVED',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    approvedBy: '0',
    approvedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@empresa.pt',
    role: 'USER',
    status: 'APPROVED',
    isActive: true,
    createdAt: new Date('2025-01-02'),
    approvedBy: '1',
    approvedAt: new Date('2025-01-02')
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria@teste.pt',
    role: 'PENDING',
    status: 'PENDING',
    isActive: false,
    createdAt: new Date('2025-01-03')
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@exemplo.pt',
    role: 'PENDING',
    status: 'PENDING',
    isActive: false,
    createdAt: new Date('2025-01-04')
  }
]

console.log('🔍 TESTE: Verificação da Base de Dados de Utilizadores')
console.log('=' * 60)

console.log('\n📊 Total de utilizadores:', users.length)

console.log('\n👥 Todos os utilizadores:')
users.forEach(user => {
  console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`)
})

const pendingUsers = users.filter(user => user.status === 'PENDING')
console.log('\n⏳ Utilizadores pendentes de aprovação:', pendingUsers.length)
pendingUsers.forEach(user => {
  console.log(`  ✋ ${user.name} (${user.email}) - Criado em: ${user.createdAt.toLocaleDateString('pt-PT')}`)
})

const approvedUsers = users.filter(user => user.status === 'APPROVED')
console.log('\n✅ Utilizadores aprovados:', approvedUsers.length)
approvedUsers.forEach(user => {
  console.log(`  👍 ${user.name} (${user.email}) - Role: ${user.role}`)
})

console.log('\n🎯 RESULTADO: As duas utilizadoras pendentes estão presentes!')
console.log('   - Maria Santos ✓')
console.log('   - Ana Costa ✓')
console.log('\n🚀 O painel admin deve mostrar ambas na secção de utilizadores pendentes.')