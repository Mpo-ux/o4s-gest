// Script Node.js para integrar Robust-Port-Manager.ps1 ao start do backend
// Executa o PowerShell para garantir porta livre antes de iniciar o servidor

import { execSync } from 'child_process';
import path from 'path';

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const FALLBACK_PORT = process.env.FALLBACK_PORT ? parseInt(process.env.FALLBACK_PORT, 10) : 5001;
const MAX_RETRIES = 3;

const scriptPath = path.resolve(__dirname, '../../scripts/Robust-Port-Manager.ps1');

function getAvailablePort() {
  try {
    const cmd = `powershell -ExecutionPolicy Bypass -File \"${scriptPath}\" -Port ${DEFAULT_PORT} -FallbackPort ${FALLBACK_PORT} -MaxRetries ${MAX_RETRIES}`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const match = output.match(/PORT=(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    throw new Error('Nenhuma porta disponível detectada.\nSaída:\n' + output);
  } catch (err) {
    console.error('Erro ao executar Robust-Port-Manager:', err);
    process.exit(1);
  }
}

const port = getAvailablePort();
process.env.PORT = String(port);
console.log(`\n[INFO] Porta selecionada para o backend: ${port}\n`);

// Iniciar o servidor principal
require('./server');
