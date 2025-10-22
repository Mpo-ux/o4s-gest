import { useState, useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './stores/themeStore'
import { LoginPage, DashboardPage, ClientesPage, FornecedoresPage } from './pages'
import { Navigation } from './components/Navigation'
import AdminPanel from './components/AdminPanel'

function App() {
  const { isAuthenticated } = useAuthStore()
  const { isDark } = useThemeStore()
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'clientes':
        return <ClientesPage />
      case 'fornecedores':
        return <FornecedoresPage />
      case 'produtos':
        return <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-slate-600'} transition-all duration-300`}>📦 Módulo Produtos - Em desenvolvimento</div>
      case 'rma':
        return <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-slate-600'} transition-all duration-300`}>🔄 Sistema RMA - Em desenvolvimento</div>
      case 'calendario':
        return <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-slate-600'} transition-all duration-300`}>📅 Calendário - Em desenvolvimento</div>
      case 'admin':
        return <AdminPanel />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'
    }`}>
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </div>
    </div>
  )
}

export default App