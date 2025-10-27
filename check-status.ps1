# Script para verificar estado da aplicação O4S gest

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

function Test-Port {
    param($Port, $Name)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-StatusMessage "$Name (porta $Port): [ONLINE]" "SUCCESS"
        return $true
    } catch {
        Write-StatusMessage "$Name (porta $Port): [OFFLINE]" "ERROR"
        return $false
    }
}

function Check-NodeProcesses {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-StatusMessage "Processos Node.js ativos: $($nodeProcesses.Count)" "INFO"
        $nodeProcesses | ForEach-Object {
            $memory = [math]::Round($_.WorkingSet / 1MB, 2)
            Write-StatusMessage "  PID: $($_.Id), Memória: ${memory}MB" "INFO"
        }
    } else {
        Write-StatusMessage "Nenhum processo Node.js ativo" "WARNING"
    }
}

function Check-PythonServer {
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "python" }
    if ($pythonProcesses) {
        Write-StatusMessage "Servidores Python ativos: $($pythonProcesses.Count)" "INFO"
        $pythonProcesses | ForEach-Object {
            Write-StatusMessage "  Python PID: $($_.Id)" "INFO"
        }
    }
}

Clear-Host
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "     O4S gest - Status do Sistema" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar serviços principais
Write-StatusMessage "Verificando serviços..." "INFO"
Write-Host ""

$frontendStatus = Test-Port -Port 3000 -Name "Frontend"
$apiStatus = Test-Port -Port 5000 -Name "API"

Write-Host ""
Check-NodeProcesses
Write-Host ""
Check-PythonServer

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Resumo:" -ForegroundColor Cyan
if ($frontendStatus) {
    Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: Offline" -ForegroundColor Red
    Write-Host "   Para iniciar: .\start-frontend.ps1" -ForegroundColor Yellow
}

if ($apiStatus) {
    Write-Host "✅ API: http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "❌ API: Offline" -ForegroundColor Red
    Write-Host "   Para iniciar: npm run servers:start" -ForegroundColor Yellow
}

Write-Host "=====================================" -ForegroundColor Cyan