param(
    [int[]]$PIDs = @()
)

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Executando limpeza de processos como Administrador..." -ForegroundColor Green

if ($PIDs.Count -eq 0) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [ERROR] Nenhum PID fornecido!" -ForegroundColor Red
    exit 1
}

foreach ($ProcessId in $PIDs) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Tentando encerrar processo PID: $ProcessId" -ForegroundColor Yellow
    
    try {
        # Verificar se o processo existe
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if (-not $process) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Processo $ProcessId já não existe" -ForegroundColor Green
            continue
        }

        # Tentar taskkill com força
        $result = taskkill /F /PID $ProcessId 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [SUCCESS] Processo $ProcessId encerrado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [WARNING] Falha ao encerrar processo $ProcessId`: $result" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [ERROR] Erro ao processar PID $ProcessId`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [INFO] Limpeza de processos concluída" -ForegroundColor Green