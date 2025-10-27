# Script de Restore Automático - O4S gest v2.1
# Restaura para versão estável que funcionava

param(
    [switch]$Force
)

$ErrorActionPreference = "Continue"

function Write-RestoreMessage {
    param($Message, $Type = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Type) {
        "INFO" { Write-Host "[$timestamp] [RESTORE] $Message" -ForegroundColor Cyan }
        "SUCCESS" { Write-Host "[$timestamp] [OK] $Message" -ForegroundColor Green }
        "ERROR" { Write-Host "[$timestamp] [ERROR] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[$timestamp] [WARN] $Message" -ForegroundColor Yellow }
    }
}

Write-RestoreMessage "Iniciando restore para versão estável v2.1..." "INFO"

# Parar todos os processos primeiro
Write-RestoreMessage "Parando processos Node.js..." "INFO"
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 1. Restaurar Scripts PowerShell
Write-RestoreMessage "Restaurando scripts PowerShell..." "INFO"
if (Test-Path "scripts") {
    Remove-Item "scripts" -Recurse -Force -ErrorAction SilentlyContinue
}
xcopy "stable-versions\v2.1-robust-system\scripts" "scripts" /E /I /Y | Out-Null

# 2. Restaurar Componentes Chave
Write-RestoreMessage "Restaurando componentes principais..." "INFO"
xcopy "stable-versions\v2.1-robust-system\Navigation.tsx" "apps\web\src\components\" /Y | Out-Null
xcopy "stable-versions\v2.1-robust-system\DashboardPage.tsx" "apps\web\src\pages\" /Y | Out-Null
xcopy "stable-versions\v2.1-robust-system\DateCalculator.tsx" "apps\web\src\components\" /Y | Out-Null
xcopy "stable-versions\v2.1-robust-system\auth.ts" "apps\web\src\store\" /Y | Out-Null

# 3. Restaurar Configurações
Write-RestoreMessage "Restaurando configurações..." "INFO"
xcopy "stable-versions\v2.1-robust-system\vite.config.ts" "apps\web\" /Y | Out-Null
xcopy "stable-versions\v2.1-robust-system\index.html" "apps\web\" /Y | Out-Null

# 4. Rebuild Web
Write-RestoreMessage "Fazendo rebuild do frontend..." "INFO"
npm run build:web

if ($LASTEXITCODE -eq 0) {
    Write-RestoreMessage "Restore concluído com sucesso!" "SUCCESS"
    Write-RestoreMessage "Para iniciar: npm run dev" "INFO"
} else {
    Write-RestoreMessage "Erro durante rebuild. Tentando iniciar mesmo assim..." "WARNING"
}

Write-RestoreMessage "Restore finalizado. Sistema restaurado para v2.1 estável." "SUCCESS"