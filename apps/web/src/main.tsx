import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Performance monitoring para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // Monitor de performance
  console.log('🛠️ Development mode: Performance monitoring enabled')
  
  // Web Vitals (se disponível)
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        console.log(`📊 ${entry.name}: ${entry.duration.toFixed(2)}ms`)
      })
    })
    
    try {
      observer.observe({ entryTypes: ['navigation', 'paint'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)