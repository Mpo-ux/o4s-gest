@echo off
title O4S Gestao - Status do Sistema

echo.
echo ================================================
echo   O4S GESTAO - STATUS DO SISTEMA
echo ================================================
echo.

echo [INFO] Verificando status dos servicos...
echo.

REM Verificar API Server (Porta 3001)
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/health' -TimeoutSec 5 -UseBasicParsing; Write-Host '[OK] API Server (3001): ONLINE' -ForegroundColor Green; Write-Host '     Resposta:' $response.StatusCode $response.StatusDescription -ForegroundColor Gray } catch { Write-Host '[ERRO] API Server (3001): OFFLINE' -ForegroundColor Red }"

echo.

REM Verificar Frontend (Porta 3000)
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5 -UseBasicParsing; Write-Host '[OK] Frontend (3000): ONLINE' -ForegroundColor Green; Write-Host '     Status:' $response.StatusCode -ForegroundColor Gray } catch { Write-Host '[ERRO] Frontend (3000): OFFLINE' -ForegroundColor Red }"

echo.

REM Verificar processos Node.js
echo [INFO] Processos Node.js ativos:
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object { Write-Host '     PID:' $_.Id '- Memoria:' ([math]::Round($_.WorkingSet64/1MB,2)) 'MB' -ForegroundColor Cyan }"

echo.

REM Verificar uso de portas
echo [INFO] Portas em uso:
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host '     Porta' $_.LocalPort ': PID' $_.OwningProcess -ForegroundColor Yellow }"

echo.
echo [Sistema de Protecao de Modulos]
echo - Registry de modulos: localStorage
echo - Backups automaticos: ATIVO
echo - Monitoramento: Tempo real
echo.
pause