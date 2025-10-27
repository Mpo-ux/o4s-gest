# Script Simples para Iniciar Frontend O4S gest
# Serve apenas o frontend na porta 3000

param(
    [Parameter()]
    [int]$Port = 3000
)

$ErrorActionPreference = "Continue"

function Write-StartupMessage {
    param($Message, $Type = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Type) {
        "INFO" { Write-Host "[$timestamp] [INFO] $Message" -ForegroundColor Cyan }
        "SUCCESS" { Write-Host "[$timestamp] [OK] $Message" -ForegroundColor Green }
        "ERROR" { Write-Host "[$timestamp] [ERROR] $Message" -ForegroundColor Red }
    }
}

Write-StartupMessage "Iniciando servidor frontend O4S gest..." "INFO"

# Verificar se a pasta dist existe
$distPath = "apps\web\dist"
if (-not (Test-Path $distPath)) {
    Write-StartupMessage "Pasta dist não encontrada. Fazendo build primeiro..." "INFO"
    npm run build:web
    if ($LASTEXITCODE -ne 0) {
        Write-StartupMessage "Erro ao fazer build. Saindo..." "ERROR"
        exit 1
    }
}

# Parar processos que possam estar usando a porta
Write-StartupMessage "Verificando porta $Port..." "INFO"
$process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($process) {
    Write-StartupMessage "Parando processo na porta $Port..." "INFO"
    Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Iniciar servidor HTTP simples
Write-StartupMessage "Iniciando servidor na porta $Port..." "INFO"
Set-Location $distPath

try {
    Write-StartupMessage "Servidor frontend disponível em: http://localhost:$Port" "SUCCESS"
    Write-StartupMessage "Pressiona Ctrl+C para parar o servidor" "INFO"
    Write-Host ""
    python -m http.server $Port
} catch {
    Write-StartupMessage "Erro ao iniciar servidor: $($_.Exception.Message)" "ERROR"
    Write-StartupMessage "Tentando com Node.js..." "INFO"
    npx http-server -p $Port -c-1 --cors
}

Write-StartupMessage "Servidor parado." "INFO"