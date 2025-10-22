# Restore Instructions - O4S gest v2.1

Para restaurar esta versão estável robusta:

## 1. Restaurar Build Compilada
```powershell
cd "C:\Users\giora\o4s gest"
Remove-Item "apps\web\dist" -Recurse -Force -ErrorAction SilentlyContinue
xcopy "stable-versions\v2.1-robust-system\dist" "apps\web\dist" /E /I /Y
```

## 2. Restaurar Scripts PowerShell
```powershell
Remove-Item "scripts" -Recurse -Force -ErrorAction SilentlyContinue
xcopy "stable-versions\v2.1-robust-system\scripts" "scripts" /E /I /Y
```

## 3. Restaurar Componentes Chave
```powershell
xcopy "stable-versions\v2.1-robust-system\Navigation.tsx" "apps\web\src\components\" /Y
xcopy "stable-versions\v2.1-robust-system\DashboardPage.tsx" "apps\web\src\pages\" /Y
xcopy "stable-versions\v2.1-robust-system\DateCalculator.tsx" "apps\web\src\components\" /Y
xcopy "stable-versions\v2.1-robust-system\auth.ts" "apps\web\src\store\" /Y
```

## 4. Restaurar Configurações
```powershell
xcopy "stable-versions\v2.1-robust-system\vite.config.ts" "apps\web\" /Y
xcopy "stable-versions\v2.1-robust-system\index.html" "apps\web\" /Y
xcopy "stable-versions\v2.1-robust-system\package.json" "." /Y
```

## 5. Rebuild (se necessário)
```powershell
npm run build:web
```

## 6. Iniciar Sistema Completo
```powershell
# Opção 1: Sistema completo (Frontend + Backend)
npm run dev:full

# Opção 2: Apenas Frontend (se API já estiver rodando)
npm run dev:web

# Opção 3: Apenas Backend
npm run dev:api
```

## Scripts Disponíveis

### Gestão de Portas
- `npm run free-port`: Limpeza robusta padrão
- `npm run free-port-force`: Métodos agressivos (WMIC)

### Desenvolvimento
- `npm run dev:web`: Frontend com gestão automática de portas
- `npm run dev:api`: Backend na porta 5000
- `npm run dev:full`: Frontend + Backend simultaneamente

### Gestão de Servidores (Legacy)
- `npm run servers:start`: Iniciar servidores
- `npm run servers:stop`: Parar todos os processos Node.js
- `npm run servers:restart`: Restart completo
- `npm run servers:status`: Verificar estado

## Verificações de Integridade v2.1

### Interface
- ✅ Logo O4S + Hamburger menu alinhados à esquerda
- ✅ Sub-header azul com módulos (sem Calendário)
- ✅ Banner comedido no Dashboard
- ✅ Data da última sessão exibida
- ✅ Calendário integrado no Dashboard
- ✅ Título da aba: "O4S gest"

### Sistema
- ✅ Gestão robusta de portas 3000/3001
- ✅ Processo de login em ~2-3s (robusto)
- ✅ Backend conectado na porta 5000
- ✅ Health check funcional
- ✅ Scripts PowerShell operacionais
- ✅ Build sem erros

### Funcionalidades
- ✅ Autenticação JWT segura
- ✅ Tema escuro/claro funcional
- ✅ Calendário com navegação de meses
- ✅ Campos de data início/fim
- ✅ Cálculo automático de diferença de dias
- ✅ Módulos modulares (Calendário removido da nav)

## Troubleshooting

### Processo Zombie na Porta 3000
Se houver processo resistente (PID 4564 ou similar):
```powershell
# Executar como Administrador
npm run free-port-force
# ou
powershell -ExecutionPolicy Bypass -File scripts\Admin-Kill.ps1 -PIDs 4564
```

### Backend Não Conecta
```powershell
# Verificar se API está rodando
curl http://localhost:5000/health

# Iniciar manualmente se necessário
npm run dev:api
```

### Build Falha
```powershell
# Limpar cache e reconstruir
Remove-Item "apps\web\dist" -Recurse -Force -ErrorAction SilentlyContinue
npm run build:web
```

## Timestamp
Versão salva em: 22 de Outubro de 2025, 16:15 GMT