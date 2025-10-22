# Business Management Application

Uma aplicação web full-stack para gestão empresarial com autenticação, CRUD operations, processamento de ficheiros e funcionalidades administrativas.

## 🚀 Características Principais

- **Frontend**: React + TypeScript + Vite com planeador de calendário
- **Backend**: Node.js + Express + TypeScript com autenticação JWT
- **Base de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: Sistema completo com roles (Admin/User)
- **Upload de Ficheiros**: Suporte para .pdf, .csv, .xlsx
- **Interface Responsiva**: Tailwind CSS + Shadcn/ui

## 📋 Módulos

### 🏠 Dashboard
- Planeador mensal com visualização de calendário
- Calculadora de dias entre datas
- Visão geral do sistema

### 📦 Gestão de Produtos
- Criar, editar, visualizar e eliminar produtos
- Import de dados via Excel/CSV
- Gestão de stock e categorias

### 👥 Gestão de Clientes
- CRUD completo para clientes
- Informações de contacto e dados fiscais
- Import/export de dados

### 🏢 Gestão de Fornecedores
- Gestão completa de fornecedores
- Dados de contacto e informações fiscais
- Controlo de estado ativo/inativo

### 🔄 Sistema RMA
- Criação e gestão de RMAs (Return Merchandise Authorization)
- Estados configuráveis (Pending, Approved, In Progress, etc.)
- Upload de Excel com múltiplas abas (nomes de 4 dígitos)
- Tracking completo de devoluções

### ⚙️ Painel Administrativo
- Gestão de utilizadores e permissões
- Import de planilhas de referência
- Detecção de duplicados na importação
- Configurações do sistema

## 🛠️ Tecnologias

### Frontend
- **React 18** - Library principal
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componentes UI
- **React Query** - State management e caching
- **React Hook Form** - Gestão de formulários
- **Zustand** - State management global
- **React Router** - Navegação

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **TypeScript** - Type safety
- **Prisma** - ORM e database migrations
- **JWT** - Autenticação
- **Multer** - Upload de ficheiros
- **Bcrypt** - Hash de passwords
- **Helmet** - Security headers
- **CORS** - Cross-origin requests

### Base de Dados
- **PostgreSQL** - Base de dados principal
- **Prisma Client** - Database access
- **PgAdmin** - Interface de administração

### DevOps
- **Docker** - Containerização da base de dados
- **npm Workspaces** - Monorepo management
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📁 Estrutura do Projeto

```
business-management-app/
├── apps/
│   ├── web/                 # Frontend React
│   │   ├── src/
│   │   │   ├── components/  # Componentes React
│   │   │   ├── pages/       # Páginas da aplicação
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── store/       # State management
│   │   │   └── lib/         # Utilities
│   │   └── package.json
│   └── api/                 # Backend Express
│       ├── src/
│       │   ├── controllers/ # Route controllers
│       │   ├── middleware/  # Express middleware
│       │   ├── routes/      # API routes
│       │   ├── services/    # Business logic
│       │   └── utils/       # Utilities
│       └── package.json
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── database/           # Prisma schema e migrations
│   └── utils/              # Shared utilities
├── docker-compose.yml      # PostgreSQL setup
├── package.json            # Root package.json
└── README.md
```

## 🚀 Setup de Desenvolvimento

### Pré-requisitos
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (para PostgreSQL)

### 1. Clonar e Instalar
```bash
git clone <repository-url>
cd business-management-app
npm install
```

### 2. Configurar Ambiente
```bash
# Copiar o ficheiro de exemplo
cp .env.example .env

# Editar as variáveis de ambiente
# DATABASE_URL, JWT_SECRET, etc.
```

### 3. Iniciar Base de Dados
```bash
# Iniciar PostgreSQL com Docker
npm run docker:up

# Aplicar schema e seed data
npm run db:migrate
npm run db:seed
```

### 4. Desenvolvimento
```bash
# Iniciar frontend e backend simultaneamente
npm run dev

# Ou separadamente:
npm run dev:web   # Frontend (http://localhost:3000)
npm run dev:api   # Backend (http://localhost:3001)
```

## 📊 Base de Dados

### Schema Principal
- **Users** - Utilizadores e autenticação
- **Products** - Catálogo de produtos
- **Clients** - Gestão de clientes
- **Suppliers** - Gestão de fornecedores
- **RMAs** - Sistema de devoluções
- **CalendarEvents** - Eventos do planeador

### Migrações
```bash
npm run db:migrate     # Aplicar migrações
npm run db:generate    # Gerar Prisma client
npm run db:studio      # Abrir interface visual
```

## 🔐 Autenticação

### Utilizadores Padrão
```
Admin: admin@business.com / admin123
User:  user@business.com / user123
```

### Roles e Permissões
- **ADMIN**: Acesso completo incluindo painel administrativo
- **USER**: Acesso a produtos, clientes, fornecedores e RMAs

## 📤 Upload de Ficheiros

### Formatos Suportados
- **PDF**: Documentos gerais
- **CSV**: Import de dados tabulares
- **Excel (.xlsx)**: 
  - Produtos, clientes, fornecedores
  - RMAs com múltiplas abas (nomes de 4 dígitos)
  - Detecção automática de duplicados

### Estrutura Excel para RMAs
```
Abas com nomes de 4 dígitos (ex: 0001, 0002, 0003)
Cada aba representa um RMA específico
Sistema intercala dados baseado no nome da aba
```

## 🌐 Deploy

### Desenvolvimento Local
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PgAdmin: http://localhost:8080

### Produção
O projeto está preparado para deploy em:
- **Vercel** (Frontend)
- **Railway/Heroku** (Backend + Database)
- **AWS/DigitalOcean** (VPS completo)

### Variáveis de Ambiente Produção
```bash
NODE_ENV=production
DATABASE_URL=<postgresql-production-url>
JWT_SECRET=<strong-secret-key>
ALLOWED_ORIGINS=<production-frontend-url>
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Frontend + Backend
npm run dev:web          # Apenas frontend
npm run dev:api          # Apenas backend

# Build
npm run build            # Build completo
npm run build:web        # Build frontend
npm run build:api        # Build backend

# Base de dados
npm run db:migrate       # Aplicar migrações
npm run db:generate      # Gerar Prisma client
npm run db:studio        # Interface visual
npm run db:seed          # Popular com dados exemplo

# Docker
npm run docker:up        # Iniciar PostgreSQL
npm run docker:down      # Parar PostgreSQL

# Quality
npm run type-check       # Verificar tipos TypeScript
npm run lint            # Linting código
```

## 🔧 Configuração Avançada

### Personalização de Roles
Editar `packages/types/src/index.ts` para adicionar novos roles.

### Novos Módulos
1. Criar tipos em `packages/types`
2. Adicionar schema Prisma em `packages/database`
3. Implementar API routes em `apps/api`
4. Criar componentes React em `apps/web`

### Processamento de Ficheiros
Customizar lógica em `apps/api/src/services/fileService.ts`

## 📝 Licença

Proprietary - Todos os direitos reservados

## 👥 Suporte

Para questões técnicas ou suporte, contactar o desenvolvedor.
