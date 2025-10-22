param(
    [int]$Port = 3000
)

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Libertando porta $Port..." -ForegroundColor Green

try {
    # Encontrar processos usando a porta especificada
    $processes = netstat -ano | Select-String ":$Port " | ForEach-Object {
        $line = $_.Line.Trim()
        $parts = $line -split '\s+'
        if ($parts.Length -ge 5) {
            $processId = $parts[4]
            if ($processId -match '^\d+$') {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        [PSCustomObject]@{
                            PID = $processId
                            ProcessName = $process.ProcessName
                            Line = $line
                        }
                    }
                } catch {
                    # Processo pode ter terminado entre a consulta netstat e Get-Process
                }
            }
        }
    }

    if ($processes.Count -eq 0) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Porta $Port já está livre" -ForegroundColor Yellow
        exit 0
    }

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Encontrados $($processes.Count) processo(s) usando a porta $Port" -ForegroundColor Cyan

    foreach ($proc in $processes) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Encerrando processo $($proc.ProcessName) (PID: $($proc.PID))" -ForegroundColor Yellow
        
        try {
            # Tentar encerrar graciosamente primeiro
            Stop-Process -Id $proc.PID -Force -ErrorAction Stop
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Processo $($proc.PID) encerrado com sucesso" -ForegroundColor Green
        } catch {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [WARNING] Tentativa 1 falhou, tentando com taskkill..." -ForegroundColor Yellow
            try {
                # Tentar com taskkill se Stop-Process falhar
                $result = taskkill /PID $proc.PID /F 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Processo $($proc.PID) encerrado com taskkill" -ForegroundColor Green
                } else {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [ERROR] Não foi possível encerrar o processo $($proc.PID) com taskkill: $result" -ForegroundColor Red
                }
            } catch {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [ERROR] Falha total ao encerrar processo $($proc.PID): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }

    # Aguardar um momento para os processos terminarem
    Start-Sleep -Milliseconds 500

    # Verificar se a porta está agora livre
    $remainingProcesses = netstat -ano | Select-String ":$Port " 
    if ($remainingProcesses.Count -eq 0) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Porta $Port libertada com sucesso!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [WARNING] Alguns processos ainda estão a usar a porta $Port" -ForegroundColor Yellow
        exit 1
    }

} catch {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [ERROR] Erro ao libertar porta $Port`: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}