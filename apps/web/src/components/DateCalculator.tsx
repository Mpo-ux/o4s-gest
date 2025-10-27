import { useState, useMemo, useEffect } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { useModuleProtection } from '../utils/useModuleProtection'

interface DateCalculatorProps {}

export function DateCalculator({}: DateCalculatorProps) {
  const { isDark } = useThemeStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 🛡️ Sistema de Proteção do Módulo
  const moduleProtection = useModuleProtection({
    moduleId: 'date-calculator',
    moduleName: 'Calculadora de Datas',
    version: '2.1.0',
    autoRegister: true,
    features: [
      'calendar-navigation',
      'date-calculation', 
      'dark-theme-support',
      'month-year-selector',
      'quick-navigation',
      'today-button'
    ],
    dependencies: ['theme-store'],
    themeCompatible: true
  })

  // Registrar módulo com conteúdo atual
  useEffect(() => {
    const moduleContent = `
      // DateCalculator v2.1.0 - Enhanced Calendar with Protection
      // Features: Calendar Navigation, Date Calculation, Dark Theme Support
      // Dependencies: theme-store
      // Last Update: ${new Date().toISOString()}
      
      Features Implemented:
      - ✅ Calendar navigation with month/year selectors
      - ✅ Date calculation between two dates
      - ✅ Dark theme compatibility
      - ✅ Today button and quick navigation
      - ✅ Extended year range (2005-2045)
      - ✅ Responsive design
      - ✅ Accessibility features (aria-labels)
      - ✅ Module protection system integrated
    `
    
    moduleProtection.registerModule(moduleContent)
  }, [moduleProtection])

  // Monitor de compatibilidade com tema
  useEffect(() => {
    if (!moduleProtection.state.isThemeCompatible) {
      console.warn('⚠️ DateCalculator: Compatibilidade com tema comprometida')
    }
  }, [moduleProtection.state.isThemeCompatible])

  // Calcular diferença entre datas
  const daysDifference = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [startDate, endDate])

  // Obter dados do mês atual
  const currentMonthData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || days.length < 42) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
      if (days.length >= 42) break
    }
    
    return { days, firstDay, lastDay }
  }, [currentMonth])

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToMonth = (year: number, month: number) => {
    setCurrentMonth(new Date(year, month, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const selectDate = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} rounded-2xl shadow-xl border overflow-hidden transition-all duration-300`}>
      <div className={`bg-gradient-to-r ${isDark ? 'from-teal-600 to-cyan-700' : 'from-teal-500 to-cyan-600'} px-8 py-6`}>
        <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
          <span className="text-3xl">📅</span>
          <span>Calculadora de Datas</span>
          {/* 🛡️ Indicador de Proteção */}
          {moduleProtection.state.isProtected && (
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center space-x-1">
                <span>🛡️</span>
                <span>v2.1.0</span>
              </span>
              {moduleProtection.state.hasBackups && (
                <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full">
                  {moduleProtection.state.backupCount} backups
                </span>
              )}
            </div>
          )}
        </h3>
        <p className="text-teal-100 mt-2">
          Calendário interativo e cálculo de intervalos de datas
          {moduleProtection.state.isThemeCompatible && (
            <span className="ml-2 text-xs opacity-75">• Tema Compatível</span>
          )}
        </p>
      </div>
      
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendário */}
          <div className="space-y-4">
            {/* Navegação do calendário */}
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousMonth}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Mês anterior"
              >
                <span className="text-xl">←</span>
              </button>
              
              <div className="flex items-center space-x-2">
                {/* Seletor de mês */}
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => goToMonth(currentMonth.getFullYear(), parseInt(e.target.value))}
                  aria-label="Selecionar mês"
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 focus:ring-2 focus:ring-teal-500' 
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-teal-500'
                  }`}
                >
                  {monthNames.map((name, index) => (
                    <option key={index} value={index}>{name}</option>
                  ))}
                </select>

                {/* Seletor de ano */}
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => goToMonth(parseInt(e.target.value), currentMonth.getMonth())}
                  aria-label="Selecionar ano"
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 focus:ring-2 focus:ring-teal-500' 
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-teal-500'
                  }`}
                >
                  {Array.from({ length: 41 }, (_, i) => {
                    const year = new Date().getFullYear() - 20 + i
                    return (
                      <option key={year} value={year}>{year}</option>
                    )
                  })}
                </select>

                {/* Botão Hoje */}
                <button
                  onClick={goToToday}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                  title="Ir para hoje"
                >
                  Hoje
                </button>
              </div>

              <button
                onClick={goToNextMonth}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                title="Próximo mês"
              >
                <span className="text-xl">→</span>
              </button>
            </div>

            {/* Cabeçalhos dos dias */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className={`text-center text-sm font-medium py-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {currentMonthData.days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => selectDate(day)}
                  className={`
                    h-10 w-full text-sm rounded-lg transition-all duration-200
                    ${isToday(day) ? 'bg-teal-500 text-white font-bold' : ''}
                    ${isSelectedDate(day) && !isToday(day) ? 'bg-teal-200 text-teal-800 font-medium' : ''}
                    ${!isCurrentMonth(day) 
                      ? (isDark ? 'text-gray-600' : 'text-slate-300') 
                      : (isDark ? 'text-gray-300' : 'text-slate-700')
                    }
                    ${isCurrentMonth(day) && !isToday(day) && !isSelectedDate(day) 
                      ? (isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-100') 
                      : ''
                    }
                    ${!isCurrentMonth(day) || isToday(day) || isSelectedDate(day) 
                      ? '' 
                      : (isDark ? 'hover:bg-teal-600 hover:text-white' : 'hover:bg-teal-100')
                    }
                  `}
                >
                  {day.getDate()}
                </button>
              ))}
            </div>

            <div className={`text-center text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Data selecionada: <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{selectedDate.toLocaleDateString('pt-PT')}</span>
            </div>

            {/* Navegação rápida por anos */}
            <div className={`flex items-center justify-center space-x-2 pt-4 border-t ${isDark ? 'border-gray-600' : 'border-slate-200'}`}>
              <button
                onClick={() => goToMonth(currentMonth.getFullYear() - 1, currentMonth.getMonth())}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Ano anterior"
              >
                {currentMonth.getFullYear() - 1}
              </button>
              <span className={`px-2 py-1 text-xs font-medium ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => goToMonth(currentMonth.getFullYear() + 1, currentMonth.getMonth())}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Próximo ano"
              >
                {currentMonth.getFullYear() + 1}
              </button>
            </div>
          </div>

          {/* Calculador de diferença */}
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Selecione a data de início"
                className={`w-full px-4 py-3 border rounded-lg transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                Data do Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Selecione a data do fim"
                className={`w-full px-4 py-3 border rounded-lg transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400' 
                    : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500'
                }`}
              />
            </div>

            {startDate && endDate && (
              <div className={`rounded-xl p-6 border ${
                isDark 
                  ? 'bg-gradient-to-r from-teal-900/50 to-cyan-900/50 border-teal-700' 
                  : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
              }`}>
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${isDark ? 'from-teal-600 to-cyan-700' : 'from-teal-500 to-cyan-600'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl text-white">⏰</span>
                  </div>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Diferença Total</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                    {daysDifference} {daysDifference === 1 ? 'dia' : 'dias'}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Início</p>
                      <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
                        {new Date(startDate).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Fim</p>
                      <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
                        {new Date(endDate).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!startDate || !endDate ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                <span className="text-4xl mb-2 block">📝</span>
                <p>Preencha ambas as datas para calcular a diferença</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}