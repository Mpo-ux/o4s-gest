/**
 * AuthenticationCache - Sistema de Cache de Autenticação
 * 
 * Sistema especializado para cache de tokens, dados de utilizador,
 * sessões ativas e informações de autenticação.
 * 
 * Funcionalidades:
 * - Cache seguro de tokens JWT com renovação automática
 * - Gestão de sessões com expiração inteligente
 * - Cache de dados de utilizador com invalidação automática
 * - Monitorização de utilizadores online
 * - Detecção de sessões múltiplas
 */

import CacheManager from './cacheManager'

interface TokenInfo {
  token: string
  refreshToken?: string
  expiresAt: number
  issuedAt: number
  userId: string
  userRole: string
  sessionId: string
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
  status: string
  isActive: boolean
  lastActivity: number
  preferences?: Record<string, any>
  permissions?: string[]
}

interface SessionInfo {
  sessionId: string
  userId: string
  startTime: number
  lastActivity: number
  ipAddress?: string
  userAgent?: string
  isActive: boolean
  expiresAt: number
}

interface OnlineUser {
  userId: string
  name: string
  email: string
  role: string
  sessionId: string
  loginTime: number
  lastActivity: number
  ipAddress?: string
  userAgent?: string
}

export class AuthenticationCache {
  private static instance: AuthenticationCache
  private cacheManager: CacheManager
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutos antes de expirar
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 horas
  private readonly ACTIVITY_UPDATE_INTERVAL = 30 * 1000 // 30 segundos
  private activityInterval: NodeJS.Timeout | null = null
  private refreshCallbacks = new Set<() => Promise<void>>()

  private constructor() {
    this.cacheManager = CacheManager.getInstance()
    this.initializeActivityTracking()
  }

  public static getInstance(): AuthenticationCache {
    if (!AuthenticationCache.instance) {
      AuthenticationCache.instance = new AuthenticationCache()
    }
    return AuthenticationCache.instance
  }

  /**
   * Armazena informações de token após login
   */
  public async setTokenInfo(tokenData: Partial<TokenInfo>): Promise<boolean> {
    try {
      const tokenInfo: TokenInfo = {
        token: tokenData.token!,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
        issuedAt: tokenData.issuedAt || Date.now(),
        userId: tokenData.userId!,
        userRole: tokenData.userRole!,
        sessionId: tokenData.sessionId!
      }

      await this.cacheManager.set('auth_token', tokenInfo, {
        ttl: tokenInfo.expiresAt - Date.now(),
        strategy: 'hybrid',
        priority: 'critical',
        tags: ['auth', 'token']
      })

      console.log(`🔐 Token cached for user ${tokenInfo.userId} (expires: ${new Date(tokenInfo.expiresAt).toLocaleTimeString()})`)
      
      // Agendar renovação automática se necessário
      this.scheduleTokenRefresh(tokenInfo)

      return true

    } catch (error) {
      console.error('❌ Failed to cache token info:', error)
      return false
    }
  }

  /**
   * Obtém informações de token
   */
  public async getTokenInfo(): Promise<TokenInfo | null> {
    try {
      const tokenInfo = await this.cacheManager.get<TokenInfo>('auth_token')
      
      if (!tokenInfo) {
        return null
      }

      // Verificar se token está próximo de expirar
      if (this.isTokenNearExpiry(tokenInfo)) {
        console.log('⚠️ Token near expiry, attempting refresh...')
        await this.triggerTokenRefresh()
      }

      return tokenInfo

    } catch (error) {
      console.error('❌ Failed to get token info:', error)
      return null
    }
  }

  /**
   * Armazena dados do utilizador
   */
  public async setUserData(userData: UserData): Promise<boolean> {
    try {
      const userDataWithActivity = {
        ...userData,
        lastActivity: Date.now()
      }

      await this.cacheManager.set(`user_data_${userData.id}`, userDataWithActivity, {
        ttl: this.SESSION_TIMEOUT,
        strategy: 'hybrid',
        priority: 'high',
        tags: ['auth', 'user-data', userData.role]
      })

      // Cache também por sessão atual
      const tokenInfo = await this.getTokenInfo()
      if (tokenInfo?.sessionId) {
        await this.cacheManager.set('current_user', userDataWithActivity, {
          ttl: this.SESSION_TIMEOUT,
          strategy: 'memory',
          priority: 'critical',
          tags: ['auth', 'current-user']
        })
      }

      console.log(`👤 User data cached for ${userData.name} (${userData.role})`)
      return true

    } catch (error) {
      console.error('❌ Failed to cache user data:', error)
      return false
    }
  }

  /**
   * Obtém dados do utilizador atual
   */
  public async getCurrentUser(): Promise<UserData | null> {
    try {
      // Tentar cache de utilizador atual primeiro
      let userData = await this.cacheManager.get<UserData>('current_user')
      
      if (!userData) {
        // Fallback para token info
        const tokenInfo = await this.getTokenInfo()
        if (tokenInfo) {
          userData = await this.cacheManager.get<UserData>(`user_data_${tokenInfo.userId}`)
        }
      }

      if (userData) {
        // Atualizar última atividade
        await this.updateUserActivity(userData.id)
      }

      return userData

    } catch (error) {
      console.error('❌ Failed to get current user:', error)
      return null
    }
  }

  /**
   * Regista utilizador como online
   */
  public async setUserOnline(userInfo: Omit<OnlineUser, 'loginTime' | 'lastActivity'>): Promise<boolean> {
    try {
      const onlineUser: OnlineUser = {
        ...userInfo,
        loginTime: Date.now(),
        lastActivity: Date.now()
      }

      // Cache de utilizador online
      await this.cacheManager.set(`online_user_${userInfo.userId}`, onlineUser, {
        ttl: this.SESSION_TIMEOUT,
        strategy: 'memory',
        priority: 'high',
        tags: ['auth', 'online-users']
      })

      // Criar informação de sessão
      const sessionInfo: SessionInfo = {
        sessionId: userInfo.sessionId,
        userId: userInfo.userId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        isActive: true,
        expiresAt: Date.now() + this.SESSION_TIMEOUT
      }

      await this.cacheManager.set(`session_${userInfo.sessionId}`, sessionInfo, {
        ttl: this.SESSION_TIMEOUT,
        strategy: 'hybrid',
        priority: 'high',
        tags: ['auth', 'sessions']
      })

      console.log(`🟢 User ${userInfo.name} is now online (session: ${userInfo.sessionId})`)
      return true

    } catch (error) {
      console.error('❌ Failed to set user online:', error)
      return false
    }
  }

  /**
   * Remove utilizador do estado online
   */
  public async setUserOffline(userId: string): Promise<boolean> {
    try {
      // Remover do cache de utilizadores online
      await this.cacheManager.remove(`online_user_${userId}`)

      // Invalidar sessões do utilizador
      const sessions = await this.getUserSessions(userId)
      for (const session of sessions) {
        await this.invalidateSession(session.sessionId)
      }

      console.log(`🔴 User ${userId} is now offline`)
      return true

    } catch (error) {
      console.error('❌ Failed to set user offline:', error)
      return false
    }
  }

  /**
   * Obtém lista de utilizadores online
   */
  public async getOnlineUsers(): Promise<OnlineUser[]> {
    try {
      // Implementação simplificada - em produção seria otimizada
      const onlineUsers: OnlineUser[] = []
      
      // Scan do cache (implementação placeholder)
      // Em produção, manteria um índice separado
      
      return onlineUsers

    } catch (error) {
      console.error('❌ Failed to get online users:', error)
      return []
    }
  }

  /**
   * Verifica se utilizador está online
   */
  public async isUserOnline(userId: string): Promise<boolean> {
    try {
      const onlineUser = await this.cacheManager.get<OnlineUser>(`online_user_${userId}`)
      return onlineUser !== null

    } catch (error) {
      console.error('❌ Failed to check if user is online:', error)
      return false
    }
  }

  /**
   * Obtém sessões ativas do utilizador
   */
  public async getUserSessions(_userId: string): Promise<SessionInfo[]> {
    try {
      // Implementação simplificada
      const sessions: SessionInfo[] = []
      
      // Em produção, manteria um índice de sessões por utilizador
      
      return sessions

    } catch (error) {
      console.error('❌ Failed to get user sessions:', error)
      return []
    }
  }

  /**
   * Invalida sessão específica
   */
  public async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.cacheManager.get<SessionInfo>(`session_${sessionId}`)
      
      if (session) {
        // Marcar sessão como inativa
        session.isActive = false
        
        await this.cacheManager.set(`session_${sessionId}`, session, {
          ttl: 60000, // Manter por 1 minuto para logs
          strategy: 'memory',
          priority: 'low',
          tags: ['auth', 'invalid-sessions']
        })

        // Remover utilizador online se esta era a única sessão
        const userSessions = await this.getUserSessions(session.userId)
        const activeSessions = userSessions.filter(s => s.isActive && s.sessionId !== sessionId)
        
        if (activeSessions.length === 0) {
          await this.cacheManager.remove(`online_user_${session.userId}`)
        }

        console.log(`❌ Session invalidated: ${sessionId}`)
        return true
      }

      return false

    } catch (error) {
      console.error('❌ Failed to invalidate session:', error)
      return false
    }
  }

  /**
   * Limpa cache de autenticação (logout)
   */
  public async clearAuthCache(): Promise<void> {
    try {
      // Obter dados do utilizador atual antes de limpar
      const currentUser = await this.getCurrentUser()
      const tokenInfo = await this.getTokenInfo()

      // Remover token e dados do utilizador atual
      await this.cacheManager.remove('auth_token')
      await this.cacheManager.remove('current_user')

      // Remover utilizador do estado online
      if (currentUser) {
        await this.setUserOffline(currentUser.id)
      }

      // Invalidar sessão atual
      if (tokenInfo?.sessionId) {
        await this.invalidateSession(tokenInfo.sessionId)
      }

      console.log('🧹 Authentication cache cleared')

    } catch (error) {
      console.error('❌ Failed to clear auth cache:', error)
    }
  }

  /**
   * Atualiza última atividade do utilizador
   */
  public async updateUserActivity(userId: string): Promise<void> {
    try {
      const now = Date.now()

      // Atualizar utilizador online
      const onlineUser = await this.cacheManager.get<OnlineUser>(`online_user_${userId}`)
      if (onlineUser) {
        onlineUser.lastActivity = now
        await this.cacheManager.set(`online_user_${userId}`, onlineUser, {
          ttl: this.SESSION_TIMEOUT,
          strategy: 'memory',
          priority: 'high',
          tags: ['auth', 'online-users']
        })
      }

      // Atualizar dados do utilizador
      const userData = await this.cacheManager.get<UserData>(`user_data_${userId}`)
      if (userData) {
        userData.lastActivity = now
        await this.cacheManager.set(`user_data_${userId}`, userData, {
          ttl: this.SESSION_TIMEOUT,
          strategy: 'hybrid',
          priority: 'high',
          tags: ['auth', 'user-data']
        })
      }

    } catch (error) {
      console.warn('⚠️ Failed to update user activity:', error)
    }
  }

  /**
   * Regista callback para renovação de token
   */
  public onTokenRefresh(callback: () => Promise<void>): void {
    this.refreshCallbacks.add(callback)
  }

  /**
   * Remove callback de renovação
   */
  public offTokenRefresh(callback: () => Promise<void>): void {
    this.refreshCallbacks.delete(callback)
  }

  // ============= MÉTODOS PRIVADOS =============

  private isTokenNearExpiry(tokenInfo: TokenInfo): boolean {
    const timeToExpiry = tokenInfo.expiresAt - Date.now()
    return timeToExpiry <= this.TOKEN_REFRESH_THRESHOLD
  }

  private scheduleTokenRefresh(tokenInfo: TokenInfo): void {
    const timeToRefresh = tokenInfo.expiresAt - Date.now() - this.TOKEN_REFRESH_THRESHOLD
    
    if (timeToRefresh > 0) {
      setTimeout(() => {
        this.triggerTokenRefresh()
      }, timeToRefresh)
      
      console.log(`⏰ Token refresh scheduled in ${Math.round(timeToRefresh / 60000)} minutes`)
    }
  }

  private async triggerTokenRefresh(): Promise<void> {
    console.log('🔄 Triggering token refresh...')
    
    for (const callback of this.refreshCallbacks) {
      try {
        await callback()
      } catch (error) {
        console.error('❌ Token refresh callback failed:', error)
      }
    }
  }

  private initializeActivityTracking(): void {
    // Atualizar atividade do utilizador atual periodicamente
    this.activityInterval = setInterval(async () => {
      try {
        const currentUser = await this.getCurrentUser()
        if (currentUser) {
          await this.updateUserActivity(currentUser.id)
        }
      } catch (error) {
        console.warn('⚠️ Activity tracking update failed:', error)
      }
    }, this.ACTIVITY_UPDATE_INTERVAL)

    // Event listeners para atividade do utilizador
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const activityHandler = async () => {
      const currentUser = await this.getCurrentUser()
      if (currentUser) {
        await this.updateUserActivity(currentUser.id)
      }
    }

    // Throttle activity updates
    let lastUpdate = 0
    const throttledHandler = async () => {
      const now = Date.now()
      if (now - lastUpdate > this.ACTIVITY_UPDATE_INTERVAL) {
        lastUpdate = now
        await activityHandler()
      }
    }

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true })
    })
  }

  /**
   * Cleanup ao destruir instância
   */
  public destroy(): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval)
    }
    
    this.refreshCallbacks.clear()
    
    console.log('🔐 AuthenticationCache: Destroyed')
  }
}

export default AuthenticationCache

// Type exports
export type { 
  TokenInfo, 
  UserData, 
  SessionInfo, 
  OnlineUser 
}