// Sistema de rastreamento de utilizadores online
interface OnlineUser {
  userId: string
  name: string
  email: string
  role: string
  lastSeen: Date
  sessionId: string
  ipAddress?: string
  userAgent?: string
}

class OnlineUserManager {
  private static instance: OnlineUserManager
  private onlineUsers: Map<string, OnlineUser> = new Map()
  private sessionTimeoutMs = 5 * 60 * 1000 // 5 minutos

  private constructor() {
    // Cleanup de utilizadores inativos a cada minuto
    setInterval(() => {
      this.cleanupInactiveUsers()
    }, 60000)
  }

  static getInstance(): OnlineUserManager {
    if (!OnlineUserManager.instance) {
      OnlineUserManager.instance = new OnlineUserManager()
    }
    return OnlineUserManager.instance
  }

  /**
   * Regista utilizador como online
   */
  addUser(user: {
    userId: string
    name: string
    email: string
    role: string
    sessionId: string
    ipAddress?: string
    userAgent?: string
  }): void {
    console.log(`👤 [ONLINE] Utilizador ${user.name} (${user.email}) conectado`)
    
    this.onlineUsers.set(user.sessionId, {
      ...user,
      lastSeen: new Date()
    })
  }

  /**
   * Atualiza última atividade do utilizador
   */
  updateUserActivity(sessionId: string): void {
    const user = this.onlineUsers.get(sessionId)
    if (user) {
      user.lastSeen = new Date()
      console.log(`🔄 [ONLINE] Atividade atualizada para ${user.name}`)
    }
  }

  /**
   * Remove utilizador (logout)
   */
  removeUser(sessionId: string): void {
    const user = this.onlineUsers.get(sessionId)
    if (user) {
      console.log(`👋 [ONLINE] Utilizador ${user.name} desconectado`)
      this.onlineUsers.delete(sessionId)
    }
  }

  /**
   * Remove utilizadores inativos
   */
  private cleanupInactiveUsers(): void {
    const now = new Date()
    const inactiveUsers: string[] = []

    for (const [sessionId, user] of this.onlineUsers.entries()) {
      const timeSinceLastSeen = now.getTime() - user.lastSeen.getTime()
      if (timeSinceLastSeen > this.sessionTimeoutMs) {
        inactiveUsers.push(sessionId)
      }
    }

    inactiveUsers.forEach(sessionId => {
      const user = this.onlineUsers.get(sessionId)
      if (user) {
        console.log(`⏰ [ONLINE] Utilizador ${user.name} removido por inatividade`)
        this.onlineUsers.delete(sessionId)
      }
    })

    if (inactiveUsers.length > 0) {
      console.log(`🧹 [ONLINE] ${inactiveUsers.length} utilizadores inativos removidos`)
    }
  }

  /**
   * Obtém lista de utilizadores online
   */
  getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values())
  }

  /**
   * Obtém contagem de utilizadores online
   */
  getOnlineCount(): number {
    return this.onlineUsers.size
  }

  /**
   * Obtém contagem por role
   */
  getOnlineCountByRole(): Record<string, number> {
    const counts: Record<string, number> = {}
    
    for (const user of this.onlineUsers.values()) {
      counts[user.role] = (counts[user.role] || 0) + 1
    }
    
    return counts
  }

  /**
   * Verifica se utilizador está online
   */
  isUserOnline(userId: string): boolean {
    for (const user of this.onlineUsers.values()) {
      if (user.userId === userId) return true
    }
    return false
  }
}

export default OnlineUserManager