// Sistema de rastreamento de utilizadores online
interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  lastSeen: Date;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

class OnlineUserManager {
  private static instance: OnlineUserManager;
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private sessionTimeoutMs = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    // Cleanup de utilizadores inativos a cada minuto
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, 60000);
  }

  static getInstance(): OnlineUserManager {
    if (!OnlineUserManager.instance) {
      OnlineUserManager.instance = new OnlineUserManager();
    }
    return OnlineUserManager.instance;
  }

  /**
   * Regista utilizador como online
   */
  addUser(user: {
    userId: string;
    name: string;
    email: string;
    role: string;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    console.log(
      `👤 [ONLINE] Utilizador ${user.name} (${user.email}) conectado`
    );

    this.onlineUsers.set(user.sessionId, {
      ...user,
      lastSeen: new Date(),
    });
  }

  /**
   * Atualiza última atividade do utilizador
   */
  updateUserActivity(sessionId: string): void {
    const user = this.onlineUsers.get(sessionId);
    if (user) {
      user.lastSeen = new Date();
      console.log(`🔄 [ONLINE] Atividade atualizada para ${user.name}`);
    }
  }

  /**
   * Remove utilizador (logout)
   */
  removeUser(sessionId: string): void {
    const user = this.onlineUsers.get(sessionId);
    if (user) {
      console.log(`👋 [ONLINE] Utilizador ${user.name} desconectado`);
      this.onlineUsers.delete(sessionId);
    }
  }

  /**
   * Remove utilizadores inativos
   */
  private cleanupInactiveUsers(): void {
    const now = new Date();
    const inactiveUsers: string[] = [];

    for (const [sessionId, user] of this.onlineUsers.entries()) {
      const timeSinceLastSeen = now.getTime() - user.lastSeen.getTime();
      if (timeSinceLastSeen > this.sessionTimeoutMs) {
        inactiveUsers.push(sessionId);
      }
    }

    inactiveUsers.forEach((sessionId) => {
      const user = this.onlineUsers.get(sessionId);
      if (user) {
        console.log(
          `⏰ [ONLINE] Utilizador ${user.name} removido por inatividade`
        );
        this.onlineUsers.delete(sessionId);
      }
    });

    if (inactiveUsers.length > 0) {
      console.log(
        `🟹 [ONLINE] ${inactiveUsers.length} utilizadores inativos removidos`
      );
    }
  }
}

export default OnlineUserManager;
