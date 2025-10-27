/**
 * ConnectionCache - Sistema de Cache de Estado de Conexão
 * 
 * Sistema especializado para cache de estado dos servidores,
 * health checks, status de conectividade e métricas de rede.
 * 
 * Funcionalidades:
 * - Cache inteligente de health checks
 * - Monitorização contínua de conectividade
 * - Detecção automática de mudanças de rede
 * - Circuit breaker pattern para servidores offline
 * - Métricas de latência e disponibilidade
 */

import CacheManager from './cacheManager'

interface ServerStatus {
  url: string
  status: 'online' | 'offline' | 'degraded' | 'maintenance'
  lastCheck: number
  latency: number
  uptime: number
  version?: string
  metadata?: Record<string, any>
}

interface NetworkStatus {
  isOnline: boolean
  effectiveType: string
  downlink: number
  rtt: number
  lastUpdate: number
}

interface HealthCheckResult {
  timestamp: number
  success: boolean
  latency: number
  error?: string
  statusCode?: number
  responseHeaders?: Record<string, string>
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailure: number
  nextRetry: number
}

export class ConnectionCache {
  private static instance: ConnectionCache
  private cacheManager: CacheManager
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 segundos
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5 // 5 falhas consecutivas
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minuto
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>()
  private circuitBreakers = new Map<string, CircuitBreakerState>()
  private networkStatusInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.cacheManager = CacheManager.getInstance()
    this.initializeNetworkMonitoring()
  }

  public static getInstance(): ConnectionCache {
    if (!ConnectionCache.instance) {
      ConnectionCache.instance = new ConnectionCache()
    }
    return ConnectionCache.instance
  }

  /**
   * Inicializa monitorização de conexões
   */
  public async initialize(servers: string[]): Promise<void> {
    console.log('🌐 ConnectionCache: Initializing connection monitoring...')
    
    try {
      // Carregar estados de cache se existirem
      await this.loadCachedStates(servers)
      
      // Iniciar monitorização de cada servidor
      for (const serverUrl of servers) {
        await this.startHealthChecking(serverUrl)
      }
      
      // Verificação inicial
      await this.performInitialHealthCheck(servers)
      
      console.log(`✅ ConnectionCache: Monitoring ${servers.length} servers`)
      
    } catch (error) {
      console.error('❌ ConnectionCache: Failed to initialize:', error)
    }
  }

  /**
   * Verifica status de servidor específico
   */
  public async getServerStatus(serverUrl: string): Promise<ServerStatus | null> {
    const cacheKey = `server_status_${this.sanitizeUrl(serverUrl)}`
    
    // Tentar cache primeiro
    let status = await this.cacheManager.get<ServerStatus>(cacheKey)
    
    if (!status || this.isHealthCheckStale(status)) {
      // Realizar nova verificação
      status = await this.performHealthCheck(serverUrl)
      
      if (status) {
        await this.cacheManager.set(cacheKey, status, {
          ttl: this.HEALTH_CHECK_INTERVAL,
          strategy: 'hybrid',
          priority: 'high',
          tags: ['connection', 'health-check']
        })
      }
    }
    
    return status
  }

  /**
   * Verifica se servidor está disponível (com circuit breaker)
   */
  public async isServerAvailable(serverUrl: string): Promise<boolean> {
    const circuitBreaker = this.getCircuitBreaker(serverUrl)
    
    // Se circuit breaker está aberto, verificar se pode tentar novamente
    if (circuitBreaker.state === 'open') {
      if (Date.now() < circuitBreaker.nextRetry) {
        console.log(`⚡ Circuit breaker OPEN for ${serverUrl}, next retry in ${Math.round((circuitBreaker.nextRetry - Date.now()) / 1000)}s`)
        return false
      } else {
        // Transição para half-open
        circuitBreaker.state = 'half-open'
        console.log(`🔄 Circuit breaker HALF-OPEN for ${serverUrl}`)
      }
    }
    
    const status = await this.getServerStatus(serverUrl)
    const isAvailable = status?.status === 'online'
    
    // Atualizar circuit breaker
    this.updateCircuitBreaker(serverUrl, isAvailable)
    
    return isAvailable
  }

  /**
   * Obtém status da rede
   */
  public async getNetworkStatus(): Promise<NetworkStatus | null> {
    return await this.cacheManager.get<NetworkStatus>('network_status')
  }

  /**
   * Força verificação de health check
   */
  public async forceHealthCheck(serverUrl: string): Promise<ServerStatus | null> {
    console.log(`🔄 Forcing health check for ${serverUrl}`)
    
    const status = await this.performHealthCheck(serverUrl)
    
    if (status) {
      const cacheKey = `server_status_${this.sanitizeUrl(serverUrl)}`
      await this.cacheManager.set(cacheKey, status, {
        ttl: this.HEALTH_CHECK_INTERVAL,
        strategy: 'hybrid',
        priority: 'high',
        tags: ['connection', 'health-check']
      })
    }
    
    return status
  }

  /**
   * Obtém métricas de conectividade
   */
  public async getConnectivityMetrics(): Promise<{
    totalServers: number
    onlineServers: number
    offlineServers: number
    avgLatency: number
    uptime: number
    networkStatus: NetworkStatus | null
  }> {
    const networkStatus = await this.getNetworkStatus()
    const serverKeys = await this.getServerStatusKeys()
    
    let totalServers = 0
    let onlineServers = 0
    let offlineServers = 0
    let totalLatency = 0
    let totalUptime = 0
    
    for (const key of serverKeys) {
      const status = await this.cacheManager.get<ServerStatus>(key)
      if (status) {
        totalServers++
        if (status.status === 'online') {
          onlineServers++
          totalLatency += status.latency
          totalUptime += status.uptime
        } else {
          offlineServers++
        }
      }
    }
    
    return {
      totalServers,
      onlineServers,
      offlineServers,
      avgLatency: onlineServers > 0 ? totalLatency / onlineServers : 0,
      uptime: onlineServers > 0 ? totalUptime / onlineServers : 0,
      networkStatus
    }
  }

  /**
   * Obtém histórico de health checks
   */
  public async getHealthHistory(serverUrl: string, limit: number = 100): Promise<HealthCheckResult[]> {
    const cacheKey = `health_history_${this.sanitizeUrl(serverUrl)}`
    const history = await this.cacheManager.get<HealthCheckResult[]>(cacheKey) || []
    
    return history.slice(-limit)
  }

  // ============= MÉTODOS PRIVADOS =============

  private async loadCachedStates(servers: string[]): Promise<void> {
    for (const serverUrl of servers) {
      // Carregar circuit breaker state
      const cbKey = `circuit_breaker_${this.sanitizeUrl(serverUrl)}`
      const cbState = await this.cacheManager.get<CircuitBreakerState>(cbKey)
      
      if (cbState) {
        this.circuitBreakers.set(serverUrl, cbState)
      } else {
        this.circuitBreakers.set(serverUrl, {
          state: 'closed',
          failureCount: 0,
          lastFailure: 0,
          nextRetry: 0
        })
      }
    }
  }

  private async startHealthChecking(serverUrl: string): Promise<void> {
    // Parar interval existente se houver
    const existingInterval = this.healthCheckIntervals.get(serverUrl)
    if (existingInterval) {
      clearInterval(existingInterval)
    }
    
    // Iniciar novo interval
    const interval = setInterval(async () => {
      await this.performPeriodicHealthCheck(serverUrl)
    }, this.HEALTH_CHECK_INTERVAL)
    
    this.healthCheckIntervals.set(serverUrl, interval)
  }

  private async performInitialHealthCheck(servers: string[]): Promise<void> {
    const checks = servers.map(serverUrl => this.performHealthCheck(serverUrl))
    const results = await Promise.allSettled(checks)
    
    let online = 0
    let offline = 0
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value?.status === 'online') {
        online++
      } else {
        offline++
      }
    })
    
    console.log(`📊 Initial health check: ${online} online, ${offline} offline`)
  }

  private async performPeriodicHealthCheck(serverUrl: string): Promise<void> {
    try {
      const status = await this.performHealthCheck(serverUrl)
      
      if (status) {
        const cacheKey = `server_status_${this.sanitizeUrl(serverUrl)}`
        await this.cacheManager.set(cacheKey, status, {
          ttl: this.HEALTH_CHECK_INTERVAL * 2, // TTL duplo do intervalo
          strategy: 'hybrid',
          priority: 'high',
          tags: ['connection', 'health-check']
        })
        
        // Atualizar histórico
        await this.updateHealthHistory(serverUrl, {
          timestamp: Date.now(),
          success: status.status === 'online',
          latency: status.latency
        })
      }
      
    } catch (error) {
      console.warn(`⚠️ Periodic health check failed for ${serverUrl}:`, error)
    }
  }

  private async performHealthCheck(serverUrl: string): Promise<ServerStatus | null> {
    const startTime = performance.now()
    
    try {
      // Usar AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      const latency = performance.now() - startTime
      
      let status: ServerStatus['status'] = 'offline'
      let metadata: Record<string, any> = {}
      
      if (response.ok) {
        status = 'online'
        try {
          const data = await response.json()
          metadata = data
        } catch (error) {
          // Response não é JSON, mas servidor está online
        }
      } else if (response.status >= 500) {
        status = 'degraded'
      }
      
      const serverStatus: ServerStatus = {
        url: serverUrl,
        status,
        lastCheck: Date.now(),
        latency: Math.round(latency),
        uptime: this.calculateUptime(serverUrl, status === 'online'),
        version: metadata.version,
        metadata
      }
      
      console.log(`${status === 'online' ? '✅' : status === 'degraded' ? '⚠️' : '❌'} Health check ${serverUrl}: ${status} (${Math.round(latency)}ms)`)
      
      return serverStatus
      
    } catch (error) {
      const latency = performance.now() - startTime
      
      console.log(`❌ Health check ${serverUrl}: offline (${Math.round(latency)}ms) - ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        url: serverUrl,
        status: 'offline',
        lastCheck: Date.now(),
        latency: Math.round(latency),
        uptime: this.calculateUptime(serverUrl, false)
      }
    }
  }

  private calculateUptime(serverUrl: string, isOnline: boolean): number {
    // Implementação simplificada - em produção seria mais sofisticada
    const lastUptime = this.getLastUptime(serverUrl)
    const timeDiff = this.HEALTH_CHECK_INTERVAL / 1000 // em segundos
    
    if (isOnline) {
      return lastUptime + timeDiff
    } else {
      // Reset uptime se offline
      return 0
    }
  }

  private getLastUptime(_serverUrl: string): number {
    // Implementação placeholder - seria carregado do cache
    return 0
  }

  private getCircuitBreaker(serverUrl: string): CircuitBreakerState {
    let cb = this.circuitBreakers.get(serverUrl)
    
    if (!cb) {
      cb = {
        state: 'closed',
        failureCount: 0,
        lastFailure: 0,
        nextRetry: 0
      }
      this.circuitBreakers.set(serverUrl, cb)
    }
    
    return cb
  }

  private updateCircuitBreaker(serverUrl: string, success: boolean): void {
    const cb = this.getCircuitBreaker(serverUrl)
    
    if (success) {
      // Reset em caso de sucesso
      if (cb.state === 'half-open' || cb.failureCount > 0) {
        console.log(`✅ Circuit breaker CLOSED for ${serverUrl} (recovered)`)
        cb.state = 'closed'
        cb.failureCount = 0
        cb.lastFailure = 0
        cb.nextRetry = 0
      }
    } else {
      // Incrementar failures
      cb.failureCount++
      cb.lastFailure = Date.now()
      
      if (cb.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD && cb.state === 'closed') {
        // Abrir circuit breaker
        cb.state = 'open'
        cb.nextRetry = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT
        console.log(`🚫 Circuit breaker OPENED for ${serverUrl} (${cb.failureCount} failures)`)
      }
    }
    
    // Persistir estado
    const cacheKey = `circuit_breaker_${this.sanitizeUrl(serverUrl)}`
    this.cacheManager.set(cacheKey, cb, {
      ttl: 24 * 60 * 60 * 1000, // 24 horas
      strategy: 'localStorage',
      priority: 'high',
      tags: ['connection', 'circuit-breaker']
    })
  }

  private async updateHealthHistory(serverUrl: string, result: HealthCheckResult): Promise<void> {
    const cacheKey = `health_history_${this.sanitizeUrl(serverUrl)}`
    const history = await this.cacheManager.get<HealthCheckResult[]>(cacheKey) || []
    
    history.push(result)
    
    // Manter apenas últimos 1000 registos
    if (history.length > 1000) {
      history.splice(0, history.length - 1000)
    }
    
    await this.cacheManager.set(cacheKey, history, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 dias
      strategy: 'localStorage',
      priority: 'medium',
      tags: ['connection', 'history']
    })
  }

  private initializeNetworkMonitoring(): void {
    // Monitorizar status da rede
    const updateNetworkStatus = async () => {
      const networkStatus: NetworkStatus = {
        isOnline: navigator.onLine,
        effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
        downlink: (navigator as any).connection?.downlink || 0,
        rtt: (navigator as any).connection?.rtt || 0,
        lastUpdate: Date.now()
      }
      
      await this.cacheManager.set('network_status', networkStatus, {
        ttl: 60000, // 1 minuto
        strategy: 'memory',
        priority: 'high',
        tags: ['network']
      })
    }
    
    // Atualização inicial
    updateNetworkStatus()
    
    // Eventos de rede
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    // Update periódico
    this.networkStatusInterval = setInterval(updateNetworkStatus, 30000)
  }

  private isHealthCheckStale(status: ServerStatus): boolean {
    const age = Date.now() - status.lastCheck
    return age > this.HEALTH_CHECK_INTERVAL
  }

  private sanitizeUrl(url: string): string {
    return url.replace(/[^a-zA-Z0-9]/g, '_')
  }

  private async getServerStatusKeys(): Promise<string[]> {
    // Implementação simplificada - em produção seria otimizada
    const keys: string[] = []
    
    // Scan memory cache
    // Nota: Este é um método simplificado. Em produção, manteria um índice de chaves
    
    return keys
  }

  /**
   * Cleanup ao destruir instância
   */
  public destroy(): void {
    // Limpar intervalos
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval)
    }
    this.healthCheckIntervals.clear()
    
    if (this.networkStatusInterval) {
      clearInterval(this.networkStatusInterval)
    }
    
    // Remover event listeners
    window.removeEventListener('online', () => {})
    window.removeEventListener('offline', () => {})
    
    console.log('🌐 ConnectionCache: Destroyed')
  }
}

export default ConnectionCache

// Type exports
export type { 
  ServerStatus, 
  NetworkStatus, 
  HealthCheckResult, 
  CircuitBreakerState 
}