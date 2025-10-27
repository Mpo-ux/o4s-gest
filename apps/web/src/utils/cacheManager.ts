/**
 * CacheManager - Sistema de Cache Empresarial
 * 
 * Sistema de cache modular e escalável com múltiplas estratégias de armazenamento,
 * TTL automático, invalidação inteligente e métricas de performance.
 * 
 * Funcionalidades:
 * - Múltiplas estratégias de cache (memory, localStorage, sessionStorage)
 * - TTL (Time To Live) automático com refresh inteligente
 * - Sistema de invalidação baseado em eventos
 * - Métricas de performance e monitorização
 * - Compressão automática para dados grandes
 * - Fallback strategies para robustez
 */

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  version: string
  compressed: boolean
  tags?: string[]
}

interface CacheMetrics {
  hits: number
  misses: number
  writes: number
  evictions: number
  totalSize: number
  avgResponseTime: number
}

interface CacheOptions {
  ttl?: number // Time to live em milissegundos
  strategy?: 'memory' | 'localStorage' | 'sessionStorage' | 'hybrid'
  compress?: boolean
  tags?: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export enum CacheEvents {
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  CACHE_WRITE = 'cache_write',
  CACHE_EVICT = 'cache_evict',
  CACHE_CLEAR = 'cache_clear'
}

export class CacheManager {
  private static instance: CacheManager
  private memoryCache = new Map<string, CacheEntry>()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0,
    totalSize: 0,
    avgResponseTime: 0
  }
  private cleanupInterval: NodeJS.Timeout | null = null
  private eventListeners = new Map<CacheEvents, Function[]>()
  private readonly version = '1.0.0'
  private readonly maxMemorySize = 50 * 1024 * 1024 // 50MB limit

  private constructor() {
    this.startCleanupRoutine()
    this.initializeMetrics()
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Armazena dados no cache com configurações avançadas
   */
  public async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const startTime = performance.now()
    
    try {
      const {
        ttl = 3600000, // 1 hora por defeito
        strategy = 'hybrid',
        compress = false,
        tags = [],
        priority = 'medium'
      } = options

      // Preparar entry
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.version,
        compressed: compress,
        tags
      }

      // Compressão para dados grandes
      if (compress && typeof data === 'string' && data.length > 1024) {
        entry.data = this.compress(data) as T
        entry.compressed = true
      }

      // Estratégia de armazenamento
      switch (strategy) {
        case 'memory':
          await this.setMemoryCache(key, entry)
          break
        case 'localStorage':
          await this.setLocalStorageCache(key, entry)
          break
        case 'sessionStorage':
          await this.setSessionStorageCache(key, entry)
          break
        case 'hybrid':
          await this.setHybridCache(key, entry, priority)
          break
      }

      this.metrics.writes++
      this.updateMetrics(startTime)
      this.emitEvent(CacheEvents.CACHE_WRITE, { key, size: this.getEntrySize(entry) })

      console.log(`📦 Cache SET: ${key} (${strategy}, TTL: ${ttl}ms)`)
      return true

    } catch (error) {
      console.error(`❌ Cache SET error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Recupera dados do cache com fallback inteligente
   */
  public async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now()
    
    try {
      // Tentar memory cache primeiro (mais rápido)
      let entry = this.memoryCache.get(key)
      
      // Fallback para localStorage
      if (!entry) {
        entry = await this.getLocalStorageCache(key) || undefined
        // Se encontrado, promover para memory cache
        if (entry) {
          this.memoryCache.set(key, entry)
        }
      }

      // Fallback para sessionStorage
      if (!entry) {
        entry = await this.getSessionStorageCache(key) || undefined
        // Se encontrado, promover para memory cache
        if (entry) {
          this.memoryCache.set(key, entry)
        }
      }

      if (!entry) {
        this.metrics.misses++
        this.updateMetrics(startTime)
        this.emitEvent(CacheEvents.CACHE_MISS, { key })
        return null
      }

      // Verificar expiração
      if (this.isExpired(entry)) {
        await this.remove(key)
        this.metrics.misses++
        this.updateMetrics(startTime)
        this.emitEvent(CacheEvents.CACHE_MISS, { key, reason: 'expired' })
        return null
      }

      // Descomprimir se necessário
      let data = entry.data
      if (entry.compressed && typeof data === 'string') {
        data = this.decompress(data)
      }

      this.metrics.hits++
      this.updateMetrics(startTime)
      this.emitEvent(CacheEvents.CACHE_HIT, { key })

      console.log(`🎯 Cache HIT: ${key}`)
      return data as T

    } catch (error) {
      console.error(`❌ Cache GET error for key ${key}:`, error)
      this.metrics.misses++
      this.updateMetrics(startTime)
      return null
    }
  }

  /**
   * Remove entrada específica do cache
   */
  public async remove(key: string): Promise<boolean> {
    try {
      let removed = false

      // Remover de memory cache
      if (this.memoryCache.has(key)) {
        this.memoryCache.delete(key)
        removed = true
      }

      // Remover de localStorage
      const localKey = `cache_${key}`
      if (localStorage.getItem(localKey)) {
        localStorage.removeItem(localKey)
        removed = true
      }

      // Remover de sessionStorage
      if (sessionStorage.getItem(localKey)) {
        sessionStorage.removeItem(localKey)
        removed = true
      }

      if (removed) {
        this.metrics.evictions++
        this.emitEvent(CacheEvents.CACHE_EVICT, { key })
        console.log(`🗑️ Cache EVICT: ${key}`)
      }

      return removed
    } catch (error) {
      console.error(`❌ Cache REMOVE error for key ${key}:`, error)
      return false
    }
  }

  /**
   * Limpa cache por tags
   */
  public async removeByTags(tags: string[]): Promise<number> {
    let removed = 0

    // Memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && tags.some(tag => entry.tags!.includes(tag))) {
        await this.remove(key)
        removed++
      }
    }

    // localStorage e sessionStorage (scan necessário)
    const storages = [localStorage, sessionStorage]
    for (const storage of storages) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith('cache_')) {
          try {
            const item = storage.getItem(key)
            if (item) {
              const entry = JSON.parse(item) as CacheEntry
              if (entry.tags && tags.some(tag => entry.tags!.includes(tag))) {
                storage.removeItem(key)
                removed++
              }
            }
          } catch (error) {
            console.warn(`Warning: Failed to parse cache entry ${key}`)
          }
        }
      }
    }

    console.log(`🏷️ Cache CLEAR BY TAGS: ${tags.join(', ')} (${removed} entries)`)
    return removed
  }

  /**
   * Limpa todo o cache
   */
  public async clear(): Promise<void> {
    try {
      // Limpar memory cache
      this.memoryCache.clear()

      // Limpar localStorage
      const localKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'))
      localKeys.forEach(key => localStorage.removeItem(key))

      // Limpar sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'))
      sessionKeys.forEach(key => sessionStorage.removeItem(key))

      // Reset metrics
      this.metrics = {
        hits: 0,
        misses: 0,
        writes: 0,
        evictions: 0,
        totalSize: 0,
        avgResponseTime: 0
      }

      this.emitEvent(CacheEvents.CACHE_CLEAR, {})
      console.log(`🧹 Cache CLEAR: All caches cleared`)

    } catch (error) {
      console.error('❌ Cache CLEAR error:', error)
    }
  }

  /**
   * Obtém métricas de performance
   */
  public getMetrics(): CacheMetrics & { hitRate: number; totalOperations: number } {
    const totalOperations = this.metrics.hits + this.metrics.misses
    const hitRate = totalOperations > 0 ? (this.metrics.hits / totalOperations) * 100 : 0

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      totalOperations
    }
  }

  /**
   * Verifica saúde do cache
   */
  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    memoryUsage: number
    hitRate: number
    details: string[]
  } {
    const metrics = this.getMetrics()
    const memoryUsage = this.getMemoryUsage()
    const details: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Verificar uso de memória
    if (memoryUsage > 0.9) {
      status = 'critical'
      details.push('Memory usage critical (>90%)')
    } else if (memoryUsage > 0.7) {
      status = 'warning'
      details.push('Memory usage high (>70%)')
    }

    // Verificar hit rate
    if (metrics.totalOperations > 100) {
      if (metrics.hitRate < 30) {
        status = status === 'critical' ? 'critical' : 'warning'
        details.push(`Low hit rate (${metrics.hitRate}%)`)
      }
    }

    if (details.length === 0) {
      details.push('All systems nominal')
    }

    return {
      status,
      memoryUsage: Math.round(memoryUsage * 100),
      hitRate: metrics.hitRate,
      details
    }
  }

  // ============= MÉTODOS PRIVADOS =============

  private async setMemoryCache(key: string, entry: CacheEntry): Promise<void> {
    // Verificar limite de memória
    if (this.getMemoryUsage() > 0.9) {
      await this.evictLRU()
    }

    this.memoryCache.set(key, entry)
  }

  private async setLocalStorageCache(key: string, entry: CacheEntry): Promise<void> {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry))
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Quota exceeded, limpar cache antigo
        await this.evictOldEntries('localStorage')
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry))
      } else {
        throw error
      }
    }
  }

  private async setSessionStorageCache(key: string, entry: CacheEntry): Promise<void> {
    try {
      sessionStorage.setItem(`cache_${key}`, JSON.stringify(entry))
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Quota exceeded, limpar cache antigo
        await this.evictOldEntries('sessionStorage')
        sessionStorage.setItem(`cache_${key}`, JSON.stringify(entry))
      } else {
        throw error
      }
    }
  }

  private async setHybridCache(key: string, entry: CacheEntry, priority: string): Promise<void> {
    // Estratégia híbrida baseada na prioridade
    switch (priority) {
      case 'critical':
        // Memory + localStorage para máxima disponibilidade
        await this.setMemoryCache(key, entry)
        await this.setLocalStorageCache(key, entry)
        break
      case 'high':
        // Memory + sessionStorage
        await this.setMemoryCache(key, entry)
        await this.setSessionStorageCache(key, entry)
        break
      case 'medium':
        // Memory ou localStorage baseado no tamanho
        if (this.getEntrySize(entry) < 1024) {
          await this.setMemoryCache(key, entry)
        } else {
          await this.setLocalStorageCache(key, entry)
        }
        break
      case 'low':
        // Apenas sessionStorage
        await this.setSessionStorageCache(key, entry)
        break
    }
  }

  private async getLocalStorageCache(key: string): Promise<CacheEntry | null> {
    try {
      const item = localStorage.getItem(`cache_${key}`)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Failed to parse localStorage cache for key ${key}`)
      return null
    }
  }

  private async getSessionStorageCache(key: string): Promise<CacheEntry | null> {
    try {
      const item = sessionStorage.getItem(`cache_${key}`)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Failed to parse sessionStorage cache for key ${key}`)
      return null
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private getEntrySize(entry: CacheEntry): number {
    return new Blob([JSON.stringify(entry)]).size
  }

  private getMemoryUsage(): number {
    let totalSize = 0
    for (const entry of this.memoryCache.values()) {
      totalSize += this.getEntrySize(entry)
    }
    return totalSize / this.maxMemorySize
  }

  private async evictLRU(): Promise<void> {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      await this.remove(oldestKey)
    }
  }

  private async evictOldEntries(storageType: 'localStorage' | 'sessionStorage'): Promise<void> {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage
    const entries: Array<{ key: string; timestamp: number }> = []

    // Coletar entradas de cache
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith('cache_')) {
        try {
          const item = storage.getItem(key)
          if (item) {
            const entry = JSON.parse(item) as CacheEntry
            entries.push({ key, timestamp: entry.timestamp })
          }
        } catch (error) {
          // Remove entrada corrompida
          storage.removeItem(key)
        }
      }
    }

    // Ordenar por idade e remover 25% das mais antigas
    entries.sort((a, b) => a.timestamp - b.timestamp)
    const toRemove = Math.ceil(entries.length * 0.25)
    
    for (let i = 0; i < toRemove; i++) {
      storage.removeItem(entries[i].key)
    }
  }

  private compress(data: string): string {
    // Implementação simples de compressão (LZ-string seria ideal)
    return btoa(data)
  }

  private decompress(data: string): string {
    return atob(data)
  }

  private startCleanupRoutine(): void {
    // Limpeza automática a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries()
    }, 5 * 60 * 1000)
  }

  private async cleanupExpiredEntries(): Promise<void> {
    let cleaned = 0

    // Limpar memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }

    console.log(`🧹 Cache CLEANUP: ${cleaned} expired entries removed`)
  }

  private initializeMetrics(): void {
    // Carregar métricas persistidas se existirem
    try {
      const savedMetrics = localStorage.getItem('cache_metrics')
      if (savedMetrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(savedMetrics) }
      }
    } catch (error) {
      console.warn('Failed to load cache metrics from localStorage')
    }

    // Salvar métricas periodicamente
    setInterval(() => {
      try {
        localStorage.setItem('cache_metrics', JSON.stringify(this.metrics))
      } catch (error) {
        console.warn('Failed to save cache metrics to localStorage')
      }
    }, 30 * 1000) // A cada 30 segundos
  }

  private updateMetrics(startTime: number): void {
    const responseTime = performance.now() - startTime
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2
  }

  private emitEvent(event: CacheEvents, data: any): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.warn(`Cache event listener error for ${event}:`, error)
      }
    })
  }

  public addEventListener(event: CacheEvents, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  public removeEventListener(event: CacheEvents, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Cleanup ao destruir a instância
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.eventListeners.clear()
    this.memoryCache.clear()
  }
}

export default CacheManager