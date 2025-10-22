import { create } from 'zustand'

interface ConnectionState {
  isOnline: boolean
  isBackendConnected: boolean
  lastConnectionCheck: Date | null
  retryCount: number
  maxRetries: number
  
  // Actions
  setOnline: (status: boolean) => void
  setBackendConnected: (status: boolean) => void
  incrementRetry: () => void
  resetRetry: () => void
  checkConnection: () => Promise<boolean>
}

const API_BASE_URL = 'http://localhost:5000'

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isOnline: navigator.onLine,
  isBackendConnected: false,
  lastConnectionCheck: null,
  retryCount: 0,
  maxRetries: 3,

  setOnline: (status: boolean) => set({ isOnline: status }),
  
  setBackendConnected: (status: boolean) => set({ 
    isBackendConnected: status,
    lastConnectionCheck: new Date(),
    retryCount: status ? 0 : get().retryCount
  }),

  incrementRetry: () => set(state => ({ 
    retryCount: state.retryCount + 1 
  })),

  resetRetry: () => set({ retryCount: 0 }),

  checkConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      const isConnected = response.ok
      get().setBackendConnected(isConnected)
      
      if (isConnected) {
        get().resetRetry()
      }
      
      return isConnected
    } catch (error) {
      console.warn('Backend connection check failed:', error)
      get().setBackendConnected(false)
      get().incrementRetry()
      return false
    }
  }
}))

// Setup connection monitoring
if (typeof window !== 'undefined') {
  // Monitor online/offline status
  window.addEventListener('online', () => {
    useConnectionStore.getState().setOnline(true)
    useConnectionStore.getState().checkConnection()
  })
  
  window.addEventListener('offline', () => {
    useConnectionStore.getState().setOnline(false)
    useConnectionStore.getState().setBackendConnected(false)
  })

  // Periodic backend health check
  setInterval(() => {
    if (navigator.onLine) {
      useConnectionStore.getState().checkConnection()
    }
  }, 30000) // Check every 30 seconds

  // Initial connection check
  useConnectionStore.getState().checkConnection()
}