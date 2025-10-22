import React, { useState } from 'react'

interface Fornecedor {
  id: string
  nome: string
  email: string
  telefone: string
  empresa: string
  nif: string
  morada: string
  cidade: string
  codigoPostal: string
  pais: string
  contactoPrincipal: string
  categoria: string
  isActive: boolean
  createdAt: Date
}

export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([
    {
      id: '1',
      nome: 'António Costa',
      email: 'antonio@tecnoflex.pt',
      telefone: '930123456',
      empresa: 'TecnoFlex Lda',
      nif: '501234567',
      morada: 'Zona Industrial, Lote 12',
      cidade: 'Aveiro',
      codigoPostal: '3800-100',
      pais: 'Portugal',
      contactoPrincipal: 'António Costa',
      categoria: 'Tecnologia',
      isActive: true,
      createdAt: new Date('2025-01-10')
    },
    {
      id: '2',
      nome: 'Carlos Mendes',
      email: 'geral@materiaisdeconstrucao.pt',
      telefone: '940987654',
      empresa: 'Materiais de Construção S.A.',
      nif: '502345678',
      morada: 'Rua da Indústria, 89',
      cidade: 'Braga',
      codigoPostal: '4700-200',
      pais: 'Portugal',
      contactoPrincipal: 'Carlos Mendes',
      categoria: 'Construção',
      isActive: true,
      createdAt: new Date('2025-01-12')
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    nif: '',
    morada: '',
    cidade: '',
    codigoPostal: '',
    pais: 'Portugal',
    contactoPrincipal: '',
    categoria: ''
  })

  const categorias = [
    'Tecnologia',
    'Construção',
    'Alimentação',
    'Têxtil',
    'Automóvel',
    'Escritório',
    'Limpeza',
    'Outro'
  ]

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
      pais: 'Portugal',
      contactoPrincipal: '',
      categoria: ''
    })
    setEditingFornecedor(null)
  }

  const handleOpenModal = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor)
      setFormData({
        nome: fornecedor.nome,
        email: fornecedor.email,
        telefone: fornecedor.telefone,
        empresa: fornecedor.empresa,
        nif: fornecedor.nif,
        morada: fornecedor.morada,
        cidade: fornecedor.cidade,
        codigoPostal: fornecedor.codigoPostal,
        pais: fornecedor.pais,
        contactoPrincipal: fornecedor.contactoPrincipal,
        categoria: fornecedor.categoria
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
    
    if (editingFornecedor) {
      // Editar fornecedor existente
      setFornecedores(fornecedores.map(fornecedor => 
        fornecedor.id === editingFornecedor.id 
          ? { ...fornecedor, ...formData }
          : fornecedor
      ))
    } else {
      // Criar novo fornecedor
      const newFornecedor: Fornecedor = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
        createdAt: new Date()
      }
      setFornecedores([...fornecedores, newFornecedor])
    }
    
    handleCloseModal()
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja eliminar este fornecedor?')) {
      setFornecedores(fornecedores.filter(fornecedor => fornecedor.id !== id))
    }
  }

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Fornecedores</h2>
          <p className="text-gray-600">Gerir base de dados de fornecedores</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Novo Fornecedor
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Pesquisar fornecedores..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Fornecedores List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fornecedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Criação
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFornecedores.map((fornecedor) => (
              <tr key={fornecedor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{fornecedor.empresa}</div>
                    <div className="text-sm text-gray-500">NIF: {fornecedor.nif}</div>
                    <div className="text-sm text-gray-500">Contacto: {fornecedor.contactoPrincipal}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{fornecedor.email}</div>
                  <div className="text-sm text-gray-500">{fornecedor.telefone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {fornecedor.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{fornecedor.cidade}</div>
                  <div className="text-sm text-gray-500">{fornecedor.codigoPostal}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fornecedor.createdAt.toLocaleDateString('pt-PT')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(fornecedor)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(fornecedor.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredFornecedores.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum fornecedor encontrado
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.empresa}
                    onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">NIF *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.nif}
                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contacto Principal *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contactoPrincipal}
                    onChange={(e) => setFormData({...formData, contactoPrincipal: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Contacto *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone *</label>
                  <input
                    type="tel"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria *</label>
                  <select
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    <option value="">Selecionar categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Morada *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.morada}
                    onChange={(e) => setFormData({...formData, morada: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código Postal *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({...formData, codigoPostal: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">País *</label>
                  <select
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.pais}
                    onChange={(e) => setFormData({...formData, pais: e.target.value})}
                  >
                    <option value="Portugal">Portugal</option>
                    <option value="Espanha">Espanha</option>
                    <option value="França">França</option>
                    <option value="Alemanha">Alemanha</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingFornecedor ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}