/**
 * PerformanceMonitor - Monitor de Performance da Aplicação
 * 
 * Componente que monitoriza e exibe métricas de performance em tempo real,
 * incluindo cache hits, tempo de carregamento e uso de memória.
 */

import React, { useState, useEffect } from 'react'
import CacheManager from '../utils/cacheManager'
import AppInitializer from '../utils/appInitializer'

interface PerformanceMetrics {
  cache: {
    hitRate: number
    totalOperations: number
    memoryUsage: number
    status: 'healthy' | 'warning' | 'critical'
  }
  app: {
    initTime: number
    uptime: number
    errors: number
    warnings: number
  }
  browser: {
    memory?: number
    timing?: {
      loadTime: number
      domContentLoaded: number
      domComplete: number
    }
  }
}

const PerformanceMonitor: React.FC<{ 
  isVisible: boolean
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'PENDING'
}> = ({ isVisible, userRole }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if user has permission to see performance metrics
  const hasPermission = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
  
  useEffect(() => {
    if (!isVisible || !hasPermission) return

    const updateMetrics = async () => {
      try {
        const cacheManager = CacheManager.getInstance()
        const appInitializer = AppInitializer.getInstance()
        
        const cacheMetrics = cacheManager.getMetrics()
        const cacheHealth = cacheManager.getHealthStatus()
        const initResult = appInitializer.getInitializationResult()
        // Health status for future use
        await appInitializer.getHealthStatus()

        // Browser performance metrics
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const browserMemory = (performance as any).memory

        const newMetrics: PerformanceMetrics = {
          cache: {
            hitRate: cacheMetrics.hitRate,
            totalOperations: cacheMetrics.totalOperations,
            memoryUsage: cacheHealth.memoryUsage,
            status: cacheHealth.status
          },
          app: {
            initTime: initResult?.duration || 0,
            uptime: Date.now() - (initResult?.duration || 0),
            errors: initResult?.errors.length || 0,
            warnings: initResult?.warnings.length || 0
          },
          browser: {
            memory: browserMemory?.usedJSHeapSize,
            timing: navigation ? {
              loadTime: navigation.loadEventEnd - navigation.loadEventStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              domComplete: navigation.domComplete - navigation.domInteractive
            } : undefined
          }
        }

        setMetrics(newMetrics)

      } catch (error) {
        console.warn('Performance metrics update failed:', error)
      }
    }

    // Initial update
    updateMetrics()

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible || !hasPermission || !metrics) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`mb-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          metrics.cache.status === 'healthy' 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : metrics.cache.status === 'warning'
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        📊 {metrics.cache.hitRate.toFixed(1)}% • {formatUptime(metrics.app.uptime)}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-black/90 backdrop-blur-lg text-white text-xs p-4 rounded-lg max-w-sm border border-gray-600">
          
          {/* Cache Metrics */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">💾 Cache</span>
              <span className={`font-medium ${getStatusColor(metrics.cache.status)}`}>
                {metrics.cache.status}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Hit Rate:</span>
                <span className="font-medium">{metrics.cache.hitRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Operations:</span>
                <span className="font-medium">{metrics.cache.totalOperations}</span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="font-medium">{metrics.cache.memoryUsage}%</span>
              </div>
            </div>
          </div>

          {/* App Metrics */}
          <div className="mb-3">
            <div className="font-semibold mb-1">🚀 Application</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Init Time:</span>
                <span className="font-medium">{Math.round(metrics.app.initTime)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="font-medium">{formatUptime(metrics.app.uptime)}</span>
              </div>
              {metrics.app.errors > 0 && (
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <span className="font-medium text-red-400">{metrics.app.errors}</span>
                </div>
              )}
              {metrics.app.warnings > 0 && (
                <div className="flex justify-between">
                  <span>Warnings:</span>
                  <span className="font-medium text-yellow-400">{metrics.app.warnings}</span>
                </div>
              )}
            </div>
          </div>

          {/* Browser Metrics */}
          {(metrics.browser.memory || metrics.browser.timing) && (
            <div>
              <div className="font-semibold mb-1">🌐 Browser</div>
              <div className="space-y-1">
                {metrics.browser.memory && (
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span className="font-medium">{formatBytes(metrics.browser.memory)}</span>
                  </div>
                )}
                {metrics.browser.timing && (
                  <>
                    <div className="flex justify-between">
                      <span>Load:</span>
                      <span className="font-medium">{Math.round(metrics.browser.timing.loadTime)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DOM Ready:</span>
                      <span className="font-medium">{Math.round(metrics.browser.timing.domContentLoaded)}ms</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const cacheManager = CacheManager.getInstance()
                  cacheManager.clear()
                  console.log('🧹 Cache cleared manually')
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
              >
                Clear Cache
              </button>
              <button
                onClick={() => {
                  console.table(metrics)
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
              >
                Log Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor