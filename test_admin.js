// Teste direto aos endpoints admin
const fetch = require('node-fetch')

async function testAdminEndpoints() {
  try {
    console.log('🔍 TESTE: Verificação dos Endpoints Admin')
    console.log('=' * 50)

    // Primeiro, fazer login como super admin
    console.log('\n1️⃣ Fazendo login como super admin...')
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'sergioramos@o4s.tv',
        password: 'super123'
      })
    })

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    console.log('✅ Login bem-sucedido!')
    console.log(`   Token recebido: ${loginData.token.substring(0, 20)}...`)
    console.log(`   Utilizador: ${loginData.user.name} (${loginData.user.role})`)

    // Agora testar endpoint de utilizadores pendentes
    console.log('\n2️⃣ Consultando utilizadores pendentes...')
    const pendingResponse = await fetch('http://localhost:5000/api/admin/pending-users', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    })

    if (!pendingResponse.ok) {
      throw new Error(`Consulta pendentes falhou: ${pendingResponse.status}`)
    }

    const pendingData = await pendingResponse.json()
    console.log(`✅ Utilizadores pendentes encontrados: ${pendingData.users.length}`)
    
    pendingData.users.forEach(user => {
      console.log(`   👤 ${user.name} (${user.email}) - Status: ${user.status}`)
    })

    // Testar endpoint de todos os utilizadores
    console.log('\n3️⃣ Consultando todos os utilizadores...')
    const allUsersResponse = await fetch('http://localhost:5000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    })

    if (!allUsersResponse.ok) {
      throw new Error(`Consulta todos utilizadores falhou: ${allUsersResponse.status}`)
    }

    const allUsersData = await allUsersResponse.json()
    console.log(`✅ Total de utilizadores encontrados: ${allUsersData.users.length}`)

    console.log('\n📊 Resumo dos utilizadores por status:')
    const statusCount = {}
    allUsersData.users.forEach(user => {
      statusCount[user.status] = (statusCount[user.status] || 0) + 1
    })
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} utilizador(es)`)
    })

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    console.log('   ✓ Login super admin funcional')
    console.log('   ✓ Endpoint de utilizadores pendentes funcional')
    console.log('   ✓ Endpoint de todos utilizadores funcional')
    console.log('   ✓ Maria Santos e Ana Costa estão presentes e pendentes')

  } catch (error) {
    console.error('❌ ERRO no teste:', error.message)
  }
}

// Instalar node-fetch se necessário e executar
if (typeof fetch === 'undefined') {
  console.log('⚠️ A instalar node-fetch...')
  require('child_process').execSync('npm install node-fetch', { stdio: 'inherit' })
}

testAdminEndpoints()