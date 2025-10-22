param(
    [int]$Port = 3000,
    [int]$FallbackPort = 3001,
    [int]$MaxRetries = 3,
    [switch]$Force
)

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $colors = @{
        "INFO" = "Green"
        "WARNING" = "Yellow" 
        "ERROR" = "Red"
        "SUCCESS" = "Cyan"
    }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Level] $Message" -ForegroundColor $colors[$Level]
}

function Test-PortAvailable {
    param([int]$Port)
    try {
        # Usar netstat é mais rápido que Test-NetConnection
        $connections = netstat -an | Select-String ":$Port " | Where-Object { $_ -match "LISTENING" }
        return $connections.Count -eq 0
    } catch {
        return $true # Se falhar o teste, assumir que está disponível
    }
}

function Get-ProcessesUsingPort {
    param([int]$Port)
    
    try {
        $netstatOutput = netstat -ano | Where-Object { $_ -match ":$Port\s" }
        $processes = @()
        
        foreach ($line in $netstatOutput) {
            if ($line -match '\s+(\d+)\s*$') {
                $processId = [int]$matches[1]
                if ($processId -gt 0) {
                    try {
                        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        if ($process) {
                            $processes += [PSCustomObject]@{
                                PID = $processId
                                Name = $process.ProcessName
                                Path = $process.Path
                            }
                        }
                    } catch {
                        # Ignorar processos que já encerraram
                    }
                }
            }
        }
        
        return $processes | Sort-Object PID | Get-Unique -AsString
    } catch {
        Write-Log "Erro ao obter processos da porta $Port`: $($_.Exception.Message)" "ERROR"
        return @()
    }
}

function Stop-ProcessRobust {
    param(
        [PSCustomObject]$ProcessInfo,
        [switch]$Force
    )
    
    $processId = $ProcessInfo.PID
    $name = $ProcessInfo.Name
    
    Write-Log "Tentando encerrar $name (PID: $processId)..." "INFO"
    
    # Verificar se o processo ainda existe
    if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
        Write-Log "Processo $processId já encerrado" "SUCCESS"
        return $true
    }
    
    # Método 1: Stop-Process gracioso
    try {
        Stop-Process -Id $processId -ErrorAction Stop
        Start-Sleep -Milliseconds 500
        
        if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-Log "Processo $processId encerrado graciosamente" "SUCCESS"
            return $true
        }
    } catch {
        Write-Log "Stop-Process falhou para $processId" "WARNING"
    }
    
    # Método 2: Stop-Process com -Force
    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Start-Sleep -Milliseconds 1000
        
        if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-Log "Processo $processId encerrado com força" "SUCCESS"
            return $true
        }
    } catch {
        Write-Log "Stop-Process -Force falhou para $processId" "WARNING"
    }
    
    # Método 3: taskkill normal
    try {
        $result = taskkill /PID $processId 2>&1
        Start-Sleep -Milliseconds 1000
        
        if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-Log "Processo $processId encerrado com taskkill" "SUCCESS"
            return $true
        }
    } catch {
        Write-Log "taskkill normal falhou para $processId" "WARNING"
    }
    
    # Método 4: taskkill /F (força)
    try {
        $result = taskkill /F /PID $processId 2>&1
        Start-Sleep -Milliseconds 1500
        
        if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-Log "Processo $processId encerrado com taskkill /F" "SUCCESS"
            return $true
        }
    } catch {
        Write-Log "taskkill /F falhou para $processId" "WARNING"
    }
    
    # Se chegou aqui, o processo é resistente
    Write-Log "Processo $processId ($name) resistente - pode precisar de privilégios administrativos" "ERROR"
    
    # Se for processo do sistema (PID < 100), não tentar mais
    if ($processId -lt 100) {
        Write-Log "Processo $processId parece ser do sistema - ignorando" "WARNING"
        return $false
    }
    
    # Método 5: WMIC (se Force estiver ativo)
    if ($Force) {
        try {
            Write-Log "Tentando WMIC para processo $processId..." "WARNING"
            $result = wmic process where "ProcessId=$processId" delete 2>&1
            Start-Sleep -Milliseconds 2000
            
            if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
                Write-Log "Processo $processId encerrado com WMIC" "SUCCESS"
                return $true
            }
        } catch {
            Write-Log "WMIC falhou para $processId" "ERROR"
        }
    }
    
    return $false
}

function Clear-Port {
    param([int]$Port, [int]$Retries = 3)
    
    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        Write-Log "Tentativa $attempt de $Retries para libertar porta $Port" "INFO"
        
        if (Test-PortAvailable -Port $Port) {
            Write-Log "Porta $Port está livre!" "SUCCESS"
            return $true
        }
        
        $processes = Get-ProcessesUsingPort -Port $Port
        
        if ($processes.Count -eq 0) {
            Write-Log "Nenhum processo encontrado na porta $Port, mas ainda não está livre" "WARNING"
            Start-Sleep -Seconds 1
            continue
        }
        
        Write-Log "Encontrados $($processes.Count) processo(s) na porta $Port" "INFO"
        
        $allStopped = $true
        foreach ($proc in $processes) {
            $stopped = Stop-ProcessRobust -ProcessInfo $proc -Force:$Force
            if (-not $stopped) {
                $allStopped = $false
            }
        }
        
        # Aguardar estabilização
        Start-Sleep -Seconds 2
        
        if (Test-PortAvailable -Port $Port) {
            Write-Log "Porta $Port libertada com sucesso!" "SUCCESS"
            return $true
        }
        
        if (-not $allStopped -and $attempt -lt $Retries) {
            Write-Log "Alguns processos resistiram, tentando novamente..." "WARNING"
        }
    }
    
    return $false
}

# Início do script principal
Write-Log "=== Iniciando limpeza robusta de portas ===" "INFO"
Write-Log "Porta preferida: $Port | Fallback: $FallbackPort | Força: $Force" "INFO"

# Tentar libertar porta preferida
$portFreed = Clear-Port -Port $Port -Retries $MaxRetries

if ($portFreed) {
    Write-Log "Porta $Port disponível!" "SUCCESS"
    Write-Output "PORT=$Port"
    exit 0
}

Write-Log "Não foi possível libertar porta $Port, tentando fallback $FallbackPort" "WARNING"

# Tentar libertar porta fallback
$fallbackFreed = Clear-Port -Port $FallbackPort -Retries $MaxRetries

if ($fallbackFreed) {
    Write-Log "Porta fallback $FallbackPort disponível!" "SUCCESS"
    Write-Output "PORT=$FallbackPort"
    exit 0
}

Write-Log "FALHA: Não foi possível libertar nenhuma porta!" "ERROR"
Write-Log "Sugestões:" "INFO"
Write-Log "1. Execute como Administrador" "INFO"
Write-Log "2. Use -Force para métodos mais agressivos" "INFO"
Write-Log "3. Reinicie o computador" "INFO"
exit 1