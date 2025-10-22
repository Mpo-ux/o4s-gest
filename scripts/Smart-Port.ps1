param(
    [int]$PreferredPort = 3000,
    [int]$FallbackPort = 3001
)

function Test-PortInUse {
    param([int]$Port)
    
    $connections = netstat -ano | Select-String ":$Port "
    return $connections.Count -gt 0
}

function Try-FreePort {
    param([int]$Port)
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Tentando libertar porta $Port..." -ForegroundColor Green
    
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
                        # Processo pode ter terminado
                    }
                }
            }
        }

        if ($processes.Count -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Porta $Port já está livre" -ForegroundColor Green
            return $true
        }

        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Encontrados $($processes.Count) processo(s) usando a porta $Port" -ForegroundColor Cyan

        $allSuccess = $true
        foreach ($proc in $processes) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Tentando encerrar $($proc.ProcessName) (PID: $($proc.PID))" -ForegroundColor Yellow
            
            try {
                # Primeiro tentar Stop-Process
                Stop-Process -Id $proc.PID -Force -ErrorAction Stop
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Processo $($proc.PID) encerrado" -ForegroundColor Green
            } catch {
                try {
                    # Tentar taskkill
                    $null = taskkill /PID $proc.PID /F 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Processo $($proc.PID) encerrado com taskkill" -ForegroundColor Green
                    } else {
                        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [WARNING] Não foi possível encerrar processo $($proc.PID)" -ForegroundColor Yellow
                        $allSuccess = $false
                    }
                } catch {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [WARNING] Falha ao encerrar processo $($proc.PID)" -ForegroundColor Yellow
                    $allSuccess = $false
                }
            }
        }

        Start-Sleep -Milliseconds 1000

        # Verificar se a porta está livre
        if (-not (Test-PortInUse -Port $Port)) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Porta $Port libertada!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [WARNING] Porta $Port ainda está ocupada" -ForegroundColor Yellow
            return $false
        }

    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [ERROR] Erro ao libertar porta $Port`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Tentar libertar a porta preferida
$preferredPortFree = Try-FreePort -Port $PreferredPort

if ($preferredPortFree) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Porta $PreferredPort está disponível!" -ForegroundColor Green
    Write-Output "PORT=$PreferredPort"
    exit 0
} else {
    # Verificar se a porta de fallback está livre
    if (-not (Test-PortInUse -Port $FallbackPort)) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Usando porta alternativa $FallbackPort" -ForegroundColor Yellow
        Write-Output "PORT=$FallbackPort"
        exit 0
    } else {
        # Tentar libertar a porta de fallback
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Tentando libertar porta alternativa $FallbackPort" -ForegroundColor Yellow
        $fallbackPortFree = Try-FreePort -Port $FallbackPort
        
        if ($fallbackPortFree) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Porta alternativa $FallbackPort está disponível!" -ForegroundColor Green
            Write-Output "PORT=$FallbackPort"
            exit 0
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [ERROR] Não foi possível libertar nenhuma porta!" -ForegroundColor Red
            exit 1
        }
    }
}