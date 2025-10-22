import { useState, useMemo } from 'react'

interface DateCalculatorProps {}

export function DateCalculator({}: DateCalculatorProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-6">
        <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
          <span className="text-3xl">📅</span>
          <span>Calculadora de Datas</span>
        </h3>
        <p className="text-teal-100 mt-2">
          Calendário interativo e cálculo de intervalos de datas
        </p>
      </div>
      
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendário */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <h4 className="text-lg font-bold text-slate-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="text-xl">→</span>
              </button>
            </div>

            {/* Cabeçalhos dos dias */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
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
                    h-10 w-full text-sm rounded-lg transition-all duration-200 hover:bg-teal-100
                    ${isToday(day) ? 'bg-teal-500 text-white font-bold' : ''}
                    ${isSelectedDate(day) && !isToday(day) ? 'bg-teal-200 text-teal-800 font-medium' : ''}
                    ${!isCurrentMonth(day) ? 'text-slate-300' : 'text-slate-700'}
                    ${isCurrentMonth(day) && !isToday(day) && !isSelectedDate(day) ? 'hover:bg-slate-100' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              ))}
            </div>

            <div className="text-center text-sm text-slate-600 mt-4">
              Data selecionada: <span className="font-medium">{selectedDate.toLocaleDateString('pt-PT')}</span>
            </div>
          </div>

          {/* Calculador de diferença */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Selecione a data de início"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data do Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Selecione a data do fim"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            {startDate && endDate && (
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white">⏰</span>
                  </div>
                  <p className="text-slate-600 text-sm font-medium mb-2">Diferença Total</p>
                  <p className="text-3xl font-bold text-teal-700">
                    {daysDifference} {daysDifference === 1 ? 'dia' : 'dias'}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Início</p>
                      <p className="font-medium text-slate-700">
                        {new Date(startDate).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fim</p>
                      <p className="font-medium text-slate-700">
                        {new Date(endDate).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!startDate || !endDate ? (
              <div className="text-center py-8 text-slate-500">
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