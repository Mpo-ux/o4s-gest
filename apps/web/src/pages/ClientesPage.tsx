import React, { useState } from 'react'
import { FileUpload } from '../components/FileUpload'
import { ImportModal } from '../components/ImportModal'
import { FileProcessor, ImportedData } from '../utils/fileProcessor'

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  empresa?: string
  nif?: string
  morada: string
  cidade: string
  codigoPostal: string
  pais: string
  isActive: boolean
  createdAt: Date
}

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      telefone: '910123456',
      empresa: 'Silva & Associados',
      nif: '123456789',
      morada: 'Rua das Flores, 123',
      cidade: 'Lisboa',
      codigoPostal: '1000-100',
      pais: 'Portugal',
      isActive: true,
      createdAt: new Date('2025-01-15')
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria.santos@empresa.pt',
      telefone: '920987654',
      empresa: 'Santos Comércio',
      nif: '987654321',
      morada: 'Avenida Central, 456',
      cidade: 'Porto',
      codigoPostal: '4000-200',
      pais: 'Portugal',
      isActive: true,
      createdAt: new Date('2025-01-20')
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [importedData, setImportedData] = useState<ImportedData | null>(null)
  const [showImportArea, setShowImportArea] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    nif: '',
    morada: '',
    cidade: '',
    codigoPostal: '',
    pais: 'Portugal'
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      nif: '',
      morada: '',
      cidade: '',
      codigoPostal: '',
      pais: 'Portugal'
    })
    setEditingCliente(null)
  }

  const handleFileSelect = async (file: File) => {
    try {
      const data = await FileProcessor.processFile(file)
      setImportedData(data)
      setIsImportModalOpen(true)
    } catch (error) {
      alert(`Erro ao processar ficheiro: ${error}`)
    }
  }

  const handleConfirmImport = (data: Record<string, any>[]) => {
    const newClientes: Cliente[] = data.map(row => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nome: row.nome || row.name || row.cliente || '',
      email: row.email || '',
      telefone: row.telefone || row.phone || '',
      empresa: row.empresa || row.company || '',
      nif: row.nif || '',
      morada: row.morada || row.address || '',
      cidade: row.cidade || row.city || '',
      codigoPostal: row.codigoPostal || row.zipCode || row.zip || '',
      pais: row.pais || row.country || 'Portugal',
      isActive: true,
      createdAt: new Date()
    }))

    setClientes([...clientes, ...newClientes])
    setIsImportModalOpen(false)
    setImportedData(null)
    setShowImportArea(false)
    alert(`${newClientes.length} clientes importados com sucesso!`)
  }

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        empresa: cliente.empresa || '',
        nif: cliente.nif || '',
        morada: cliente.morada,
        cidade: cliente.cidade,
        codigoPostal: cliente.codigoPostal,
        pais: cliente.pais
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCliente) {
      // Editar cliente existente
      setClientes(clientes.map(cliente => 
        cliente.id === editingCliente.id 
          ? { ...cliente, ...formData }
          : cliente
      ))
    } else {
      // Criar novo cliente
      const newCliente: Cliente = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
        createdAt: new Date()
      }
      setClientes([...clientes, newCliente])
    }
    
    handleCloseModal()
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja eliminar este cliente?')) {
      setClientes(clientes.filter(cliente => cliente.id !== id))
    }
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.empresa && cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                Gestão de Clientes
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Gerir e importar base de dados de clientes
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowImportArea(!showImportArea)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-500/25 flex items-center space-x-2"
              >
                <span className="text-lg">📥</span>
                <span>Importar</span>
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center space-x-2"
              >
                <span className="text-lg">➕</span>
                <span>Novo Cliente</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Clientes</p>
                  <p className="text-3xl font-bold">{clientes.length}</p>
                </div>
                <div className="text-4xl opacity-80">👥</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Clientes Ativos</p>
                  <p className="text-3xl font-bold">{clientes.filter(c => c.isActive).length}</p>
                </div>
                <div className="text-4xl opacity-80">✅</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Novos (Este Mês)</p>
                  <p className="text-3xl font-bold">
                    {clientes.filter(c => {
                      const thisMonth = new Date()
                      thisMonth.setDate(1)
                      return c.createdAt >= thisMonth
                    }).length}
                  </p>
                </div>
                <div className="text-4xl opacity-80">📈</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Pesquisar clientes por nome, email ou empresa..."
              className="w-full px-6 py-4 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 placeholder-slate-400 backdrop-blur-sm shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              title="Pesquisar clientes"
            />
          </div>
        </div>

        {/* Import Area */}
        {showImportArea && (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Importar Clientes</h3>
              <p className="text-slate-600">
                Importe ficheiros CSV ou Excel com dados de clientes. 
                Campos suportados: nome, email, telefone, empresa, nif, morada, cidade, codigoPostal, pais
              </p>
            </div>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedTypes={['.csv', '.xlsx', '.xls', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']}
              maxSize={10}
              title="Upload de Ficheiro de Clientes"
              description="Arraste ficheiro CSV ou Excel ou clique para selecionar"
            />

            <div className="mt-6">
              <button
                onClick={() => setShowImportArea(false)}
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                ✕ Fechar área de importação
              </button>
            </div>
          </div>
        )}

        {/* Clientes Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Localização
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Data Criação
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((cliente, index) => (
                  <tr key={cliente.id} className={`hover:bg-blue-50/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{cliente.nome}</div>
                          {cliente.empresa && (
                            <div className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full inline-block mt-1">
                              {cliente.empresa}
                            </div>
                          )}
                          {cliente.nif && (
                            <div className="text-xs text-slate-500 mt-1">NIF: {cliente.nif}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-slate-900 flex items-center space-x-2">
                          <span>📧</span>
                          <span>{cliente.email}</span>
                        </div>
                        <div className="text-sm text-slate-600 flex items-center space-x-2">
                          <span>📱</span>
                          <span>{cliente.telefone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-900 flex items-center space-x-2">
                          <span>🏙️</span>
                          <span>{cliente.cidade}</span>
                        </div>
                        <div className="text-xs text-slate-600">{cliente.codigoPostal}</div>
                        <div className="text-xs text-slate-500">{cliente.pais}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cliente.createdAt.toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(cliente)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-md"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-md"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredClientes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-slate-600 text-lg">Nenhum cliente encontrado</div>
                <div className="text-slate-400 text-sm mt-2">
                  {searchTerm ? 'Tente ajustar os termos de pesquisa' : 'Comece por adicionar o primeiro cliente'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clientes Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Localização
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Data Criação
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((cliente, index) => (
                  <tr key={cliente.id} className={`hover:bg-blue-50/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{cliente.nome}</div>
                          {cliente.empresa && (
                            <div className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full inline-block mt-1">
                              {cliente.empresa}
                            </div>
                          )}
                          {cliente.nif && (
                            <div className="text-xs text-slate-500 mt-1">NIF: {cliente.nif}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-slate-900 flex items-center space-x-2">
                          <span>📧</span>
                          <span>{cliente.email}</span>
                        </div>
                        <div className="text-sm text-slate-600 flex items-center space-x-2">
                          <span>📱</span>
                          <span>{cliente.telefone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-900 flex items-center space-x-2">
                          <span>🏙️</span>
                          <span>{cliente.cidade}</span>
                        </div>
                        <div className="text-xs text-slate-600">{cliente.codigoPostal}</div>
                        <div className="text-xs text-slate-500">{cliente.pais}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cliente.createdAt.toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(cliente)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-md"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-md"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredClientes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-slate-600 text-lg">Nenhum cliente encontrado</div>
                <div className="text-slate-400 text-sm mt-2">
                  {searchTerm ? 'Tente ajustar os termos de pesquisa' : 'Comece por adicionar o primeiro cliente'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold">
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo"
                      title="Nome do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@exemplo.com"
                      title="Email do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone *</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      placeholder="910 123 456"
                      title="Telefone do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Empresa</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.empresa}
                      onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                      placeholder="Nome da empresa"
                      title="Empresa do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">NIF</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.nif}
                      onChange={(e) => setFormData({...formData, nif: e.target.value})}
                      placeholder="123456789"
                      title="NIF do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">País *</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.pais}
                      onChange={(e) => setFormData({...formData, pais: e.target.value})}
                      title="País do cliente"
                    >
                      <option value="Portugal">Portugal</option>
                      <option value="Espanha">Espanha</option>
                      <option value="França">França</option>
                      <option value="Alemanha">Alemanha</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Morada *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.morada}
                    onChange={(e) => setFormData({...formData, morada: e.target.value})}
                    placeholder="Rua, número, andar"
                    title="Morada do cliente"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cidade *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      placeholder="Lisboa"
                      title="Cidade do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Código Postal *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({...formData, codigoPostal: e.target.value})}
                      placeholder="1000-100"
                      title="Código postal do cliente"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    {editingCliente ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false)
            setImportedData(null)
          }}
          importedData={importedData}
          type="cliente"
          onConfirmImport={handleConfirmImport}
        />
      </div>
    </div>
  )
}