@echo off
title O4S Gestao - Parar Sistema

echo.
echo ================================================
echo   O4S GESTAO - PARANDO SISTEMA
echo ================================================
echo.

echo [INFO] Parando processos do sistema...

REM Parar processos Node.js nas portas 3000 e 3001
powershell -NoProfile -ExecutionPolicy Bypass -Command "$processes = Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue } | Where-Object { $_.ProcessName -eq 'node' }; if ($processes) { $processes | ForEach-Object { Write-Host '[INFO] Parando processo:' $_.Name '(PID:' $_.Id ')' -ForegroundColor Yellow; Stop-Process -Id $_.Id -Force } } else { Write-Host '[INFO] Nenhum processo encontrado nas portas 3000/3001' -ForegroundColor Green }"

REM Parar outros processos relacionados
taskkill /F /IM "node.exe" /T >nul 2>&1
taskkill /F /IM "npm.exe" /T >nul 2>&1

echo.
echo [SUCESSO] Sistema O4S Gestao parado!
echo.
pause