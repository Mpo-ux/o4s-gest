/**
 * O4S Gestão - Module Protection System
 * Versão: 1.0.0
 * Protege módulos contra regressões e garante isolamento
 */

export interface ModuleVersion {
  id: string
  name: string
  version: string
  timestamp: string
  checksum: string
  dependencies: string[]
  features: string[]
  theme_compatible: boolean
  api_version: string
}

export interface ModuleBackup {
  moduleId: string
  version: string
  content: string
  metadata: ModuleVersion
  created_at: string
}

export interface ModuleRegistry {
  modules: Map<string, ModuleVersion>
  backups: Map<string, ModuleBackup[]>
  dependencies: Map<string, string[]>
  feature_flags: Map<string, boolean>
}

export class ModuleProtectionSystem {
  private static instance: ModuleProtectionSystem
  private registry: ModuleRegistry
  private backupEnabled: boolean = true
  private maxBackups: number = 10

  private constructor() {
    this.registry = {
      modules: new Map(),
      backups: new Map(),
      dependencies: new Map(),
      feature_flags: new Map()
    }
    
    this.loadRegistry()
  }

  static getInstance(): ModuleProtectionSystem {
    if (!ModuleProtectionSystem.instance) {
      ModuleProtectionSystem.instance = new ModuleProtectionSystem()
    }
    return ModuleProtectionSystem.instance
  }

  /**
   * Registra um módulo no sistema de proteção
   */
  registerModule(moduleData: {
    id: string
    name: string
    version: string
    content: string
    dependencies?: string[]
    features?: string[]
    theme_compatible?: boolean
  }): boolean {
    try {
      const checksum = this.calculateChecksum(moduleData.content)
      
      const moduleVersion: ModuleVersion = {
        id: moduleData.id,
        name: moduleData.name,
        version: moduleData.version,
        timestamp: new Date().toISOString(),
        checksum,
        dependencies: moduleData.dependencies || [],
        features: moduleData.features || [],
        theme_compatible: moduleData.theme_compatible ?? true,
        api_version: '1.0.0'
      }

      // Criar backup antes de registrar
      if (this.backupEnabled) {
        this.createBackup(moduleData.id, moduleData.content, moduleVersion)
      }

      // Registrar módulo
      this.registry.modules.set(moduleData.id, moduleVersion)
      
      // Atualizar dependências
      if (moduleData.dependencies) {
        this.registry.dependencies.set(moduleData.id, moduleData.dependencies)
      }

      this.saveRegistry()
      
      console.log(`🛡️ Módulo protegido: ${moduleData.name} v${moduleData.version}`)
      return true
      
    } catch (error) {
      console.error(`❌ Erro ao registrar módulo ${moduleData.id}:`, error)
      return false
    }
  }

  /**
   * Cria backup automático de um módulo
   */
  private createBackup(moduleId: string, content: string, metadata: ModuleVersion): void {
    const backup: ModuleBackup = {
      moduleId,
      version: metadata.version,
      content,
      metadata,
      created_at: new Date().toISOString()
    }

    if (!this.registry.backups.has(moduleId)) {
      this.registry.backups.set(moduleId, [])
    }

    const backups = this.registry.backups.get(moduleId)!
    backups.unshift(backup) // Adiciona no início

    // Limita número de backups
    if (backups.length > this.maxBackups) {
      backups.splice(this.maxBackups)
    }

    this.registry.backups.set(moduleId, backups)
  }

  /**
   * Restaura um módulo a partir de backup
   */
  restoreModule(moduleId: string, version?: string): ModuleBackup | null {
    const backups = this.registry.backups.get(moduleId)
    
    if (!backups || backups.length === 0) {
      console.warn(`⚠️ Nenhum backup encontrado para ${moduleId}`)
      return null
    }

    let targetBackup: ModuleBackup | undefined

    if (version) {
      targetBackup = backups.find(b => b.version === version)
    } else {
      targetBackup = backups[0] // Mais recente
    }

    if (targetBackup) {
      console.log(`🔄 Restaurando ${moduleId} v${targetBackup.version}`)
      return targetBackup
    }

    return null
  }

  /**
   * Verifica compatibilidade de tema
   */
  isThemeCompatible(moduleId: string): boolean {
    const module = this.registry.modules.get(moduleId)
    return module?.theme_compatible ?? false
  }

  /**
   * Verifica dependências de um módulo
   */
  checkDependencies(moduleId: string): { valid: boolean; missing: string[] } {
    const dependencies = this.registry.dependencies.get(moduleId) || []
    const missing: string[] = []

    for (const dep of dependencies) {
      if (!this.registry.modules.has(dep)) {
        missing.push(dep)
      }
    }

    return {
      valid: missing.length === 0,
      missing
    }
  }

  /**
   * Lista todos os módulos registrados
   */
  listModules(): ModuleVersion[] {
    return Array.from(this.registry.modules.values())
  }

  /**
   * Obtém informações de um módulo
   */
  getModuleInfo(moduleId: string): ModuleVersion | null {
    return this.registry.modules.get(moduleId) || null
  }

  /**
   * Calcula checksum para detecção de alterações
   */
  private calculateChecksum(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Carrega registry do localStorage
   */
  private loadRegistry(): void {
    try {
      const stored = localStorage.getItem('o4s_module_registry')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Converter arrays para Maps
        this.registry.modules = new Map(data.modules || [])
        this.registry.backups = new Map(data.backups || [])
        this.registry.dependencies = new Map(data.dependencies || [])
        this.registry.feature_flags = new Map(data.feature_flags || [])
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar registry de módulos:', error)
    }
  }

  /**
   * Salva registry no localStorage
   */
  private saveRegistry(): void {
    try {
      const data = {
        modules: Array.from(this.registry.modules.entries()),
        backups: Array.from(this.registry.backups.entries()),
        dependencies: Array.from(this.registry.dependencies.entries()),
        feature_flags: Array.from(this.registry.feature_flags.entries()),
        last_updated: new Date().toISOString()
      }
      
      localStorage.setItem('o4s_module_registry', JSON.stringify(data))
    } catch (error) {
      console.error('❌ Erro ao salvar registry de módulos:', error)
    }
  }

  /**
   * Exporta configuração de módulos
   */
  exportModules(): string {
    return JSON.stringify({
      registry: {
        modules: Array.from(this.registry.modules.entries()),
        backups: Array.from(this.registry.backups.entries()),
        dependencies: Array.from(this.registry.dependencies.entries()),
        feature_flags: Array.from(this.registry.feature_flags.entries())
      },
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2)
  }

  /**
   * Importa configuração de módulos
   */
  importModules(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      
      if (parsed.registry) {
        this.registry.modules = new Map(parsed.registry.modules || [])
        this.registry.backups = new Map(parsed.registry.backups || [])
        this.registry.dependencies = new Map(parsed.registry.dependencies || [])
        this.registry.feature_flags = new Map(parsed.registry.feature_flags || [])
        
        this.saveRegistry()
        console.log('✅ Módulos importados com sucesso')
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Erro ao importar módulos:', error)
      return false
    }
  }

  /**
   * Ativa/desativa feature flag
   */
  setFeatureFlag(flag: string, enabled: boolean): void {
    this.registry.feature_flags.set(flag, enabled)
    this.saveRegistry()
  }

  /**
   * Verifica se feature flag está ativa
   */
  isFeatureEnabled(flag: string): boolean {
    return this.registry.feature_flags.get(flag) ?? false
  }

  /**
   * Limpa backups antigos
   */
  cleanupBackups(moduleId?: string): void {
    if (moduleId) {
      const backups = this.registry.backups.get(moduleId)
      if (backups && backups.length > this.maxBackups) {
        this.registry.backups.set(moduleId, backups.slice(0, this.maxBackups))
      }
    } else {
      // Limpar todos os módulos
      for (const [id, backups] of this.registry.backups.entries()) {
        if (backups.length > this.maxBackups) {
          this.registry.backups.set(id, backups.slice(0, this.maxBackups))
        }
      }
    }
    
    this.saveRegistry()
  }

  /**
   * Relatório de status dos módulos
   */
  getSystemReport(): {
    total_modules: number
    total_backups: number
    theme_compatible: number
    with_dependencies: number
    feature_flags: number
    modules: ModuleVersion[]
  } {
    const modules = Array.from(this.registry.modules.values())
    
    return {
      total_modules: modules.length,
      total_backups: Array.from(this.registry.backups.values()).reduce((acc, backups) => acc + backups.length, 0),
      theme_compatible: modules.filter(m => m.theme_compatible).length,
      with_dependencies: Array.from(this.registry.dependencies.values()).filter(deps => deps.length > 0).length,
      feature_flags: this.registry.feature_flags.size,
      modules
    }
  }
}

// Singleton instance
export const moduleProtection = ModuleProtectionSystem.getInstance()