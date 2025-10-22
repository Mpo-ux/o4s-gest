#!/usr/bin/env node

/**
 * Script para gestão de processos de desenvolvimento
 * Permite iniciar/parar servidores de forma controlada
 */

const { spawn, exec } = require('child_process');
const path = require('path');

class DevServerManager {
  constructor() {
    this.apiProcess = null;
    this.webProcess = null;
  }

  /**
   * Para todos os processos Node.js
   */
  async stopAllNodeProcesses() {
    return new Promise((resolve) => {
      console.log('🛑 Parando todos os processos Node.js...');
      
      if (process.platform === 'win32') {
        exec('taskkill /F /IM node.exe', (error) => {
          if (error) {
            console.log('ℹ️ Nenhum processo Node.js encontrado ou já encerrado');
          } else {
            console.log('✅ Processos Node.js encerrados');
          }
          resolve();
        });
      } else {
        exec('pkill -f node', (error) => {
          if (error) {
            console.log('ℹ️ Nenhum processo Node.js encontrado ou já encerrado');
          } else {
            console.log('✅ Processos Node.js encerrados');
          }
          resolve();
        });
      }
    });
  }

  /**
   * Inicia o servidor da API
   */
  async startApiServer() {
    return new Promise((resolve, reject) => {
      console.log('📡 Iniciando servidor API...');
      
      const apiPath = path.resolve(__dirname, '..');
      this.apiProcess = spawn('npm', ['run', 'dev:api'], {
        cwd: apiPath,
        stdio: 'pipe',
        shell: true
      });

      let started = false;
      
      this.apiProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('API:', output.trim());
        
        if (output.includes('Server running on port 5000') && !started) {
          started = true;
          console.log('✅ Servidor API iniciado');
          resolve();
        }
      });

      this.apiProcess.stderr.on('data', (data) => {
        console.error('API Error:', data.toString().trim());
      });

      this.apiProcess.on('close', (code) => {
        console.log(`📡 Processo API encerrado com código ${code}`);
        this.apiProcess = null;
      });

      // Timeout de segurança
      setTimeout(() => {
        if (!started) {
          console.log('✅ Servidor API iniciado (timeout)');
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Inicia o servidor web
   */
  async startWebServer() {
    return new Promise((resolve, reject) => {
      console.log('🌐 Iniciando servidor Web...');
      
      const webPath = path.resolve(__dirname, '..');
      this.webProcess = spawn('npm', ['run', 'dev:web'], {
        cwd: webPath,
        stdio: 'pipe',
        shell: true
      });

      let started = false;
      
      this.webProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Web:', output.trim());
        
        if (output.includes('Local:   http://localhost:3000') && !started) {
          started = true;
          console.log('✅ Servidor Web iniciado');
          resolve();
        }
      });

      this.webProcess.stderr.on('data', (data) => {
        console.error('Web Error:', data.toString().trim());
      });

      this.webProcess.on('close', (code) => {
        console.log(`🌐 Processo Web encerrado com código ${code}`);
        this.webProcess = null;
      });

      // Timeout de segurança
      setTimeout(() => {
        if (!started) {
          console.log('✅ Servidor Web iniciado (timeout)');
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Inicia todos os servidores
   */
  async startAll() {
    try {
      // Para processos existentes
      await this.stopAllNodeProcesses();
      
      // Aguarda um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Inicia API primeiro
      await this.startApiServer();
      
      // Aguarda um pouco
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Inicia Web
      await this.startWebServer();
      
      console.log('🚀 Todos os servidores iniciados!');
    } catch (error) {
      console.error('❌ Erro ao iniciar servidores:', error);
      throw error;
    }
  }

  /**
   * Para todos os servidores
   */
  async stopAll() {
    console.log('🛑 Parando todos os servidores...');
    
    if (this.apiProcess) {
      this.apiProcess.kill();
      this.apiProcess = null;
    }
    
    if (this.webProcess) {
      this.webProcess.kill();
      this.webProcess = null;
    }
    
    await this.stopAllNodeProcesses();
    console.log('✅ Todos os servidores parados');
  }
}

// Execução se chamado diretamente
if (require.main === module) {
  const manager = new DevServerManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      manager.startAll().catch(console.error);
      break;
    case 'stop':
      manager.stopAll().catch(console.error);
      break;
    case 'restart':
      manager.stopAll()
        .then(() => new Promise(resolve => setTimeout(resolve, 2000)))
        .then(() => manager.startAll())
        .catch(console.error);
      break;
    default:
      console.log('Uso: node server-manager.js [start|stop|restart]');
  }
}

module.exports = DevServerManager;