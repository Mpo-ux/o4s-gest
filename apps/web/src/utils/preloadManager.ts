/**
 * PreloadManager - Sistema de Pre-carregamento Inteligente
 * 
 * Sistema avançado para pre-carregamento de dados críticos durante
 * a inicialização da aplicação, com strategies de fallback e otimização.
 * 
 * Funcionalidades:
 * - Pre-loading de dados críticos baseado em prioridades
 * - Estratégias de fallback para falhas de carregamento
 * - Cache warming para melhor performance
 * - Carregamento progressivo e lazy loading
 * - Monitorização de performance de carregamento
 */

import CacheManager from './cacheManager'
import ConfigurationCache from './configurationCache'
import ConnectionCache from './connectionCache'
import AuthenticationCache from './authenticationCache'

interface PreloadTask {
  id: string
  name: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedTime: number
  dependencies?: string[]
  executor: () => Promise<any>
  fallback?: () => Promise<any>
  retry: {
    maxAttempts: number
    delay: number
    backoff: boolean
  }
}

interface PreloadResult {
  taskId: string
  success: boolean
  data?: any
  duration: number
  error?: string
  attempt: number
}

interface PreloadProgress {
  currentTask: string
  completedTasks: number
  totalTasks: number
  percentage: number
  estimatedTimeRemaining: number
  errors: string[]
}

export class PreloadManager {
  private static instance: PreloadManager
  private cacheManager: CacheManager
  private configCache: ConfigurationCache
  private connectionCache: ConnectionCache
  private authCache: AuthenticationCache
  private preloadTasks: Map<string, PreloadTask> = new Map()
  private results: Map<string, PreloadResult> = new Map()
  private progressCallbacks = new Set<(progress: PreloadProgress) => void>()
  private isPreloading = false

  private constructor() {
    this.cacheManager = CacheManager.getInstance()
    this.configCache = ConfigurationCache.getInstance()
    this.connectionCache = ConnectionCache.getInstance()
    this.authCache = AuthenticationCache.getInstance()
    this.initializeDefaultTasks()
  }

  public static getInstance(): PreloadManager {
    if (!PreloadManager.instance) {
      PreloadManager.instance = new PreloadManager()
    }
    return PreloadManager.instance
  }

  /**
   * Executa pré-carregamento completo da aplicação
   */
  public async preloadApplication(): Promise<{
    success: boolean
    results: PreloadResult[]
    totalTime: number
    errors: string[]
  }> {
    if (this.isPreloading) {
      console.warn('⚠️ Preload already in progress')
      return this.getLastResults()
    }

    console.log('🚀 Starting application preload...')
    this.isPreloading = true

    const startTime = performance.now()
    const results: PreloadResult[] = []
    const errors: string[] = []

    try {
      // Ordenar tasks por prioridade e dependências
      const orderedTasks = this.getOrderedTasks()
      
      // Executar tasks críticas em série
      const criticalTasks = orderedTasks.filter(task => task.priority === 'critical')
      for (const task of criticalTasks) {
        const result = await this.executeTask(task)
        results.push(result)
        
        if (!result.success) {
          errors.push(`Critical task failed: ${task.name}`)
        }
        
        this.updateProgress(task.id, results.length, orderedTasks.length)
      }

      // Executar tasks de alta prioridade em paralelo (máximo 3 simultâneas)
      const highPriorityTasks = orderedTasks.filter(task => task.priority === 'high')
      const highResults = await this.executeTasksBatch(highPriorityTasks, 3)
      results.push(...highResults)
      
      // Executar tasks de média e baixa prioridade em background
      const remainingTasks = orderedTasks.filter(
        task => task.priority === 'medium' || task.priority === 'low'
      )
      
      // Não bloquear aplicação para tasks não críticas
      this.executeTasksInBackground(remainingTasks)

      const totalTime = performance.now() - startTime
      const success = criticalTasks.every(task => {
        const result = results.find(r => r.taskId === task.id)
        return result?.success === true
      })

      console.log(`✅ Preload completed in ${Math.round(totalTime)}ms (${success ? 'SUCCESS' : 'PARTIAL'})`)
      
      return {
        success,
        results,
        totalTime,
        errors
      }

    } catch (error) {
      console.error('❌ Preload failed:', error)
      errors.push(error instanceof Error ? error.message : 'Unknown error')
      
      return {
        success: false,
        results,
        totalTime: performance.now() - startTime,
        errors
      }
    } finally {
      this.isPreloading = false
    }
  }

  /**
   * Executa warm-up do cache
   */
  public async warmUpCache(): Promise<boolean> {
    console.log('🔥 Warming up cache...')
    
    try {
      // Pré-carregar configurações
      await this.configCache.initialize()
      
      // Pré-carregar dados de conexão
      await this.connectionCache.initialize(['http://localhost:5000'])
      
      // Verificar e carregar tokens se existirem
      const tokenInfo = await this.authCache.getTokenInfo()
      if (tokenInfo) {
        await this.authCache.getCurrentUser()
      }

      // Pré-carregar dados frequentemente acedidos
      const frequentData = [
        'user_preferences',
        'app_settings',
        'navigation_state',
        'theme_settings'
      ]

      for (const key of frequentData) {
        // Tentar carregar do cache para warm-up
        await this.cacheManager.get(key)
      }

      console.log('✅ Cache warm-up completed')
      return true

    } catch (error) {
      console.error('❌ Cache warm-up failed:', error)
      return false
    }
  }

  /**
   * Adiciona task personalizada de preload
   */
  public addPreloadTask(task: PreloadTask): void {
    this.preloadTasks.set(task.id, task)
    console.log(`📋 Added preload task: ${task.name} (${task.priority})`)
  }

  /**
   * Remove task de preload
   */
  public removePreloadTask(taskId: string): boolean {
    const removed = this.preloadTasks.delete(taskId)
    if (removed) {
      console.log(`🗑️ Removed preload task: ${taskId}`)
    }
    return removed
  }

  /**
   * Adiciona callback para progresso
   */
  public onProgress(callback: (progress: PreloadProgress) => void): void {
    this.progressCallbacks.add(callback)
  }

  /**
   * Remove callback de progresso
   */
  public offProgress(callback: (progress: PreloadProgress) => void): void {
    this.progressCallbacks.delete(callback)
  }

  /**
   * Obtém resultados do último preload
   */
  public getLastResults(): {
    success: boolean
    results: PreloadResult[]
    totalTime: number
    errors: string[]
  } {
    const results = Array.from(this.results.values())
    const totalTime = results.reduce((sum, result) => sum + result.duration, 0)
    const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error')
    const success = results.every(r => r.success)

    return { success, results, totalTime, errors }
  }

  // ============= MÉTODOS PRIVADOS =============

  private initializeDefaultTasks(): void {
    // Task crítica: Carregar configuração
    this.addPreloadTask({
      id: 'load_configuration',
      name: 'Load Application Configuration',
      priority: 'critical',
      estimatedTime: 500,
      executor: async () => {
        return await this.configCache.initialize()
      },
      fallback: async () => {
        console.warn('⚠️ Using default configuration')
        return {}
      },
      retry: {
        maxAttempts: 3,
        delay: 1000,
        backoff: true
      }
    })

    // Task crítica: Verificar conexão com API
    this.addPreloadTask({
      id: 'check_api_connection',
      name: 'Check API Connection',
      priority: 'critical',
      estimatedTime: 2000,
      dependencies: ['load_configuration'],
      executor: async () => {
        const config = await this.configCache.getConfig<any>('api')
        if (config?.baseUrl) {
          await this.connectionCache.initialize([config.baseUrl])
          return await this.connectionCache.isServerAvailable(config.baseUrl)
        }
        return false
      },
      fallback: async () => {
        console.warn('⚠️ API connection failed, using offline mode')
        return false
      },
      retry: {
        maxAttempts: 3,
        delay: 2000,
        backoff: true
      }
    })

    // Task alta prioridade: Verificar autenticação
    this.addPreloadTask({
      id: 'verify_authentication',
      name: 'Verify Authentication',
      priority: 'high',
      estimatedTime: 1000,
      dependencies: ['check_api_connection'],
      executor: async () => {
        const tokenInfo = await this.authCache.getTokenInfo()
        if (tokenInfo) {
          const user = await this.authCache.getCurrentUser()
          return { authenticated: true, user }
        }
        return { authenticated: false }
      },
      retry: {
        maxAttempts: 2,
        delay: 1000,
        backoff: false
      }
    })

    // Task alta prioridade: Carregar preferências do utilizador
    this.addPreloadTask({
      id: 'load_user_preferences',
      name: 'Load User Preferences',
      priority: 'high',
      estimatedTime: 300,
      dependencies: ['verify_authentication'],
      executor: async () => {
        try {
          const preferences = localStorage.getItem('user_preferences')
          return preferences ? JSON.parse(preferences) : {}
        } catch (error) {
          return {}
        }
      },
      retry: {
        maxAttempts: 1,
        delay: 0,
        backoff: false
      }
    })

    // Task média prioridade: Cache de dados frequentes
    this.addPreloadTask({
      id: 'cache_frequent_data',
      name: 'Cache Frequent Data',
      priority: 'medium',
      estimatedTime: 1500,
      executor: async () => {
        return await this.warmUpCache()
      },
      retry: {
        maxAttempts: 2,
        delay: 500,
        backoff: false
      }
    })

    // Task baixa prioridade: Pré-carregar recursos estáticos
    this.addPreloadTask({
      id: 'preload_static_resources',
      name: 'Preload Static Resources',
      priority: 'low',
      estimatedTime: 3000,
      executor: async () => {
        // Pré-carregar imagens, fonts, etc.
        const resources = [
          '/favicon.ico',
          // Adicionar outros recursos conforme necessário
        ]

        const promises = resources.map(url => {
          return new Promise((resolve) => {
            const link = document.createElement('link')
            link.rel = 'prefetch'
            link.href = url
            link.onload = () => resolve(true)
            link.onerror = () => resolve(false)
            document.head.appendChild(link)
          })
        })

        await Promise.allSettled(promises)
        return true
      },
      retry: {
        maxAttempts: 1,
        delay: 0,
        backoff: false
      }
    })
  }

  private getOrderedTasks(): PreloadTask[] {
    const tasks = Array.from(this.preloadTasks.values())
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

    // Ordenar por prioridade e dependências
    return tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Verificar dependências
      if (a.dependencies?.includes(b.id)) return 1
      if (b.dependencies?.includes(a.id)) return -1

      return 0
    })
  }

  private async executeTask(task: PreloadTask): Promise<PreloadResult> {
    let attempt = 1
    const maxAttempts = task.retry.maxAttempts

    while (attempt <= maxAttempts) {
      const startTime = performance.now()
      
      try {
        console.log(`⚡ Executing task: ${task.name} (attempt ${attempt}/${maxAttempts})`)
        
        const data = await task.executor()
        const duration = performance.now() - startTime

        const result: PreloadResult = {
          taskId: task.id,
          success: true,
          data,
          duration,
          attempt
        }

        this.results.set(task.id, result)
        console.log(`✅ Task completed: ${task.name} (${Math.round(duration)}ms)`)
        
        return result

      } catch (error) {
        const duration = performance.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        console.warn(`⚠️ Task failed: ${task.name} (attempt ${attempt}/${maxAttempts}) - ${errorMessage}`)

        if (attempt === maxAttempts) {
          // Última tentativa - tentar fallback
          if (task.fallback) {
            try {
              console.log(`🔄 Executing fallback for: ${task.name}`)
              const data = await task.fallback()
              
              const result: PreloadResult = {
                taskId: task.id,
                success: true,
                data,
                duration,
                attempt,
                error: `Fallback used: ${errorMessage}`
              }

              this.results.set(task.id, result)
              return result

            } catch (fallbackError) {
              console.error(`❌ Fallback failed for: ${task.name}`, fallbackError)
            }
          }

          // Falha definitiva
          const result: PreloadResult = {
            taskId: task.id,
            success: false,
            duration,
            error: errorMessage,
            attempt
          }

          this.results.set(task.id, result)
          return result
        }

        // Aguardar antes de retry
        if (task.retry.delay > 0) {
          const delay = task.retry.backoff 
            ? task.retry.delay * Math.pow(2, attempt - 1)
            : task.retry.delay
          
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        attempt++
      }
    }

    // Nunca deve chegar aqui, mas por segurança
    return {
      taskId: task.id,
      success: false,
      duration: 0,
      error: 'Max attempts exceeded',
      attempt: maxAttempts
    }
  }

  private async executeTasksBatch(tasks: PreloadTask[], maxConcurrent: number): Promise<PreloadResult[]> {
    const results: PreloadResult[] = []
    
    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(task => this.executeTask(task))
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  private async executeTasksInBackground(tasks: PreloadTask[]): Promise<void> {
    // Executar em background sem bloquear
    setTimeout(async () => {
      for (const task of tasks) {
        try {
          await this.executeTask(task)
        } catch (error) {
          console.warn(`Background task failed: ${task.name}`, error)
        }
      }
      console.log('🎯 Background preload tasks completed')
    }, 100)
  }

  private updateProgress(currentTaskId: string, completed: number, total: number): void {
    const currentTask = this.preloadTasks.get(currentTaskId)
    const percentage = Math.round((completed / total) * 100)
    
    // Estimar tempo restante baseado em tasks completadas
    const completedResults = Array.from(this.results.values())
    const avgDuration = completedResults.length > 0 
      ? completedResults.reduce((sum, r) => sum + r.duration, 0) / completedResults.length
      : 1000

    const remainingTasks = total - completed
    const estimatedTimeRemaining = Math.round(remainingTasks * avgDuration)

    const progress: PreloadProgress = {
      currentTask: currentTask?.name || 'Unknown',
      completedTasks: completed,
      totalTasks: total,
      percentage,
      estimatedTimeRemaining,
      errors: completedResults.filter(r => !r.success).map(r => r.error || 'Unknown error')
    }

    // Notificar callbacks
    for (const callback of this.progressCallbacks) {
      try {
        callback(progress)
      } catch (error) {
        console.warn('Progress callback error:', error)
      }
    }
  }

  /**
   * Cleanup ao destruir instância
   */
  public destroy(): void {
    this.progressCallbacks.clear()
    this.preloadTasks.clear()
    this.results.clear()
    this.isPreloading = false
    
    console.log('🚀 PreloadManager: Destroyed')
  }
}

export default PreloadManager

// Type exports
export type { 
  PreloadTask, 
  PreloadResult, 
  PreloadProgress 
}