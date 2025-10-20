import { exec } from 'node:child_process';
import { spawn } from 'node:child_process';

function run(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout, stderr });
    });
  });
}

async function killPort(port) {
  const isWin = process.platform === 'win32';
  try {
    if (isWin) {
      // Find PIDs listening/connected on the port
      const { stdout } = await run(`netstat -ano | findstr :${port}`);
      const pids = new Set(
        stdout
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => l.split(/\s+/).pop())
          .filter((pid) => /^(\d+)$/.test(pid))
      );
      for (const pid of pids) {
        try {
          await run(`taskkill /PID ${pid} /F`);
          console.log(`[dev-clean] Killed PID ${pid} on port ${port}`);
        } catch (e) {
          // ignore individual failures
        }
      }
    } else {
      // Try lsof first, then fuser
      try {
        const { stdout } = await run(`lsof -t -i :${port}`);
        const pids = new Set(stdout.split(/\r?\n/).filter(Boolean));
        for (const pid of pids) {
          await run(`kill -9 ${pid}`);
          console.log(`[dev-clean] Killed PID ${pid} on port ${port}`);
        }
      } catch {
        try {
          await run(`fuser -k ${port}/tcp`);
        } catch {}
      }
    }
  } catch {
    // No process found; nothing to kill
  }
}

async function main() {
  const port = Number(process.env.PORT || 5173);
  console.log(`[dev-clean] Ensuring port ${port} is free...`);
  await killPort(port);

  console.log(`[dev-clean] Starting Vite on http://localhost:${port} ...`);
  const cmd = `npm run dev -- --host localhost --port ${port} --strictPort`;
  const vite = spawn(cmd, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  vite.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[dev-clean] Failed to start:', err?.message || err);
  process.exit(1);
});
