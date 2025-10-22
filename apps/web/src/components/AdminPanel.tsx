import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { User, UserRole } from '@business-app/types'

interface PendingUser extends User {
  requestDate: string
}

const AdminPanel: React.FC = () => {
  const { user, makeApiRequest, verifyToken } = useAuthStore()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: UserRole.USER,
    password: ''
  })
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Verificar se o utilizador é super admin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    console.log('🔍 AdminPanel useEffect - user:', user)
    console.log('🔍 AdminPanel useEffect - isSuperAdmin:', isSuperAdmin)
    
    // Verificar token primeiro se não houver utilizador
    if (!user) {
      console.log('👤 Nenhum utilizador carregado, a verificar token...')
      verifyToken()
    } else if (isSuperAdmin) {
      console.log('✅ Super admin confirmado, a carregar dados...')
      loadPendingUsers()
      loadAllUsers()
    }
  }, [user, isSuperAdmin, verifyToken])

  const loadPendingUsers = async () => {
    try {
      console.log('🔍 AdminPanel: Carregando utilizadores pendentes...')
      setLoading(true)
      const response = await makeApiRequest('/api/admin/pending-users', {
        method: 'GET'
      })
      
      console.log('📊 AdminPanel: Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 AdminPanel: Dados recebidos:', data)
        console.log('👥 AdminPanel: Utilizadores pendentes:', data.users?.length || 0)
        setPendingUsers(data.users || [])
      } else {
        console.error('❌ AdminPanel: Resposta não OK:', response.status)
      }
    } catch (error) {
      console.error('💥 AdminPanel: Erro ao carregar utilizadores pendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllUsers = async () => {
    try {
      console.log('🔍 AdminPanel: Carregando todos os utilizadores...')
      const response = await makeApiRequest('/api/admin/users', {
        method: 'GET'
      })
      
      console.log('📊 AdminPanel: All users response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 AdminPanel: Todos os utilizadores:', data)
        console.log('👥 AdminPanel: Total utilizadores:', data.users?.length || 0)
        setAllUsers(data.users || [])
      } else {
        console.error('❌ AdminPanel: Resposta não OK para todos utilizadores:', response.status)
      }
    } catch (error) {
      console.error('💥 AdminPanel: Erro ao carregar utilizadores:', error)
    }
  }

  const approveUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(`/api/admin/users/${userId}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Utilizador aprovado com sucesso!')
        loadPendingUsers()
        loadAllUsers()
      } else {
        alert('Erro ao aprovar utilizador')
      }
    } catch (error) {
      console.error('Erro ao aprovar utilizador:', error)
      alert('Erro ao aprovar utilizador')
    }
  }

  const rejectUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(`/api/admin/users/${userId}/reject`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Utilizador rejeitado!')
        loadPendingUsers()
      } else {
        alert('Erro ao rejeitar utilizador')
      }
    } catch (error) {
      console.error('Erro ao rejeitar utilizador:', error)
      alert('Erro ao rejeitar utilizador')
    }
  }

  const suspendUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(`/api/admin/users/${userId}/suspend`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Utilizador suspenso!')
        loadAllUsers()
      } else {
        alert('Erro ao suspender utilizador')
      }
    } catch (error) {
      console.error('Erro ao suspender utilizador:', error)
      alert('Erro ao suspender utilizador')
    }
  }

  const activateUser = async (userId: string) => {
    try {
      const response = await makeApiRequest(`/api/admin/users/${userId}/activate`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Utilizador ativado!')
        loadAllUsers()
      } else {
        alert('Erro ao ativar utilizador')
      }
    } catch (error) {
      console.error('Erro ao ativar utilizador:', error)
      alert('Erro ao ativar utilizador')
    }
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Todos os campos são obrigatórios')
      return
    }

    try {
      const response = await makeApiRequest('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        alert('Utilizador criado com sucesso!')
        setNewUser({ name: '', email: '', role: UserRole.USER, password: '' })
        setShowCreateForm(false)
        loadAllUsers()
      } else {
        const error = await response.json()
        alert(`Erro ao criar utilizador: ${error.message}`)
      }
    } catch (error) {
      console.error('Erro ao criar utilizador:', error)
      alert('Erro ao criar utilizador')
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔒</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Acesso Negado</h2>
                <p className="text-red-100 mt-2">
                  Apenas Super Administradores podem aceder a esta página.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white">⚙️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Painel de Administração
                </h1>
                <p className="text-slate-600 mt-1">
                  Gestão de utilizadores e permissões do sistema
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center space-x-2 ${
                showCreateForm
                  ? 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-600/25'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-600/25'
              }`}
            >
              <span>{showCreateForm ? '✕' : '✚'}</span>
              <span>{showCreateForm ? 'Cancelar' : 'Criar Utilizador'}</span>
            </button>
          </div>
        </div>

        {/* Formulário de Criação de Utilizador */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                <span className="text-3xl">👤</span>
                <span>Criar Novo Utilizador</span>
              </h2>
              <p className="text-blue-100 mt-2">
                Adicione um novo utilizador ao sistema com as permissões adequadas
              </p>
            </div>
            <div className="p-8">
              <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                    placeholder="joao.silva@empresa.pt"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Nível de Acesso
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                    title="Selecionar nível de acesso"
                  >
                    <option value={UserRole.USER}>👤 Utilizador</option>
                    <option value={UserRole.ADMIN}>👨‍💼 Administrador</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                    placeholder="Password segura"
                    required
                  />
                </div>
                
                <div className="md:col-span-2 flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-600/25 flex items-center justify-center space-x-2"
                  >
                    <span>✅</span>
                    <span>Criar Utilizador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-slate-600/25 flex items-center justify-center space-x-2"
                  >
                    <span>❌</span>
                    <span>Cancelar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Utilizadores Pendentes */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <span className="text-3xl">⏳</span>
              <span>Utilizadores Pendentes de Aprovação</span>
            </h2>
            <p className="text-amber-100 mt-2">
              Utilizadores que aguardam aprovação para aceder ao sistema
            </p>
          </div>
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-slate-600 font-medium">A carregar...</span>
                </div>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl text-slate-400">✅</span>
                </div>
                <p className="text-slate-600 text-lg font-medium">
                  Não há utilizadores pendentes de aprovação
                </p>
                <p className="text-slate-500 mt-2">
                  Todos os utilizadores foram processados
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((pendingUser) => (
                  <div
                    key={pendingUser.id}
                    className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {pendingUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{pendingUser.name}</h3>
                          <p className="text-slate-600 flex items-center space-x-2">
                            <span>📧</span>
                            <span>{pendingUser.email}</span>
                          </p>
                          <p className="text-sm text-slate-500 flex items-center space-x-2 mt-1">
                            <span>📅</span>
                            <span>
                              Solicitado em: {new Date(pendingUser.createdAt).toLocaleDateString('pt-PT')}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => approveUser(pendingUser.id)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-green-600/25 flex items-center space-x-2"
                        >
                          <span>✅</span>
                          <span>Aprovar</span>
                        </button>
                        <button
                          onClick={() => rejectUser(pendingUser.id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-red-600/25 flex items-center space-x-2"
                        >
                          <span>❌</span>
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Todos os Utilizadores */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Todos os Utilizadores</h2>
        </div>
        <div className="p-6">
          {allUsers.length === 0 ? (
            <p className="text-gray-600">Não há utilizadores registados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          u.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          u.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          u.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {u.role !== 'SUPER_ADMIN' && (
                          <div className="flex space-x-2">
                            {u.status === 'APPROVED' && u.isActive && (
                              <button
                                onClick={() => suspendUser(u.id)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                Suspender
                              </button>
                            )}
                            {u.status === 'SUSPENDED' && (
                              <button
                                onClick={() => activateUser(u.id)}
                                className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Ativar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}

export default AdminPanel