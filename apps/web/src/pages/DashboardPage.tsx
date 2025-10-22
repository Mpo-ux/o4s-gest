import { useAuthStore } from '../store/auth'
import { DateCalculator } from '../components/DateCalculator'

export function DashboardPage() {
  const { user, lastSessionDate } = useAuthStore()

  const modules = [
    {
      icon: '📦',
      title: 'Produtos',
      description: 'Gestão completa do catálogo de produtos',
      color: 'from-blue-500 to-blue-600',
      stats: '156 produtos',
      bgColor: 'from-blue-50 to-blue-100',
      iconBg: 'from-blue-500 to-blue-600'
    },
    {
      icon: '👥',
      title: 'Clientes',
      description: 'Base de dados de clientes e contactos',
      color: 'from-green-500 to-green-600',
      stats: '89 clientes',
      bgColor: 'from-green-50 to-green-100',
      iconBg: 'from-green-500 to-green-600'
    },
    {
      icon: '🏢',
      title: 'Fornecedores',
      description: 'Gestão de fornecedores e parcerias',
      color: 'from-purple-500 to-purple-600',
      stats: '23 fornecedores',
      bgColor: 'from-purple-50 to-purple-100',
      iconBg: 'from-purple-500 to-purple-600'
    },
    {
      icon: '🔄',
      title: 'RMAs',
      description: 'Sistema de devoluções e trocas',
      color: 'from-orange-500 to-orange-600',
      stats: '12 pendentes',
      bgColor: 'from-orange-50 to-orange-100',
      iconBg: 'from-orange-500 to-orange-600'
    },
    {
      icon: '📅',
      title: 'Calendário',
      description: 'Agendamentos e eventos importantes',
      color: 'from-teal-500 to-teal-600',
      stats: '5 eventos hoje',
      bgColor: 'from-teal-50 to-teal-100',
      iconBg: 'from-teal-500 to-teal-600'
    },
    {
      icon: '📊',
      title: 'Relatórios',
      description: 'Análises e estatísticas do negócio',
      color: 'from-indigo-500 to-indigo-600',
      stats: 'Ver análises',
      bgColor: 'from-indigo-50 to-indigo-100',
      iconBg: 'from-indigo-500 to-indigo-600'
    }
  ]

  // Adicionar módulo admin se for administrador
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    modules.push({
      icon: '⚙️',
      title: 'Administração',
      description: 'Gestão de utilizadores e sistema',
      color: 'from-red-500 to-red-600',
      stats: 'Painel admin',
      bgColor: 'from-red-50 to-red-100',
      iconBg: 'from-red-500 to-red-600'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Dashboard
          </h1>
          <p className="text-xl text-slate-600">
            Bem-vindo ao O4S gest
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  Olá, {user?.name}!
                </h2>
                <p className="text-blue-100 text-sm">
                  Logado como{' '}
                  <span className="font-medium bg-white/20 px-2 py-0.5 rounded">
                    {user?.role}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm font-medium">
                {new Date().toLocaleDateString('pt-PT', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              {lastSessionDate && (
                <p className="text-blue-200 text-xs mt-1">
                  Última sessão: {new Date(lastSessionDate).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-white">💰</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm font-medium">Vendas do Mês</p>
                <p className="text-2xl font-bold text-slate-800">€45,280</p>
                <p className="text-green-600 text-xs font-medium">+12.5% vs mês anterior</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-white">📋</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm font-medium">Encomendas</p>
                <p className="text-2xl font-bold text-slate-800">167</p>
                <p className="text-blue-600 text-xs font-medium">23 por processar</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-white">👥</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm font-medium">Clientes Ativos</p>
                <p className="text-2xl font-bold text-slate-800">89</p>
                <p className="text-purple-600 text-xs font-medium">+5 novos esta semana</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-white">⚠️</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm font-medium">Alertas</p>
                <p className="text-2xl font-bold text-slate-800">7</p>
                <p className="text-orange-600 text-xs font-medium">3 stock baixo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Calculator Component */}
        <DateCalculator />

        {/* Modules Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Módulos do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className={`bg-gradient-to-r ${module.bgColor} p-6`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${module.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl text-white">{module.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{module.title}</h3>
                      <p className="text-slate-600 text-sm font-medium">{module.stats}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 leading-relaxed">
                    {module.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                    <span>Aceder ao módulo</span>
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}