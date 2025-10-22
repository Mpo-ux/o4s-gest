import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@business-app/types'
import { useConnectionStore } from './connection'
import ServerManager from '../utils/serverManager'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastLoginAttempt: Date | null
  lastSessionDate: string | null
  rememberMe: boolean
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  clearError: () => void
  verifyToken: () => Promise<boolean>
  refreshAuth: () => Promise<void>
  makeApiRequest: (url: string, options?: RequestInit) => Promise<any>
}

const API_BASE_URL = 'http://localhost:5000/api'

const makeApiRequest = async (url: string, options: RequestInit = {}) => {
  const connectionStore = useConnectionStore.getState()
  
  // Check if backend is connected
  if (!connectionStore.isBackendConnected) {
    const isConnected = await connectionStore.checkConnection()
    if (!isConnected) {
      throw new Error('Servidor não disponível. A tentar reconectar...')
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(10000) // 10 second timeout
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro de conexão' }))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastLoginAttempt: null,
      lastSessionDate: null,
      rememberMe: false,

      login: async (email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; message?: string }> => {
        set({ isLoading: true, error: null, lastLoginAttempt: new Date() })
        
        try {
          // Inicia servidores se necessário
          const serverManager = ServerManager.getInstance()
          await serverManager.startServers()
          
          const data = await makeApiRequest(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          })
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastSessionDate: new Date().toISOString(),
            rememberMe: rememberMe,
          })

          console.log('🔐 Token armazenado no store:', data.token.substring(0, 20) + '...')
          
          return { success: true }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro de autenticação'
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })

          return { success: false, message: errorMessage }
        }
      },

      logout: () => {
        // Para os servidores antes de fazer logout
        const serverManager = ServerManager.getInstance()
        serverManager.stopServers().catch(console.error)
        
        // Clear all auth data immediately
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          rememberMe: false,
        })
        
        // Clear localStorage/sessionStorage immediately
        localStorage.removeItem('auth-storage')
        sessionStorage.removeItem('auth-storage')
        
        console.log('🚪 Logout realizado - sessão e servidores terminados imediatamente')
      },

      clearError: () => {
        set({ error: null })
      },

      verifyToken: async (): Promise<boolean> => {
        const currentState = get()
        const token = currentState.token
        
        console.log('🔍 Verificando token do store:', token ? token.substring(0, 20) + '...' : 'Nenhum token')
        
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null })
          return false
        }

        try {
          const data = await makeApiRequest(`${API_BASE_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          set({
            user: data.user,
            token,
            isAuthenticated: true,
            error: null,
          })
          
          return true
        } catch (error) {
          console.warn('Token verification failed:', error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
          return false
        }
      },

      refreshAuth: async (): Promise<void> => {
        const currentState = get()
        if (currentState.isAuthenticated && currentState.token) {
          await currentState.verifyToken()
        }
      },

      makeApiRequest: async (url: string, options: RequestInit = {}) => {
        const connectionStore = useConnectionStore.getState()
        const currentState = get()
        
        // Check if backend is connected
        if (!connectionStore.isBackendConnected) {
          const isConnected = await connectionStore.checkConnection()
          if (!isConnected) {
            throw new Error('Servidor não disponível. A tentar reconectar...')
          }
        }

        // Add authentication headers if logged in
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.headers as Record<string, string>,
        }

        if (currentState.token) {
          headers.Authorization = `Bearer ${currentState.token}`
          console.log('🔑 Enviando token de autenticação:', currentState.token.substring(0, 20) + '...')
        } else {
          console.log('❌ Nenhum token disponível para autenticação')
        }

        const fullUrl = url.startsWith('http') ? url : 
          url.startsWith('/api') ? `http://localhost:5000${url}` : `${API_BASE_URL}${url}`

        const response = await fetch(fullUrl, {
          ...options,
          headers,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Erro de conexão' }))
          throw new Error(errorData.message || `HTTP ${response.status}`)
        }

        return response
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastSessionDate: state.lastSessionDate,
        rememberMe: state.rememberMe,
      }),
    }
  )
)