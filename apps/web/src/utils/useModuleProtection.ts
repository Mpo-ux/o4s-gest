/**
 * O4S Gestão - React Hook para Proteção de Módulos
 * Integra o sistema de proteção com componentes React
 */

import { useEffect, useCallback, useState } from 'react'
import { moduleProtection, ModuleVersion, ModuleBackup } from '../utils/moduleProtection'

export interface UseModuleProtectionOptions {
  moduleId: string
  moduleName: string
  version: string
  autoRegister?: boolean
  features?: string[]
  dependencies?: string[]
  themeCompatible?: boolean
}

export interface ModuleProtectionState {
  isRegistered: boolean
  isProtected: boolean
  hasBackups: boolean
  backupCount: number
  isThemeCompatible: boolean
  lastBackup?: string
  dependenciesValid: boolean
  missingDependencies: string[]
}

export function useModuleProtection(options: UseModuleProtectionOptions) {
  const [state, setState] = useState<ModuleProtectionState>({
    isRegistered: false,
    isProtected: false,
    hasBackups: false,
    backupCount: 0,
    isThemeCompatible: true,
    dependenciesValid: true,
    missingDependencies: []
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Registra o módulo no sistema de proteção
   */
  const registerModule = useCallback(async (content: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const success = moduleProtection.registerModule({
        id: options.moduleId,
        name: options.moduleName,
        version: options.version,
        content,
        dependencies: options.dependencies,
        features: options.features,
        theme_compatible: options.themeCompatible ?? true
      })

      if (success) {
        console.log(`✅ Módulo ${options.moduleName} registrado com proteção`)
        updateState()
      } else {
        setError(`Falha ao registrar módulo ${options.moduleName}`)
      }

      return success
    } catch (err) {
      const errorMsg = `Erro ao registrar módulo: ${err}`
      setError(errorMsg)
      console.error(errorMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [options])

  /**
   * Restaura módulo a partir de backup
   */
  const restoreModule = useCallback((version?: string): ModuleBackup | null => {
    try {
      const backup = moduleProtection.restoreModule(options.moduleId, version)
      
      if (backup) {
        console.log(`🔄 Módulo ${options.moduleName} restaurado para v${backup.version}`)
        updateState()
        return backup
      } else {
        setError(`Nenhum backup encontrado para ${options.moduleName}`)
        return null
      }
    } catch (err) {
      const errorMsg = `Erro ao restaurar módulo: ${err}`
      setError(errorMsg)
      console.error(errorMsg)
      return null
    }
  }, [options.moduleId, options.moduleName])

  /**
   * Atualiza estado do módulo
   */
  const updateState = useCallback(() => {
    try {
      const moduleInfo = moduleProtection.getModuleInfo(options.moduleId)
      const dependencyCheck = moduleProtection.checkDependencies(options.moduleId)
      const isThemeCompatible = moduleProtection.isThemeCompatible(options.moduleId)

      // Simular contagem de backups (seria obtida do sistema real)
      const backupCount = 0 // moduleProtection.getBackupCount(options.moduleId)

      setState({
        isRegistered: !!moduleInfo,
        isProtected: !!moduleInfo,
        hasBackups: backupCount > 0,
        backupCount,
        isThemeCompatible,
        lastBackup: moduleInfo?.timestamp,
        dependenciesValid: dependencyCheck.valid,
        missingDependencies: dependencyCheck.missing
      })

      setError(null)
    } catch (err) {
      setError(`Erro ao atualizar estado: ${err}`)
    }
  }, [options.moduleId])

  /**
   * Força criação de backup
   */
  const createBackup = useCallback(async (content: string) => {
    try {
      // Re-registrar para criar backup
      await registerModule(content)
      updateState()
      return true
    } catch (err) {
      setError(`Erro ao criar backup: ${err}`)
      return false
    }
  }, [registerModule])

  /**
   * Verifica se feature flag está ativa
   */
  const isFeatureEnabled = useCallback((feature: string): boolean => {
    return moduleProtection.isFeatureEnabled(feature)
  }, [])

  /**
   * Ativa/desativa feature flag
   */
  const setFeatureFlag = useCallback((feature: string, enabled: boolean) => {
    moduleProtection.setFeatureFlag(feature, enabled)
  }, [])

  /**
   * Obtém informações detalhadas do módulo
   */
  const getModuleInfo = useCallback((): ModuleVersion | null => {
    return moduleProtection.getModuleInfo(options.moduleId)
  }, [options.moduleId])

  /**
   * Auto-registro na inicialização
   */
  useEffect(() => {
    if (options.autoRegister) {
      // Simular conteúdo do módulo para registro automático
      const mockContent = `// ${options.moduleName} v${options.version}\n// Auto-registered module`
      registerModule(mockContent)
    } else {
      updateState()
      setIsLoading(false)
    }
  }, [options.autoRegister, registerModule, updateState])

  /**
   * Validação de dependências em tempo real
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isRegistered) {
        const dependencyCheck = moduleProtection.checkDependencies(options.moduleId)
        if (dependencyCheck.valid !== state.dependenciesValid || 
            JSON.stringify(dependencyCheck.missing) !== JSON.stringify(state.missingDependencies)) {
          updateState()
        }
      }
    }, 5000) // Verifica a cada 5 segundos

    return () => clearInterval(interval)
  }, [options.moduleId, state.isRegistered, state.dependenciesValid, state.missingDependencies, updateState])

  return {
    // Estado
    state,
    isLoading,
    error,

    // Ações
    registerModule,
    restoreModule,
    createBackup,
    updateState,

    // Utilitários
    isFeatureEnabled,
    setFeatureFlag,
    getModuleInfo,

    // Helpers
    clearError: () => setError(null),
    refresh: updateState
  }
}

/**
 * Hook para monitorar sistema global de proteção
 */
export function useModuleProtectionSystem() {
  const [systemState, setSystemState] = useState({
    totalModules: 0,
    totalBackups: 0,
    themeCompatible: 0,
    withDependencies: 0,
    featureFlags: 0
  })

  const [isLoading, setIsLoading] = useState(true)

  const updateSystemState = useCallback(() => {
    try {
      const report = moduleProtection.getSystemReport()
      setSystemState({
        totalModules: report.total_modules,
        totalBackups: report.total_backups,
        themeCompatible: report.theme_compatible,
        withDependencies: report.with_dependencies,
        featureFlags: report.feature_flags
      })
    } catch (err) {
      console.error('Erro ao atualizar estado do sistema:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const exportModules = useCallback(() => {
    return moduleProtection.exportModules()
  }, [])

  const importModules = useCallback((data: string) => {
    const success = moduleProtection.importModules(data)
    if (success) {
      updateSystemState()
    }
    return success
  }, [updateSystemState])

  const cleanupBackups = useCallback((moduleId?: string) => {
    moduleProtection.cleanupBackups(moduleId)
    updateSystemState()
  }, [updateSystemState])

  const listModules = useCallback(() => {
    return moduleProtection.listModules()
  }, [])

  useEffect(() => {
    updateSystemState()
  }, [updateSystemState])

  return {
    systemState,
    isLoading,
    updateSystemState,
    exportModules,
    importModules,
    cleanupBackups,
    listModules
  }
}