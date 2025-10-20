# Backend Local - Guia Rápido 🚀

## O que é isto?

Um backend **mock** completo que substitui o Supabase durante desenvolvimento:

- ✅ **Zero configuração** externa (sem OAuth, sem cloud)
- ✅ **Autenticação mock** - login instantâneo como "dev@localhost.com"
- ✅ **Base de dados JSON** local (server/db.json)
- ✅ **API REST** compatível com o código existente
- ✅ **Desenvolvimento offline**

## Como usar

### 1. Iniciar backend + frontend

```bash
npm run dev:local
```

Isto arranca:
- **API** em `http://localhost:3001` (backend)
- **Web** em `http://localhost:5173` (Vite)

### 2. Login

Clica no botão "Sign in with Google" - o login é **instantâneo**, sem redirect para Google.

### 3. Testar funcionalidades

- ✅ Adicionar sheets (sem acesso real ao Google - usa URLs mock)
- ✅ Sync data (cria dados fake)
- ✅ Pesquisar
- ✅ Ver detalhes

## Estrutura

```
server/
  ├── index.js        # Express API
  ├── db.json         # Base de dados (editável manualmente)
  └── package.json    # Deps do backend
```

## Alternar entre Local e Supabase

### Modo Local (atual)
`.env.local`:
```bash
VITE_USE_LOCAL_BACKEND=true
```

### Modo Supabase (produção)
`.env.local`:
```bash
VITE_USE_LOCAL_BACKEND=false
```

## Endpoints disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/auth/v1/token` | POST | Mock login |
| `/auth/v1/user` | GET | Get user info |
| `/rest/v1/sheets` | GET/POST/DELETE | Sheets CRUD |
| `/rest/v1/sheet_rows` | GET/POST | Rows CRUD |
| `/rest/v1/rpc/search_sheet_rows` | POST | Search |
| `/health` | GET | Health check |

## Vantagens

1. **Desenvolvimento rápido** - sem esperar OAuth
2. **Offline** - trabalha sem internet
3. **Debug fácil** - vê/edita `db.json` diretamente
4. **Zero custos** - sem limites de API
5. **Portável** - copia `db.json` entre devs

## Limitações

- ❌ Sem integração real com Google Sheets API
- ❌ Dados não persistem em cloud
- ❌ Auth não é segura (é mock)

**Usa isto para desenvolvimento, depois troca para Supabase real em produção!**
