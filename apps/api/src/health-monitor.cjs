const { spawn } = require('child_process');
const http = require('http');

class O4SHealthMonitor {
  constructor() {
    this.serverProcess = null;
    this.serverPath = 'C:\\Users\\Sergio Lenovo Pc\\Desktop\\o4s gest\\apps\\api\\src\\bulletproof-server.cjs';
    this.isMonitoring = false;
    this.restartCount = 0;
    this.maxRestarts = 5;
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Iniciando servidor API...');
      
      this.serverProcess = spawn('node', [this.serverPath], {
        cwd: 'C:\\Users\\Sergio Lenovo Pc\\Desktop\\o4s gest\\apps\\api',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('API SERVER BLINDADO')) {
          console.log('✅ Servidor iniciado com sucesso!');
          resolve(this.serverProcess);
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('❌ Erro do servidor:', data.toString());
      });

      this.serverProcess.on('error', (error) => {
        console.error('💥 Erro ao iniciar processo:', error);
        reject(error);
      });

      this.serverProcess.on('exit', (code, signal) => {
        console.log(`🔄 Servidor terminou com código ${code}, sinal ${signal}`);
        this.serverProcess = null;
        
        if (this.isMonitoring && this.restartCount < this.maxRestarts) {
          this.restartCount++;
          console.log(`🔄 Tentativa de restart ${this.restartCount}/${this.maxRestarts}...`);
          setTimeout(() => this.startServer(), 2000);
        }
      });

      // Timeout de startup
      setTimeout(() => {
        if (!this.serverProcess || this.serverProcess.exitCode !== null) {
          reject(new Error('Timeout no startup do servidor'));
        }
      }, 10000);
    });
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:5000/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            resolve({ success: true, health });
          } catch (error) {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });
    });
  }

  async startMonitoring() {
    this.isMonitoring = true;
    console.log('👀 Iniciando monitorização...');
    
    try {
      await this.startServer();
      
      // Health check a cada 30 segundos
      setInterval(async () => {
        const health = await this.checkHealth();
        if (health.success) {
          console.log(`💚 Health OK - Uptime: ${health.health.uptime}s, Requests: ${health.health.requests}`);
        } else {
          console.log(`❤️ Health FAIL: ${health.error}`);
          if (this.restartCount < this.maxRestarts) {
            console.log('🔄 Reiniciando servidor...');
            this.stopServer();
            setTimeout(() => this.startServer(), 3000);
          }
        }
      }, 30000);

    } catch (error) {
      console.error('💥 Falha crítica:', error);
    }
  }

  stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Parando servidor...');
      this.serverProcess.kill('SIGTERM');
      this.serverProcess = null;
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.stopServer();
    console.log('🛑 Monitorização parada');
  }
}

// Auto-start se executado diretamente
if (require.main === module) {
  const monitor = new O4SHealthMonitor();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🔄 Shutdown solicitado...');
    monitor.stopMonitoring();
    process.exit(0);
  });

  monitor.startMonitoring();
}

module.exports = { O4SHealthMonitor };