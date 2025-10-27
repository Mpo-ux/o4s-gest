/**
 * AppInitializer - Orquestrador de Inicialização da Aplicação
 * 
 * Sistema central que coordena toda a sequência de inicialização da aplicação,
 * integrando cache, preload, configurações e otimizações de performance.
 * 
 * Funcionalidades:
 * - Sequência otimizada de inicialização
 * - Gestão de dependências entre componentes
 * - Fallback strategies para robustez
 * - Monitorização de performance de startup
 * - Cache warming inteligente
 * - Error recovery e retry logic
 */

import CacheManager from './cacheManager'
import ConfigurationCache, { AppConfiguration } from './configurationCache'
import ConnectionCache from './connectionCache'
import AuthenticationCache from './authenticationCache'
import PreloadManager, { PreloadProgress } from './preloadManager'

interface InitializationOptions {
  enableCache: boolean
  enablePreload: boolean
  enableConnectionMonitoring: boolean
  skipNonCritical: boolean
  developmentMode: boolean
  progressCallback?: (progress: InitializationProgress) => void
}

interface InitializationProgress {
  phase: 'cache' | 'config' | 'connection' | 'auth' | 'preload' | 'complete'
  step: string
  percentage: number
  startTime: number
  elapsed: number
  estimated: number
}

interface InitializationResult {
  success: boolean
  duration: number
  errors: string[]
  warnings: string[]
  configuration: AppConfiguration | null
  cacheMetrics: any
  preloadResults: any
}

export class AppInitializer {
  private static instance: AppInitializer
  private cacheManager: CacheManager
  private configCache: ConfigurationCache
  private connectionCache: ConnectionCache
  private authCache: AuthenticationCache
  private preloadManager: PreloadManager
  private isInitialized = false
  private initializationResult: InitializationResult | null = null

  private constructor() {
    this.cacheManager = CacheManager.getInstance()
    this.configCache = ConfigurationCache.getInstance()
    this.connectionCache = ConnectionCache.getInstance()
    this.authCache = AuthenticationCache.getInstance()
    this.preloadManager = PreloadManager.getInstance()
  }

  public static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer()
    }
    return AppInitializer.instance
  }

  /**
   * Inicialização principal da aplicação
   */
  public async initialize(options: Partial<InitializationOptions> = {}): Promise<InitializationResult> {
    if (this.isInitialized && this.initializationResult) {
      console.log('ℹ️ App already initialized, returning cached result')
      return this.initializationResult
    }

    const startTime = performance.now()
    console.log('🚀 Starting application initialization...')

    const opts: InitializationOptions = {
      enableCache: true,
      enablePreload: true,
      enableConnectionMonitoring: true,
      skipNonCritical: false,
      developmentMode: process.env.NODE_ENV === 'development',
      ...options
    }

    const errors: string[] = []
    const warnings: string[] = []
    let configuration: AppConfiguration | null = null
    let cacheMetrics: any = null
    let preloadResults: any = null

    try {
      // Fase 1: Inicialização do Cache
      await this.updateProgress(opts.progressCallback, 'cache', 'Initializing cache system', 10, startTime)
      
      if (opts.enableCache) {
        await this.initializeCache()
        cacheMetrics = this.cacheManager.getMetrics()
        console.log('✅ Cache system initialized')
      } else {
        warnings.push('Cache system disabled')
      }

      // Fase 2: Carregamento de Configuração
      await this.updateProgress(opts.progressCallback, 'config', 'Loading configuration', 25, startTime)
      
      try {
        configuration = await this.configCache.initialize()
        console.log('✅ Configuration loaded')
      } catch (error) {
        errors.push('Configuration loading failed')
        console.error('❌ Configuration loading failed:', error)
        
        // Usar configuração por defeito como fallback
        configuration = await this.getDefaultConfiguration()
        warnings.push('Using default configuration as fallback')
      }

      // Fase 3: Verificação de Conectividade
      await this.updateProgress(opts.progressCallback, 'connection', 'Checking connectivity', 40, startTime)
      
      if (opts.enableConnectionMonitoring && configuration) {
        try {
          const servers = [configuration.api.baseUrl]
          await this.connectionCache.initialize(servers)
          
          const apiAvailable = await this.connectionCache.isServerAvailable(configuration.api.baseUrl)
          if (!apiAvailable) {
            warnings.push('API server not available - running in offline mode')
          }
          
          console.log(`✅ Connection monitoring initialized (API: ${apiAvailable ? 'Online' : 'Offline'})`)
        } catch (error) {
          errors.push('Connection monitoring initialization failed')
          console.error('❌ Connection monitoring failed:', error)
        }
      }

      // Fase 4: Verificação de Autenticação
      await this.updateProgress(opts.progressCallback, 'auth', 'Verifying authentication', 60, startTime)
      
      try {
        const tokenInfo = await this.authCache.getTokenInfo()
        if (tokenInfo) {
          const user = await this.authCache.getCurrentUser()
          if (user) {
            console.log(`✅ User authenticated: ${user.name} (${user.role})`)
          } else {
            warnings.push('Token exists but user data not found')
          }
        } else {
          console.log('ℹ️ No authentication token found')
        }
      } catch (error) {
        warnings.push('Authentication verification failed')
        console.warn('⚠️ Authentication verification failed:', error)
      }

      // Fase 5: Pre-loading (apenas se habilitado)
      await this.updateProgress(opts.progressCallback, 'preload', 'Pre-loading critical data', 80, startTime)
      
      if (opts.enablePreload && !opts.skipNonCritical) {
        try {
          // Configurar callback para progresso do preload
          const preloadProgressCallback = (progress: PreloadProgress) => {
            const adjustedPercentage = 80 + (progress.percentage * 0.15) // 80-95%
            this.updateProgress(
              opts.progressCallback, 
              'preload', 
              `Pre-loading: ${progress.currentTask}`, 
              adjustedPercentage, 
              startTime
            )
          }

          this.preloadManager.onProgress(preloadProgressCallback)
          preloadResults = await this.preloadManager.preloadApplication()
          this.preloadManager.offProgress(preloadProgressCallback)
          
          if (preloadResults.success) {
            console.log(`✅ Pre-loading completed (${preloadResults.results.length} tasks)`)
          } else {
            warnings.push(`Pre-loading partially failed: ${preloadResults.errors.join(', ')}`)
          }
          
        } catch (error) {
          errors.push('Pre-loading failed')
          console.error('❌ Pre-loading failed:', error)
        }
      } else {
        console.log('ℹ️ Pre-loading skipped')
      }

      // Fase Final: Finalizações
      await this.updateProgress(opts.progressCallback, 'complete', 'Finalizing initialization', 100, startTime)
      
      // Configurações finais
      await this.finalizeInitialization(configuration, opts)

      const duration = performance.now() - startTime
      const success = errors.length === 0

      this.initializationResult = {
        success,
        duration,
        errors,
        warnings,
        configuration,
        cacheMetrics,
        preloadResults
      }

      this.isInitialized = true

      console.log(`${success ? '🎉' : '⚠️'} Initialization ${success ? 'completed' : 'completed with issues'} in ${Math.round(duration)}ms`)
      
      if (errors.length > 0) {
        console.error('❌ Errors during initialization:', errors)
      }
      
      if (warnings.length > 0) {
        console.warn('⚠️ Warnings during initialization:', warnings)
      }

      return this.initializationResult

    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
      
      console.error('💥 Critical initialization failure:', error)
      
      this.initializationResult = {
        success: false,
        duration,
        errors: [errorMessage, ...errors],
        warnings,
        configuration: null,
        cacheMetrics: null,
        preloadResults: null
      }

      return this.initializationResult
    }
  }

  /**
   * Re-inicialização (hot reload)
   */
  public async reinitialize(options: Partial<InitializationOptions> = {}): Promise<InitializationResult> {
    console.log('🔄 Re-initializing application...')
    
    // Reset estado
    this.isInitialized = false
    this.initializationResult = null
    
    // Limpar caches se necessário
    if (options.enableCache !== false) {
      await this.cacheManager.removeByTags(['configuration'])
    }
    
    return await this.initialize(options)
  }

  /**
   * Verifica se a aplicação está inicializada
   */
  public isAppInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Obtém resultado da última inicialização
   */
  public getInitializationResult(): InitializationResult | null {
    return this.initializationResult
  }

  /**
   * Obtém estado de saúde da aplicação
   */
  public async getHealthStatus(): Promise<{
    overall: 'healthy' | 'warning' | 'critical'
    components: {
      cache: any
      configuration: any
      connection: any
      authentication: any
    }
    performance: {
      initializationTime: number
      cacheHitRate: number
      memoryUsage: number
    }
  }> {
    const cacheHealth = this.cacheManager.getHealthStatus()
    const configHealth = await this.configCache.getHealthStatus()
    const connectionMetrics = await this.connectionCache.getConnectivityMetrics()
    
    // Determinar estado geral
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (cacheHealth.status === 'critical' || configHealth.status === 'critical') {
      overall = 'critical'
    } else if (cacheHealth.status === 'warning' || configHealth.status === 'warning' || connectionMetrics.onlineServers === 0) {
      overall = 'warning'
    }

    return {
      overall,
      components: {
        cache: cacheHealth,
        configuration: configHealth,
        connection: connectionMetrics,
        authentication: {
          // Placeholder - implementar verificação de auth
          status: 'healthy'
        }
      },
      performance: {
        initializationTime: this.initializationResult?.duration || 0,
        cacheHitRate: this.cacheManager.getMetrics().hitRate,
        memoryUsage: cacheHealth.memoryUsage
      }
    }
  }

  // ============= MÉTODOS PRIVADOS =============

  private async initializeCache(): Promise<void> {
    // Cache já é inicializado como singleton, mas podemos fazer warm-up
    const healthStatus = this.cacheManager.getHealthStatus()
    
    if (healthStatus.status === 'critical') {
      console.warn('⚠️ Cache in critical state, clearing and reinitializing...')
      await this.cacheManager.clear()
    }
    
    // Warm-up básico do cache
    await this.preloadManager.warmUpCache()
  }

  private async getDefaultConfiguration(): Promise<AppConfiguration> {
    // Retornar configuração mínima para funcionamento
    return {
      api: {
        baseUrl: 'http://localhost:5000',
        timeout: 10000,
        retryAttempts: 3,
        healthCheckInterval: 30000
      },
      ui: {
        theme: 'auto',
        language: 'pt-PT',
        animations: true,
        compactMode: false
      },
      cache: {
        enabled: true,
        defaultTTL: 3600000,
        maxSize: 50 * 1024 * 1024,
        strategies: ['memory', 'localStorage']
      },
      performance: {
        preloadCriticalData: true,
        lazyLoadImages: true,
        enableServiceWorker: false,
        enableCodeSplitting: true
      },
      security: {
        sessionTimeout: 24 * 60 * 60 * 1000,
        tokenRefreshInterval: 15 * 60 * 1000,
        enableCSRF: true,
        enableXSS: true
      },
      features: {
        enableAdminPanel: true,
        enableUserProfiles: true,
        enableNotifications: true,
        enableAnalytics: false
      },
      development: {
        enableDebugMode: false,
        enableHotReload: false,
        logLevel: 'info',
        showPerformanceMetrics: false
      }
    }
  }

  private async finalizeInitialization(configuration: AppConfiguration | null, options: InitializationOptions): Promise<void> {
    // Configurações finais baseadas na configuração carregada
    if (configuration) {
      // Aplicar configurações de desenvolvimento se ativado
      if (options.developmentMode || configuration.development.enableDebugMode) {
        console.log('🛠️ Development mode enabled')
        
        // Ativar métricas de performance se configurado
        if (configuration.development.showPerformanceMetrics) {
          this.enablePerformanceMonitoring()
        }
      }

      // Configurar refresh automático de token se autenticado
      const tokenInfo = await this.authCache.getTokenInfo()
      if (tokenInfo) {
        this.authCache.onTokenRefresh(async () => {
          console.log('🔄 Token refresh triggered by initialization')
          // Implementar lógica de refresh específica se necessário
        })
      }
    }

    // Log de inicialização completa
    console.log('📊 Initialization Summary:')
    console.log(`  💾 Cache: ${this.cacheManager.getMetrics().hitRate.toFixed(1)}% hit rate`)
    console.log(`  ⚙️ Configuration: ${configuration ? 'Loaded' : 'Default'}`)
    console.log(`  🌐 Connection: ${options.enableConnectionMonitoring ? 'Monitored' : 'Not monitored'}`)
    console.log(`  🚀 Preload: ${options.enablePreload ? 'Enabled' : 'Disabled'}`)
  }

  private enablePerformanceMonitoring(): void {
    // Observer para performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            console.log(`📈 Navigation: ${entry.duration.toFixed(2)}ms`)
          } else if (entry.entryType === 'resource') {
            console.log(`📈 Resource ${entry.name}: ${entry.duration.toFixed(2)}ms`)
          }
        })
      })

      try {
        observer.observe({ entryTypes: ['navigation', 'resource'] })
      } catch (error) {
        console.warn('Performance monitoring not supported:', error)
      }
    }
  }

  private async updateProgress(
    callback: ((progress: InitializationProgress) => void) | undefined,
    phase: InitializationProgress['phase'],
    step: string,
    percentage: number,
    startTime: number
  ): Promise<void> {
    if (!callback) return

    const elapsed = performance.now() - startTime
    const estimated = percentage > 0 ? (elapsed / percentage) * 100 : 0

    const progress: InitializationProgress = {
      phase,
      step,
      percentage: Math.min(percentage, 100),
      startTime,
      elapsed,
      estimated
    }

    try {
      callback(progress)
    } catch (error) {
      console.warn('Progress callback error:', error)
    }
  }

  /**
   * Cleanup ao destruir instância
   */
  public destroy(): void {
    this.cacheManager.destroy()
    this.connectionCache.destroy()
    this.authCache.destroy()
    this.preloadManager.destroy()
    
    this.isInitialized = false
    this.initializationResult = null
    
    console.log('🏁 AppInitializer: Destroyed')
  }
}

export default AppInitializer

// Type exports
export type { 
  InitializationOptions, 
  InitializationProgress, 
  InitializationResult 
}