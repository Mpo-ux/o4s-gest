/**
 * Utilitário para gestão de servidores de desenvolvimento
 * Controla inicialização e encerramento dos processos Node.js
 */

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
    lastCheck: new Date()
  };

  private constructor() {}

  static getInstance(): ServerManager {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager();
    }
    return ServerManager.instance;
  }

  /**
   * Verifica se os servidores estão rodando
   */
  async checkServerStatus(): Promise<ServerStatus> {
    try {
      // Verifica API
      const apiResponse = await fetch('http://localhost:5000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.status.api = apiResponse.ok;
    } catch {
      this.status.api = false;
    }

    try {
      // Verifica Frontend
      const webResponse = await fetch('http://localhost:3000', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.status.web = webResponse.ok;
    } catch {
      this.status.web = false;
    }

    this.status.lastCheck = new Date();
    return { ...this.status };
  }

  /**
   * Inicia os servidores de desenvolvimento
   */
  async startServers(): Promise<void> {
    console.log('🚀 Iniciando servidores...');
    
    try {
      // Para processos existentes primeiro
      await this.stopAllNodeProcesses();
      
      // Aguarda um pouco para garantir que os processos foram encerrados
      await this.delay(2000);
      
      // Inicia API primeiro
      console.log('📡 Iniciando servidor API...');
      await this.startApiServer();
      
      // Aguarda API estar pronta
      await this.delay(3000);
      
      // Inicia Frontend
      console.log('🌐 Iniciando servidor Frontend...');
      await this.startWebServer();
      
      // Aguarda Frontend estar pronto
      await this.delay(3000);
      
      // Verifica status final
      const status = await this.checkServerStatus();
      if (status.api && status.web) {
        console.log('✅ Servidores iniciados com sucesso!');
      } else {
        console.warn('⚠️ Alguns servidores podem não estar respondendo');
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar servidores:', error);
      throw error;
    }
  }

  /**
   * Para todos os servidores
   */
  async stopServers(): Promise<void> {
    console.log('🛑 Encerrando servidores...');
    
    // Cancela processos controlados
    if (this.apiProcess) {
      this.apiProcess.abort();
      this.apiProcess = null;
    }
    
    if (this.webProcess) {
      this.webProcess.abort();
      this.webProcess = null;
    }
    
    // Para todos os processos Node.js
    await this.stopAllNodeProcesses();
    
    this.status = {
      api: false,
      web: false,
      lastCheck: new Date()
    };
    
    console.log('✅ Servidores encerrados');
  }

  /**
   * Para todos os processos Node.js do sistema
   */
  private async stopAllNodeProcesses(): Promise<void> {
    return new Promise((resolve) => {
      // Simula o comando PowerShell para parar processos Node.js
      // Em produção, isto seria implementado diferentemente
      console.log('🔄 Parando processos Node.js existentes...');
      
      // Notifica que os processos devem ser parados
      if (typeof window !== 'undefined') {
        (window as any).stopNodeProcesses?.();
      }
      
      setTimeout(resolve, 1000);
    });
  }

  /**
   * Inicia o servidor da API
   */
  private async startApiServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.apiProcess = new AbortController();
        
        // Em ambiente de desenvolvimento, delegamos para o sistema externo
        if (typeof window !== 'undefined') {
          (window as any).startApiServer?.();
        }
        
        setTimeout(resolve, 2000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Inicia o servidor web
   */
  private async startWebServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.webProcess = new AbortController();
        
        // Em ambiente de desenvolvimento, delegamos para o sistema externo
        if (typeof window !== 'undefined') {
          (window as any).startWebServer?.();
        }
        
        setTimeout(resolve, 2000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Utilitário para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém status atual
   */
  getStatus(): ServerStatus {
    return { ...this.status };
  }
}

export default ServerManager;