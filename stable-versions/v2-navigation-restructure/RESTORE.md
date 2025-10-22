# Restore Instructions - O4S gest v2.0

Para restaurar esta versão estável:

## 1. Restaurar Build
```powershell
cd "C:\Users\giora\o4s gest"
Remove-Item "apps\web\dist" -Recurse -Force -ErrorAction SilentlyContinue
xcopy "stable-versions\v2-navigation-restructure\dist" "apps\web\dist" /E /I /Y
```

## 2. Restaurar Componente Principal
```powershell
xcopy "stable-versions\v2-navigation-restructure\Navigation.tsx" "apps\web\src\components\" /Y
```

## 3. Verificar package.json
Compare o package.json atual com o salvo nesta versão para confirmar dependências.

## 4. Rebuild (se necessário)
```powershell
npm run build:web
```

## 5. Iniciar Servidores
```powershell
npm run servers:start
```

## Verificações de Integridade
- ✅ Logo O4S + Hamburger menu alinhados à esquerda
- ✅ Sub-header azul com módulos em linha
- ✅ Controlos do utilizador alinhados à direita
- ✅ Dropdown do hamburger com todos os módulos
- ✅ Tema escuro/claro funcional
- ✅ Build sem erros

## Timestamp
Versão salva em: 22 de Outubro de 2025