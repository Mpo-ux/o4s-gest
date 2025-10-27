# =========================================
# CONFIGURAÇÃO DE PERMISSÕES POWERSHELL
# Execute como ADMINISTRADOR
# =========================================

# 1. Alterar ExecutionPolicy para permitir scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# 2. Para todo o sistema (opcional, mais permissivo)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force

# 3. Verificar configuração atual
Get-ExecutionPolicy -List

# 4. Para projetos específicos de desenvolvimento (mais seguro)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# =========================================
# CONFIGURAÇÕES ADICIONAIS RECOMENDADAS
# =========================================

# 5. Habilitar execução de scripts locais
Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser -Force

# 6. Configurar zona de segurança para desenvolvimento local
# (Para evitar warnings de "arquivos baixados da internet")
Unblock-File -Path "C:\Users\Sergio Lenovo Pc\Desktop\o4s gest\*.ps1" -Confirm:$false

# 7. Verificar status final
Write-Host "Configuração atual:" -ForegroundColor Green
Get-ExecutionPolicy -List

Write-Host "`n✅ Configurações aplicadas com sucesso!" -ForegroundColor Green
Write-Host "Agora você pode executar scripts sem prompts de permissão." -ForegroundColor Yellow