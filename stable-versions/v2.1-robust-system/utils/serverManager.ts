// --- BEGIN CLEAN SINGLE-CLASS IMPLEMENTATION ---
export interface ServerStatus {
  api: boolean;
  web: boolean;
  lastCheck: Date;
}

class ServerManager {
  private static instance: ServerManager;
  private apiProcess: AbortController | null = null;
  private webProcess: AbortController | null = null;
  private status: ServerStatus = {
    api: false,
    web: false,
    lastCheck: new Date(),
  };

  private constructor() {}

  static getInstance(): ServerManager {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager();
    }
    return ServerManager.instance;
  }

  async checkServerStatus(): Promise<ServerStatus> {
    try {
      const apiResponse = await fetch("http://localhost:5000/health", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      this.status.api = apiResponse.ok;
    } catch {
      this.status.api = false;
    }
    try {
      const webResponse = await fetch("http://localhost:3000", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      this.status.web = webResponse.ok;
    } catch {
      this.status.web = false;
    }
    this.status.lastCheck = new Date();
    return { ...this.status };
  }

  async startServers(): Promise<void> {
    console.log("🚀 Iniciando servidores...");
    try {
      await this.stopAllNodeProcesses();
      await this.delay(2000);
      console.log("📡 Iniciando servidor API...");
      await this.startApiServer();
      await this.delay(3000);
      console.log("🌐 Iniciando servidor Frontend...");
      await this.startWebServer();
      await this.delay(3000);
      const status = await this.checkServerStatus();
      if (status.api && status.web) {
        console.log("✅ Servidores iniciados com sucesso!");
      } else {
        console.warn("⚠️ Alguns servidores podem não estar respondendo");
      }
    } catch (error) {
      console.error("❌ Erro ao iniciar servidores:", error);
      throw error;
    }
  }

  async stopServers(): Promise<void> {
    console.log("🛑 Encerrando servidores...");
    if (this.apiProcess) {
      this.apiProcess.abort();
      this.apiProcess = null;
    }
    if (this.webProcess) {
      this.webProcess.abort();
      this.webProcess = null;
    }
    await this.stopAllNodeProcesses();
    this.status = {
      api: false,
      web: false,
      lastCheck: new Date(),
    };
    console.log("✅ Servidores encerrados");
  }

  private async stopAllNodeProcesses(): Promise<void> {
    return new Promise((resolve) => {
      console.log("🔄 Parando processos Node.js existentes...");
      if (typeof window !== "undefined") {
        (window as any).stopNodeProcesses?.();
      }
      setTimeout(resolve, 1000);
    });
  }

  private async startApiServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.apiProcess = new AbortController();
        if (typeof window !== "undefined") {
          (window as any).startApiServer?.();
        }
        setTimeout(resolve, 2000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async startWebServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.webProcess = new AbortController();
        if (typeof window !== "undefined") {
          (window as any).startWebServer?.();
        }
        setTimeout(resolve, 2000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStatus(): ServerStatus {
    return { ...this.status };
  }
}

export default ServerManager;
// --- END CLEAN SINGLE-CLASS IMPLEMENTATION ---
