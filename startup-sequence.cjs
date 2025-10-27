const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

class O4SStartupSequence {
  constructor() {
    this.basePath = 'C:\\Users\\Sergio Lenovo Pc\\Desktop\\o4s gest';
    this.apiPath = path.join(this.basePath, 'apps', 'api');
    this.webPath = path.join(this.basePath, 'apps', 'web');
    
    this.processes = {
      api: null,
      frontend: null
    };
    
    this.config = {
      apiPort: 5000,
      frontendPort: 3000,
      startupTimeout: 15000,
      healthCheckInterval: 5000,
      maxRetries: 3
    };

    this.status = {
      api: { running: false, healthy: false, retries: 0 },
      frontend: { running: false, healthy: false, retries: 0 }
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      'INFO': 'ℹ️',
      'SUCCESS': '✅', 
      'ERROR': '❌',
      'WARNING': '⚠️',
      'STARTING': '🚀'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async killExistingProcesses() {
    this.log('Parando processos existentes...', 'WARNING');
    
    try {
      // Mata processos Node.js e Python
      await this.runCommand('taskkill', ['/F', '/IM', 'node.exe'], { ignoreError: true });
      await this.runCommand('taskkill', ['/F', '/IM', 'python.exe'], { ignoreError: true });
      
      // Aguarda 2 segundos para limpeza
      await this.sleep(2000);
      
      this.log('Processos anteriores terminados', 'SUCCESS');
    } catch (error) {
      this.log(`Aviso: ${error.message}`, 'WARNING');
    }
  }

  async startAPI() {
    this.log('Iniciando API Server...', 'STARTING');
    
    try {
      // Tenta primeiro o servidor bulletproof
      const bulletproofPath = path.join(this.apiPath, 'src', 'bulletproof-server.cjs');
      
      this.processes.api = spawn('node', [bulletproofPath], {
        cwd: this.apiPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      let startupSuccess = false;

      this.processes.api.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('API SERVER BLINDADO') || output.includes('Server running')) {
          startupSuccess = true;
          this.status.api.running = true;
          this.log('API Server iniciado!', 'SUCCESS');
        }
      });

      this.processes.api.stderr.on('data', (data) => {
        console.error('API Error:', data.toString());
      });

      this.processes.api.on('exit', (code) => {
        this.log(`API Server terminou com código ${code}`, code === 0 ? 'INFO' : 'ERROR');
        this.status.api.running = false;
        this.status.api.healthy = false;
      });

      // Aguarda startup ou timeout
      await this.waitForCondition(
        () => startupSuccess,
        this.config.startupTimeout,
        'API startup timeout'
      );

      // Verifica health
      await this.sleep(2000);
      const isHealthy = await this.checkPort(this.config.apiPort);
      this.status.api.healthy = isHealthy;
      
      if (isHealthy) {
        this.log(`API Server healthy na porta ${this.config.apiPort}`, 'SUCCESS');
        return true;
      } else {
        throw new Error('API não respondeu ao health check');
      }

    } catch (error) {
      this.log(`Erro na API: ${error.message}`, 'ERROR');
      this.status.api.retries++;
      
      if (this.status.api.retries < this.config.maxRetries) {
        this.log(`Retry ${this.status.api.retries}/${this.config.maxRetries} para API...`, 'WARNING');
        await this.sleep(3000);
        return await this.startAPI();
      }
      
      // Fallback para servidor simples
      return await this.startAPIFallback();
    }
  }

  async startAPIFallback() {
    this.log('Tentando API fallback...', 'WARNING');
    
    try {
      const fallbackPath = path.join(this.apiPath, 'src', 'simple-api.cjs');
      
      this.processes.api = spawn('node', [fallbackPath], {
        cwd: this.apiPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      await this.sleep(3000);
      const isHealthy = await this.checkPort(this.config.apiPort);
      
      if (isHealthy) {
        this.log('API Fallback funcionando!', 'SUCCESS');
        this.status.api.running = true;
        this.status.api.healthy = true;
        return true;
      }
      
      throw new Error('Fallback API também falhou');
      
    } catch (error) {
      this.log(`Fallback API falhou: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async startFrontend() {
    this.log('Iniciando Frontend...', 'STARTING');
    
    try {
      // Build do frontend primeiro
      await this.runCommand('npm', ['run', 'build'], { 
        cwd: this.webPath,
        timeout: 60000 
      });
      
      this.log('Frontend build concluído', 'SUCCESS');

      // Inicia servidor Python
      const distPath = path.join(this.webPath, 'dist');
      
      this.processes.frontend = spawn('python', ['-m', 'http.server', this.config.frontendPort.toString()], {
        cwd: distPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.frontend.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Serving HTTP')) {
          this.status.frontend.running = true;
          this.log('Frontend server iniciado!', 'SUCCESS');
        }
      });

      this.processes.frontend.on('exit', (code) => {
        this.log(`Frontend terminou com código ${code}`, code === 0 ? 'INFO' : 'ERROR');
        this.status.frontend.running = false;
        this.status.frontend.healthy = false;
      });

      // Aguarda startup
      await this.sleep(3000);
      
      // Testa se está respondendo
      const isHealthy = await this.checkFrontendHealth();
      this.status.frontend.healthy = isHealthy;
      
      if (isHealthy) {
        this.log(`Frontend healthy na porta ${this.config.frontendPort}`, 'SUCCESS');
        return true;
      } else {
        throw new Error('Frontend não está respondendo');
      }

    } catch (error) {
      this.log(`Erro no Frontend: ${error.message}`, 'ERROR');
      this.status.frontend.retries++;
      
      if (this.status.frontend.retries < this.config.maxRetries) {
        this.log(`Retry ${this.status.frontend.retries}/${this.config.maxRetries} para Frontend...`, 'WARNING');
        await this.sleep(3000);
        return await this.startFrontend();
      }
      
      return false;
    }
  }

  async checkFrontendHealth() {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.config.frontendPort}`, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      let output = '';
      proc.stdout?.on('data', (data) => output += data.toString());
      proc.stderr?.on('data', (data) => output += data.toString());

      proc.on('exit', (code) => {
        if (code === 0 || options.ignoreError) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${output}`));
        }
      });

      if (options.timeout) {
        setTimeout(() => {
          proc.kill('SIGKILL');
          reject(new Error('Command timeout'));
        }, options.timeout);
      }
    });
  }

  async waitForCondition(condition, timeout, errorMessage) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (condition()) return true;
      await this.sleep(500);
    }
    
    throw new Error(errorMessage);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getSystemStatus() {
    const apiHealth = await this.checkPort(this.config.apiPort);
    const frontendHealth = await this.checkFrontendHealth();
    
    return {
      api: {
        ...this.status.api,
        healthy: apiHealth,
        port: this.config.apiPort
      },
      frontend: {
        ...this.status.frontend,
        healthy: frontendHealth,
        port: this.config.frontendPort
      },
      timestamp: new Date().toISOString()
    };
  }

  async startComplete() {
    this.log('🚀 ========================================', 'STARTING');
    this.log('    O4S GESTÃO - STARTUP SEQUENCE', 'STARTING');
    this.log('🚀 ========================================', 'STARTING');
    
    try {
      // 1. Limpar processos existentes
      await this.killExistingProcesses();
      
      // 2. Iniciar API
      const apiSuccess = await this.startAPI();
      
      // 3. Iniciar Frontend
      const frontendSuccess = await this.startFrontend();
      
      // 4. Status final
      const finalStatus = await this.getSystemStatus();
      
      this.log('🎯 ========================================', 'SUCCESS');
      this.log('           STARTUP COMPLETO', 'SUCCESS');
      this.log('🎯 ========================================', 'SUCCESS');
      this.log(`API: ${finalStatus.api.healthy ? 'ONLINE' : 'OFFLINE'} (porta ${finalStatus.api.port})`, 
        finalStatus.api.healthy ? 'SUCCESS' : 'ERROR');
      this.log(`Frontend: ${finalStatus.frontend.healthy ? 'ONLINE' : 'OFFLINE'} (porta ${finalStatus.frontend.port})`, 
        finalStatus.frontend.healthy ? 'SUCCESS' : 'ERROR');
      this.log('🎯 ========================================', 'SUCCESS');
      
      if (finalStatus.api.healthy && finalStatus.frontend.healthy) {
        this.log('🌐 Abrindo browser...', 'SUCCESS');
        try {
          await this.runCommand('start', [`http://localhost:${this.config.frontendPort}`], { ignoreError: true });
        } catch (error) {
          this.log('Não foi possível abrir o browser automaticamente', 'WARNING');
        }
      }
      
      return finalStatus;

    } catch (error) {
      this.log(`Erro crítico no startup: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async stop() {
    this.log('Parando todos os serviços...', 'WARNING');
    
    if (this.processes.api) {
      this.processes.api.kill('SIGTERM');
    }
    
    if (this.processes.frontend) {
      this.processes.frontend.kill('SIGTERM');
    }
    
    await this.sleep(2000);
    await this.killExistingProcesses();
    
    this.log('Todos os serviços parados', 'SUCCESS');
  }
}

// Auto-start se executado diretamente
if (require.main === module) {
  const startup = new O4SStartupSequence();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔄 Shutdown solicitado...');
    await startup.stop();
    process.exit(0);
  });

  startup.startComplete().catch((error) => {
    console.error('💥 Falha crítica no startup:', error);
    process.exit(1);
  });
}

module.exports = { O4SStartupSequence };