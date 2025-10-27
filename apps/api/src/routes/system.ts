import { Router } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import logger from "../utils/logger.js";

const router = Router();

// Middleware de cache para GETs públicos
router.use((req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", "private, max-age=60, stale-while-revalidate=10");
  }
  next();
});
const execAsync = promisify(exec);

// Endpoint para encerrar processos Node conflituosos
router.post("/kill-node-processes", async (_req, res) => {
  try {
    logger.info("🔄 [SYSTEM] Solicitação para encerrar processos Node.js...");

    // Script PowerShell para encerrar processos Node.js específicos
    const script = `
      $currentPID = $PID
      Write-Host "PID atual: $currentPID"
      
      # Encontrar processos Node.js
      $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $currentPID }
      
      if ($nodeProcesses) {
        Write-Host "Encontrados $($nodeProcesses.Count) processos Node.js para encerrar"
        foreach ($process in $nodeProcesses) {
          try {
            Write-Host "Encerrando processo $($process.Id) - $($process.ProcessName)"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
          } catch {
            Write-Host "Erro ao encerrar processo $($process.Id): $_"
          }
        }
        Write-Host "Processos encerrados com sucesso"
      } else {
        Write-Host "Nenhum processo Node.js conflituoso encontrado"
      }
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${script}"`
    );

    logger.info("✅ [SYSTEM] Processos Node.js geridos:", stdout);
    if (stderr) logger.warn("⚠️ [SYSTEM] Avisos:", stderr);

    res.json({
      success: true,
      message: "Processos Node.js geridos com sucesso",
      output: stdout,
    });
  } catch (error) {
    logger.error("❌ [SYSTEM] Erro ao gerir processos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerir processos Node.js",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Endpoint para verificar portas disponíveis
router.get("/check-ports", async (_req, res) => {
  try {
    const ports = [3000, 3001, 3002, 5000];
    const portStatus: Record<number, { inUse: boolean; details: string[] }> =
      {};

    for (const port of ports) {
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        portStatus[port] = {
          inUse: stdout.trim().length > 0,
          details: stdout
            .trim()
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line),
        };
      } catch (error) {
        // Se não encontrar nada no netstat, a porta está livre
        portStatus[port] = { inUse: false, details: [] };
      }
    }

    res.json({
      success: true,
      ports: portStatus,
    });
  } catch (error) {
    console.error("❌ [SYSTEM] Erro ao verificar portas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao verificar portas",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Endpoint para libertar porta específica
router.post("/free-port/:port", async (req, res) => {
  try {
    const port = parseInt(req.params.port);

    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: "Porta inválida",
      });
    }

    console.log(`🔄 [SYSTEM] Libertando porta ${port}...`);

    // Encontrar e encerrar processos que usam a porta
    const script = `
      $port = ${port}
      $connections = netstat -ano | Select-String ":$port "
      
      foreach ($line in $connections) {
        if ($line -match '\\s+(\\d+)\\s*$') {
          $processId = [int]$matches[1]
          if ($processId -gt 0) {
            try {
              $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
              if ($process) {
                Write-Host "Encerrando processo $processId ($($process.ProcessName)) que usa porta $port"
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
              }
            } catch {
              Write-Host "Erro ao encerrar processo $processId: $_"
            }
          }
        }
      }
      Write-Host "Porta $port libertada"
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${script}"`
    );

    console.log(`✅ [SYSTEM] Porta ${port} libertada:`, stdout);
    if (stderr) console.warn("⚠️ [SYSTEM] Avisos:", stderr);

    res.json({
      success: true,
      message: `Porta ${port} libertada com sucesso`,
      output: stdout,
    });
  } catch (error) {
    console.error("❌ [SYSTEM] Erro ao libertar porta:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao libertar porta",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

export default router;
