# Script PowerShell para gestão de servidores O4S gest
# Controla processos Node.js de forma robusta

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action
)

$ErrorActionPreference = "Continue"

function Write-StatusMessage {
    param($Message, $Type = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Type) {
        "INFO" { Write-Host "[$timestamp] [INFO] $Message" -ForegroundColor Cyan }
        "SUCCESS" { Write-Host "[$timestamp] [OK] $Message" -ForegroundColor Green }
        "ERROR" { Write-Host "[$timestamp] [ERROR] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[$timestamp] [WARN] $Message" -ForegroundColor Yellow }
    }
}

function Stop-AllNodeProcesses {
    Write-StatusMessage "Parando todos os processos Node.js..." "INFO"
    
    try {
        $nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
        
        if ($nodeProcesses) {
            Write-StatusMessage "Encontrados $($nodeProcesses.Count) processos Node.js" "INFO"
            $nodeProcesses | ForEach-Object {
                Write-StatusMessage "Parando processo Node.js (PID: $($_.Id))" "INFO"
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 2
            Write-StatusMessage "Processos Node.js encerrados" "SUCCESS"
        } else {
            Write-StatusMessage "Nenhum processo Node.js encontrado" "INFO"
        }
    } catch {
        Write-StatusMessage "Erro ao parar processos: $($_.Exception.Message)" "ERROR"
    }
}

function Test-ServerPort {
    param($Port, $Name)
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-StatusMessage "$Name servidor respondendo na porta $Port" "SUCCESS"
        return $true
    } catch {
        Write-StatusMessage "$Name servidor não responde na porta $Port" "WARNING"
        return $false
    }
}

function Start-ApiServer {
    Write-StatusMessage "Iniciando servidor API..." "INFO"
    
    $apiPath = Get-Location
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev:api" -WorkingDirectory $apiPath -WindowStyle Hidden -PassThru
    
    # Aguarda o servidor iniciar
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep -Seconds 2
        if (Test-ServerPort -Port 5000 -Name "API") {
            Write-StatusMessage "Servidor API iniciado com sucesso (tentativa $i)" "SUCCESS"
            return $process
        }
        Write-StatusMessage "Aguardando servidor API (tentativa $i/15)..." "INFO"
    }
    
    Write-StatusMessage "Timeout ao iniciar servidor API" "ERROR"
    return $null
}

function Start-WebServer {
    Write-StatusMessage "Iniciando servidor Web..." "INFO"
    
    $webPath = Get-Location
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev:web" -WorkingDirectory $webPath -WindowStyle Hidden -PassThru
    
    # Aguarda o servidor iniciar
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep -Seconds 2
        if (Test-ServerPort -Port 3000 -Name "Web") {
            Write-StatusMessage "Servidor Web iniciado com sucesso (tentativa $i)" "SUCCESS"
            return $process
        }
        Write-StatusMessage "Aguardando servidor Web (tentativa $i/15)..." "INFO"
    }
    
    Write-StatusMessage "Timeout ao iniciar servidor Web" "ERROR"
    return $null
}

function Get-ServerStatus {
    Write-StatusMessage "Verificando status dos servidores..." "INFO"
    
    $apiStatus = Test-ServerPort -Port 5000 -Name "API"
    $webStatus = Test-ServerPort -Port 3000 -Name "Web"
    
    $nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
    Write-StatusMessage "Processos Node.js ativos: $($nodeProcesses.Count)" "INFO"
    
    if ($nodeProcesses) {
        $nodeProcesses | ForEach-Object {
            $memory = [math]::Round($_.WorkingSet / 1MB, 2)
            Write-StatusMessage "  PID: $($_.Id), Memória: ${memory}MB, Início: $($_.StartTime)" "INFO"
        }
    }
    
    return @{
        API = $apiStatus
        Web = $webStatus
        NodeProcesses = $nodeProcesses.Count
    }
}

# Execução baseada no parâmetro
switch ($Action) {
    "stop" {
        Write-StatusMessage "Parando servidores O4S gest..." "INFO"
        Stop-AllNodeProcesses
        Write-StatusMessage "Servidores parados" "SUCCESS"
    }
    
    "start" {
        Write-StatusMessage "Iniciando servidores O4S gest..." "INFO"
        
        # Para processos existentes primeiro
        Stop-AllNodeProcesses
        Start-Sleep -Seconds 3
        
        # Inicia API primeiro
        $apiProcess = Start-ApiServer
        if (-not $apiProcess) {
            Write-StatusMessage "Falha ao iniciar servidor API" "ERROR"
            exit 1
        }
        
        Start-Sleep -Seconds 2
        
        # Inicia Web
        $webProcess = Start-WebServer
        if (-not $webProcess) {
            Write-StatusMessage "Falha ao iniciar servidor Web" "ERROR"
            exit 1
        }
        
        Write-StatusMessage "Todos os servidores iniciados com sucesso!" "SUCCESS"
    }
    
    "restart" {
        Write-StatusMessage "Reiniciando servidores O4S gest..." "INFO"
        
        # Para tudo
        Stop-AllNodeProcesses
        Start-Sleep -Seconds 5
        
        # Inicia tudo novamente
        & $PSCommandPath -Action "start"
    }
    
    "status" {
        $status = Get-ServerStatus
        
        Write-Host "`nStatus dos Servidores O4S gest:" -ForegroundColor Cyan
        Write-Host "=================================" -ForegroundColor Cyan
        Write-Host "API (porta 5000): " -NoNewline
        if ($status.API) { 
            Write-Host "[OK] Online" -ForegroundColor Green 
        } else { 
            Write-Host "[ERROR] Offline" -ForegroundColor Red 
        }
        
        Write-Host "Web (porta 3000): " -NoNewline
        if ($status.Web) { 
            Write-Host "[OK] Online" -ForegroundColor Green 
        } else { 
            Write-Host "[ERROR] Offline" -ForegroundColor Red 
        }
        
        Write-Host "Processos Node.js: $($status.NodeProcesses)" -ForegroundColor Yellow
        Write-Host ""
    }
}