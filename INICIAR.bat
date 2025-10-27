@echo off
title O4S Gestao - Inicializar Sistema

echo.
echo ================================================
echo   O4S GESTAO - SISTEMA DE GESTAO EMPRESARIAL
echo ================================================
echo.

echo [INFO] Verificando status do sistema...

REM Verificar se as portas estao livres
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue) { Write-Host '[AVISO] Porta 3000 ocupada - tentando liberar...' -ForegroundColor Yellow; Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force -ErrorAction SilentlyContinue }"

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue) { Write-Host '[AVISO] Porta 3001 ocupada - tentando liberar...' -ForegroundColor Yellow; Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force -ErrorAction SilentlyContinue }"

echo.
echo [INFO] Iniciando API Server (Porta 3001)...
start "O4S API Server" cmd /k "cd /d scripts && node bulletproof-server.cjs"

timeout /t 3 /nobreak >nul

echo [INFO] Iniciando Frontend (Porta 3000)...
start "O4S Frontend" cmd /k "cd /d apps\web && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [SUCESSO] Sistema O4S Gestao iniciado!
echo.
echo - Frontend: http://localhost:3000
echo - API Server: http://localhost:3001
echo.
echo [Sistema de Protecao de Modulos ATIVO]
echo - DateCalculator protegido com backup automatico
echo - Registry centralizado de modulos
echo - Monitoramento de compatibilidade de tema
echo.
pause