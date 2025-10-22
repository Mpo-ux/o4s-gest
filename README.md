# O4S gest v2.1 - Sistema de Gestão Empresarial Robusto

![O4S gest](https://img.shields.io/badge/O4S-gest-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.1-green?style=for-the-badge)
![Build](https://img.shields.io/badge/Build-Stable-success?style=for-the-badge)

Sistema de gestão empresarial moderno e robusto, desenvolvido com React + TypeScript + Node.js, com gestão avançada de portas e módulos modulares.

## 🚀 Características Principais

- **Frontend**: React 18.3.1 + TypeScript + Vite 5.4.21 com calendário modular
- **Backend**: Node.js v22.20.0 + Express 4.21.2 com autenticação JWT
- **Gestão Robusta**: Sistema de portas avançado com fallback automático (3000→3001)
- **Modularização**: Módulos independentes com DateCalculator integrado no Dashboard
- **Navegação Otimizada**: Sub-header com logo reposicionado e menu hambúrguer
- **Estado Persistente**: Zustand com rastreamento da última sessão
- **Interface Compacta**: Banner reduzido e design responsivo com Tailwind CSS
- **Scripts PowerShell**: Gestão ultra-robusta de servidores com múltiplas estratégias de terminação

## 📋 Módulos

### 🏠 Dashboard
- **DateCalculator Integrado**: Calendário modular completo com navegação mensal
- **Banner Compacto**: Design otimizado com data da última sessão
- **Rastreamento de Sessão**: Zustand store com persistência de lastSessionDate
- **Visão Geral**: Interface centralizada para todas as funcionalidades

### 👥 Gestão de Clientes
- CRUD completo para clientes
- Informações de contacto e dados fiscais
- Interface responsiva com navegação sub-header

### 🏢 Gestão de Fornecedores
- Gestão completa de fornecedores
- Dados de contacto e informações fiscais
- Controlo de estado ativo/inativo

### � Gestão de Produtos
- Criar, editar, visualizar e eliminar produtos
- Gestão de stock e categorias
- Interface modular e responsiva

### �🔄 Sistema RMA
- Criação e gestão de RMAs (Return Merchandise Authorization)
- Estados configuráveis e tracking completo
- Interface integrada no sistema modular

**Nota**: O módulo Calendário foi removido da navegação e integrado no Dashboard como DateCalculator para melhor modularização.

## 🛠️ Tecnologias

### Frontend
- **React 18.3.1** - Library principal com componentes modulares
- **TypeScript** - Type safety e desenvolvimento robusto
- **Vite 5.4.21** - Build tool ultra-rápido com HMR
- **Tailwind CSS** - Styling utilitário com design responsivo
- **Zustand** - State management com persistência de sessão
- **React Router** - Navegação com sub-header otimizado

### Backend
- **Node.js v22.20.0** - Runtime JavaScript moderna
- **Express 4.21.2** - Framework web minimalista
- **TypeScript** - Type safety no backend
- **JWT** - Autenticação stateless segura

### Gestão de Servidores
- **PowerShell Scripts** - Gestão ultra-robusta de processos
  - `Robust-Port-Manager.ps1` - 5 estratégias de terminação
  - `Admin-Kill.ps1` - Terminação administrativa
  - `Manage-Servers.ps1` - Gestão centralizada
  - `Free-Port.ps1` - Libertação de portas
  - `Smart-Port.ps1` - Gestão inteligente

### DevOps e Versionamento
- **Git 2.51.1** - Controlo de versão
- **GitHub** - Repositório remoto
- **npm Workspaces** - Gestão de monorepo
- **Stable Versions** - Backups v2.0 e v2.1 na pasta `stable-versions/`

## 📁 Estrutura do Projeto v2.1

```
o4s-gest/
├── src/
│   ├── components/
│   │   ├── common/          # Componentes comuns
│   │   ├── DateCalculator.tsx # Calendário modular (era módulo Calendário)
│   │   ├── Navigation.tsx   # Navegação com sub-header e logo reposicionado
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.tsx # Dashboard com DateCalculator integrado
│   │   ├── ClientsPage.tsx  # Gestão de clientes
│   │   ├── SuppliersPage.tsx # Gestão de fornecedores
│   │   ├── ProductsPage.tsx # Gestão de produtos
│   │   ├── RMAPage.tsx      # Sistema RMA
│   │   └── LoginPage.tsx    # Autenticação (branding O4S gest)
│   ├── store/
│   │   └── auth.ts          # Zustand store com lastSessionDate
│   └── ...
├── server/
│   ├── src/
│   │   ├── controllers/     # Controladores API
│   │   ├── middleware/      # Middleware Express
│   │   └── routes/          # Rotas API
│   └── server.js            # Servidor Express 4.21.2
├── scripts/                 # Scripts PowerShell robustos
│   ├── Robust-Port-Manager.ps1 # Gestão ultra-robusta de portas
│   ├── Admin-Kill.ps1       # Terminação administrativa
│   ├── Manage-Servers.ps1   # Gestão centralizada
│   ├── Free-Port.ps1        # Libertação de portas
│   └── Smart-Port.ps1       # Gestão inteligente
├── stable-versions/         # Versões estáveis de backup
│   ├── v2.0-stable/         # Backup completo v2.0
│   └── v2.1-stable/         # Backup completo v2.1
├── vite.config.ts           # Configuração Vite com port 3000 e strictPort: false
├── package.json             # Scripts robustos e dependências
└── README.md               # Esta documentação
```

## 🚀 Setup e Instalação

### Pré-requisitos
- **Node.js v22.20.0** ou superior
- **npm** para gestão de dependências
- **Git 2.51.1** (incluído no projeto)
- **PowerShell 5.1+** (Windows) para scripts robustos

### 1. Clonar Repositório
```bash
git clone https://github.com/Mpo-ux/o4s-gest.git
cd o4s-gest
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Desenvolvimento Local
```bash
# Método preferido - usa gestão robusta de portas
npm run dev:robust

# Alternativo - desenvolvimento padrão
npm run dev

# Frontend apenas (porta 3000 com fallback 3001)
npm run dev:frontend

# Backend apenas
npm run dev:backend
```

### 4. Gestão de Servidores (PowerShell)
```powershell
# Gestão centralizada de todos os servidores
.\scripts\Manage-Servers.ps1

# Terminação robusta de processos em portas específicas
.\scripts\Robust-Port-Manager.ps1

# Libertação inteligente de portas
.\scripts\Smart-Port.ps1

# Terminação administrativa (requer elevação)
.\scripts\Admin-Kill.ps1
```

## ⚙️ Configuração Avançada

### Gestão de Portas
O sistema utiliza gestão inteligente de portas:
- **Porta Principal**: 3000
- **Porta Fallback**: 3001
- **Configuração**: `vite.config.ts` com `strictPort: false`
- **Scripts PowerShell**: 5 métodos de terminação robusta

### Modularização
- **DateCalculator**: Componente modular integrado no Dashboard
- **Navigation**: Sub-header otimizado com logo e menu hambúrguer reposicionados
- **Módulos Independentes**: Cada módulo estruturado separadamente da base

### Estado da Aplicação
- **Zustand Store**: Gestão de estado com persistência
- **lastSessionDate**: Rastreamento automático da última sessão
- **Banner Compacto**: Design otimizado com informações de sessão

## � Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Desenvolvimento padrão
npm run dev:robust       # Desenvolvimento com gestão robusta de portas
npm run dev:frontend     # Frontend apenas (Vite + React)
npm run dev:backend      # Backend apenas (Express + Node.js)
```

### Build e Produção
```bash
npm run build            # Build completo (Frontend + Backend)
npm run preview          # Preview da build de produção
npm run type-check       # Verificação de tipos TypeScript
```

### Gestão de Servidores (PowerShell)
```powershell
# Scripts robustos para Windows
.\scripts\Robust-Port-Manager.ps1  # Gestão ultra-robusta (5 métodos)
.\scripts\Manage-Servers.ps1       # Gestão centralizada
.\scripts\Smart-Port.ps1           # Gestão inteligente de portas
.\scripts\Free-Port.ps1            # Libertação específica de portas
.\scripts\Admin-Kill.ps1           # Terminação administrativa
```

### Versionamento e Backup
```bash
git add .                    # Staging de alterações
git commit -m "Descrição"    # Commit local
git push origin main         # Upload para GitHub

# Restaurar versões estáveis
cp -r stable-versions/v2.1-stable/* .  # Restaurar v2.1
cp -r stable-versions/v2.0-stable/* .  # Restaurar v2.0
```

## 🌐 URLs e Acessos

### Desenvolvimento Local
- **Frontend**: http://localhost:3000 (fallback: 3001)
- **Backend API**: http://localhost:3001/api
- **Build Preview**: Após `npm run build && npm run preview`

### Funcionalidades Principais
- **Dashboard**: / (com DateCalculator integrado)
- **Clientes**: /clients
- **Fornecedores**: /suppliers  
- **Produtos**: /products
- **RMAs**: /rmas
- **Login**: /login (branding O4S gest)

## 🔄 Versões Estáveis

### v2.1 (Atual) - Ultra-Robusta
- ✅ Gestão robusta de servidores com PowerShell
- ✅ Modularização completa (DateCalculator no Dashboard)
- ✅ Navegação otimizada com sub-header e logo reposicionado
- ✅ Banner compacto com rastreamento de última sessão
- ✅ Sistema de portas avançado (3000→3001 fallback)
- ✅ Branding completo "O4S gest"

### v2.0 - Modular
- ✅ Base modular implementada
- ✅ Navegação restructurada
- ✅ Componentes independentes
- ✅ Backup disponível em `stable-versions/v2.0-stable/`

### Restauração de Versões
```bash
# Para restaurar v2.1 estável
cp -r stable-versions/v2.1-stable/* .
npm install
npm run dev:robust

# Para restaurar v2.0
cp -r stable-versions/v2.0-stable/* .
npm install  
npm run dev
```

## � Troubleshooting

### Problemas Comuns

#### Porta 3000 Ocupada
```powershell
# Solução automática - usa script robusto
.\scripts\Robust-Port-Manager.ps1

# Solução manual
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Processos Node.js Zombie
```powershell
# Terminação ultra-robusta (5 métodos)
.\scripts\Admin-Kill.ps1

# Gestão centralizada
.\scripts\Manage-Servers.ps1
```

#### Fallback de Portas
- Sistema automaticamente tenta porta 3001 se 3000 estiver ocupada
- Configurado em `vite.config.ts` com `strictPort: false`
- Scripts PowerShell garantem libertação robusta

#### Restauração de Versão Estável
```bash
# Se algo correr mal, restaurar última versão estável
cp -r stable-versions/v2.1-stable/* .
npm install
npm run dev:robust
```

### Logs e Debugging
- Frontend: Console do navegador (F12)
- Backend: Terminal com logs Express
- Scripts PowerShell: Logs detalhados com timestamps
- Vite: Logs de build e HMR em tempo real

## 📈 Performance

### Build Otimizada
- **JavaScript**: 567.66 kB (otimizado)
- **CSS**: 42.40 kB (Tailwind CSS purged)
- **Chunks**: Code splitting automático
- **HMR**: Hot Module Replacement ultra-rápido

### Scripts Robustos
- **5 Métodos de Terminação**: Stop-Process, taskkill, WMIC, Get-Process, Admin elevation
- **Retry Logic**: Múltiplas tentativas com intervalos
- **Logging Detalhado**: Timestamps e status de cada operação
- **Fallback Automático**: Porta 3000→3001 sem intervenção manual

## 🔗 Links Úteis

- **Repositório GitHub**: https://github.com/Mpo-ux/o4s-gest
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **TypeScript**: https://www.typescriptlang.org/

## � Licença e Suporte

**Licença**: Proprietary - Todos os direitos reservados O4S Development

**Suporte Técnico**: Para questões técnicas ou suporte, contactar a equipa de desenvolvimento.

**Versão**: v2.1 - Sistema Ultra-Robusto com Modularização Completa

**Última Atualização**: GitHub Repository - Substituição completa com 82 ficheiros e 16,354 inserções

---

*Desenvolvido com ❤️ pela equipa O4S Development*
