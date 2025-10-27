/**
 * ConfigurationCache - Sistema de Cache de Configurações
 * 
 * Sistema especializado para cache de configurações da aplicação,
 * variáveis de ambiente, constantes e definições do sistema.
 * 
 * Funcionalidades:
 * - Cache automático de configurações críticas
 * - Validação de configurações ao carregar
 * - Fallback para valores por defeito
 * - Hot-reload de configurações sem restart
 * - Versionamento de configurações
 */

import CacheManager from './cacheManager'

interface AppConfiguration {
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
    healthCheckInterval: number
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    animations: boolean
    compactMode: boolean
  }
  cache: {
    enabled: boolean
    defaultTTL: number
    maxSize: number
    strategies: string[]
  }
  performance: {
    preloadCriticalData: boolean
    lazyLoadImages: boolean
    enableServiceWorker: boolean
    enableCodeSplitting: boolean
  }
  security: {
    sessionTimeout: number
    tokenRefreshInterval: number
    enableCSRF: boolean
    enableXSS: boolean
  }
  features: {
    enableAdminPanel: boolean
    enableUserProfiles: boolean
    enableNotifications: boolean
    enableAnalytics: boolean
  }
  development: {
    enableDebugMode: boolean
    enableHotReload: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    showPerformanceMetrics: boolean
  }
}

interface ConfigurationValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class ConfigurationCache {
  private static instance: ConfigurationCache
  private cacheManager: CacheManager
  private readonly CONFIG_KEY = 'app_configuration'
  private readonly CONFIG_VERSION = '2.1.0'
  private readonly CONFIG_TTL = 24 * 60 * 60 * 1000 // 24 horas

  private readonly defaultConfiguration: AppConfiguration = {
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
      defaultTTL: 3600000, // 1 hora
      maxSize: 50 * 1024 * 1024, // 50MB
      strategies: ['memory', 'localStorage', 'sessionStorage']
    },
    performance: {
      preloadCriticalData: true,
      lazyLoadImages: true,
      enableServiceWorker: false,
      enableCodeSplitting: true
    },
    security: {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
      tokenRefreshInterval: 15 * 60 * 1000, // 15 minutos
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
      enableDebugMode: process.env.NODE_ENV === 'development',
      enableHotReload: process.env.NODE_ENV === 'development',
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      showPerformanceMetrics: process.env.NODE_ENV === 'development'
    }
  }

  private constructor() {
    this.cacheManager = CacheManager.getInstance()
  }

  public static getInstance(): ConfigurationCache {
    if (!ConfigurationCache.instance) {
      ConfigurationCache.instance = new ConfigurationCache()
    }
    return ConfigurationCache.instance
  }

  /**
   * Inicializa e carrega configurações com cache inteligente
   */
  public async initialize(): Promise<AppConfiguration> {
    console.log('🔧 ConfigurationCache: Initializing...')
    
    try {
      // Tentar carregar do cache primeiro
      let config = await this.loadFromCache()
      
      if (!config) {
        console.log('📝 ConfigurationCache: No cached config found, loading defaults')
        config = await this.loadConfiguration()
        await this.saveToCache(config)
      } else {
        console.log('🎯 ConfigurationCache: Loaded from cache')
        
        // Validar configuração cached
        const validation = this.validateConfiguration(config)
        if (!validation.isValid) {
          console.warn('⚠️ ConfigurationCache: Cached config invalid, reloading defaults')
          config = await this.loadConfiguration()
          await this.saveToCache(config)
        }
      }

      // Aplicar overrides de ambiente se existirem
      config = this.applyEnvironmentOverrides(config)

      // Log configuração carregada
      this.logConfigurationSummary(config)

      return config

    } catch (error) {
      console.error('❌ ConfigurationCache: Failed to initialize, using defaults:', error)
      return this.defaultConfiguration
    }
  }

  /**
   * Recarrega configurações (hot-reload)
   */
  public async reload(): Promise<AppConfiguration> {
    console.log('🔄 ConfigurationCache: Reloading configuration...')
    
    // Invalidar cache atual
    await this.cacheManager.remove(this.CONFIG_KEY)
    
    // Carregar nova configuração
    const config = await this.loadConfiguration()
    await this.saveToCache(config)
    
    console.log('✅ ConfigurationCache: Configuration reloaded')
    return config
  }

  /**
   * Obtém configuração específica por caminho
   */
  public async getConfig<T>(path: string): Promise<T | null> {
    const config = await this.loadFromCache()
    if (!config) return null

    return this.getNestedValue(config, path) as T || null
  }

  /**
   * Atualiza configuração específica
   */
  public async updateConfig(path: string, value: any): Promise<boolean> {
    try {
      let config = await this.loadFromCache() || this.defaultConfiguration
      
      // Atualizar valor aninhado
      this.setNestedValue(config, path, value)
      
      // Validar configuração atualizada
      const validation = this.validateConfiguration(config)
      if (!validation.isValid) {
        console.error('❌ ConfigurationCache: Invalid configuration update:', validation.errors)
        return false
      }

      // Salvar configuração atualizada
      await this.saveToCache(config)
      
      console.log(`✅ ConfigurationCache: Updated ${path} = ${JSON.stringify(value)}`)
      return true

    } catch (error) {
      console.error(`❌ ConfigurationCache: Failed to update ${path}:`, error)
      return false
    }
  }

  /**
   * Obtém estado de saúde da configuração
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    version: string
    lastUpdate: string
    validation: ConfigurationValidation
    cacheMetrics: any
  }> {
    const config = await this.loadFromCache()
    const validation = config ? this.validateConfiguration(config) : { isValid: false, errors: ['No configuration loaded'], warnings: [] }
    const cacheMetrics = this.cacheManager.getMetrics()
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (!validation.isValid) {
      status = 'critical'
    } else if (validation.warnings.length > 0) {
      status = 'warning'
    }

    return {
      status,
      version: this.CONFIG_VERSION,
      lastUpdate: config ? new Date(Date.now()).toISOString() : 'Never',
      validation,
      cacheMetrics
    }
  }

  // ============= MÉTODOS PRIVADOS =============

  private async loadFromCache(): Promise<AppConfiguration | null> {
    return await this.cacheManager.get<AppConfiguration>(this.CONFIG_KEY)
  }

  private async saveToCache(config: AppConfiguration): Promise<void> {
    await this.cacheManager.set(this.CONFIG_KEY, config, {
      ttl: this.CONFIG_TTL,
      strategy: 'hybrid',
      priority: 'critical',
      tags: ['configuration', 'app-settings']
    })
  }

  private async loadConfiguration(): Promise<AppConfiguration> {
    // Simular carregamento de configuração
    // Em produção, isto seria carregado de API, ficheiros, etc.
    
    let config = { ...this.defaultConfiguration }

    // Carregar configurações do localStorage se existirem
    try {
      const localConfig = localStorage.getItem('user_preferences')
      if (localConfig) {
        const userPrefs = JSON.parse(localConfig)
        config = this.mergeConfigurations(config, userPrefs)
      }
    } catch (error) {
      console.warn('ConfigurationCache: Failed to load user preferences')
    }

    // Detectar configurações do sistema
    config.ui.theme = this.detectSystemTheme()
    config.ui.language = this.detectSystemLanguage()

    return config
  }

  private applyEnvironmentOverrides(config: AppConfiguration): AppConfiguration {
    const overrides: Partial<AppConfiguration> = {}

    // Override de ambiente para API
    if (process.env.REACT_APP_API_URL) {
      overrides.api = {
        ...config.api,
        baseUrl: process.env.REACT_APP_API_URL
      }
    }

    // Override para debug mode
    if (process.env.REACT_APP_DEBUG === 'true') {
      overrides.development = {
        ...config.development,
        enableDebugMode: true,
        logLevel: 'debug',
        showPerformanceMetrics: true
      }
    }

    return this.mergeConfigurations(config, overrides)
  }

  private validateConfiguration(config: AppConfiguration): ConfigurationValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Validar API configuration
    if (!config.api.baseUrl || !config.api.baseUrl.startsWith('http')) {
      errors.push('Invalid API base URL')
    }
    
    if (config.api.timeout < 1000) {
      warnings.push('API timeout is very low (< 1s)')
    }

    if (config.api.retryAttempts > 5) {
      warnings.push('High retry attempts may cause performance issues')
    }

    // Validar cache configuration
    if (config.cache.maxSize < 1024 * 1024) {
      warnings.push('Cache max size is very low (< 1MB)')
    }

    if (config.cache.defaultTTL < 60000) {
      warnings.push('Default TTL is very low (< 1 minute)')
    }

    // Validar security configuration
    if (config.security.sessionTimeout < 3600000) {
      warnings.push('Session timeout is very low (< 1 hour)')
    }

    if (!config.security.enableCSRF && !config.development.enableDebugMode) {
      warnings.push('CSRF protection disabled in production')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private detectSystemTheme(): 'light' | 'dark' | 'auto' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  private detectSystemLanguage(): string {
    return navigator.language || navigator.languages?.[0] || 'pt-PT'
  }

  private mergeConfigurations(base: any, override: any): any {
    const result = { ...base }
    
    for (const key in override) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this.mergeConfigurations(base[key] || {}, override[key])
      } else {
        result[key] = override[key]
      }
    }
    
    return result
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const props = path.split('.')
    const lastProp = props.pop()!
    const target = props.reduce((current, prop) => {
      if (!current[prop]) current[prop] = {}
      return current[prop]
    }, obj)
    target[lastProp] = value
  }

  private logConfigurationSummary(config: AppConfiguration): void {
    console.log('📋 Configuration Summary:')
    console.log(`  🌐 API: ${config.api.baseUrl}`)
    console.log(`  🎨 Theme: ${config.ui.theme}`)
    console.log(`  🌍 Language: ${config.ui.language}`)
    console.log(`  📦 Cache: ${config.cache.enabled ? 'Enabled' : 'Disabled'}`)
    console.log(`  🚀 Performance: ${config.performance.preloadCriticalData ? 'Optimized' : 'Standard'}`)
    console.log(`  🔒 Security: Session timeout ${config.security.sessionTimeout / 60000}min`)
    console.log(`  🛠️ Debug: ${config.development.enableDebugMode ? 'ON' : 'OFF'}`)
  }
}

export default ConfigurationCache

// Type exports para uso em outras partes da aplicação
export type { AppConfiguration, ConfigurationValidation }