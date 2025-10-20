# O4S gest

Google Sheets Manager - Uma aplicação web para gestão e visualização de planilhas Google Sheets.

## 🚀 Funcionalidades

- Autenticação com Google OAuth
- Visualização de planilhas do Google Sheets
- Busca em múltiplas planilhas
- Interface responsiva com Tailwind CSS
- Gerenciamento de estado com React Context

## 🛠️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrações SQL encontradas na pasta `supabase/migrations/`
3. Configure a autenticação Google OAuth no Supabase
4. Adicione as URLs de callback apropriadas

### 3. Configuração do Google OAuth

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Ative as APIs do Google Sheets e Google Drive
3. Configure as credenciais OAuth 2.0
4. Adicione os escopos necessários:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.readonly`

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Verificar tipos TypeScript
npm run typecheck

# Executar linting
npm run lint

# Executar testes
npm run test
```

## 🔧 Comandos Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Faz o build da aplicação
- `npm run preview` - Visualiza o build de produção
- `npm run typecheck` - Verifica tipos TypeScript
- `npm run lint` - Executa o ESLint
- `npm run test` - Executa os testes com Vitest

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── LoginPage.tsx   # Página de login
│   ├── SheetManager.tsx # Gerenciador de planilhas
│   ├── SheetViewer.tsx # Visualizador de planilhas
│   └── SearchPanel.tsx # Painel de busca
├── contexts/           # Contextos React
│   └── AuthContext.tsx # Contexto de autenticação
├── lib/               # Utilitários e configurações
│   ├── googleSheets.ts # Funções para Google Sheets API
│   └── supabase.ts    # Cliente e tipos do Supabase
├── App.tsx            # Componente principal
└── main.tsx          # Ponto de entrada
```

## 🐛 Correções Realizadas

✅ Corrigidos imports não utilizados  
✅ Corrigidos erros de tipos TypeScript  
✅ Reinstaladas dependências e corrigido ESLint  
✅ Atualizadas dependências com vulnerabilidades de segurança  
✅ Criado arquivo de exemplo de variáveis de ambiente  
✅ Melhorados tipos TypeScript (reduzido uso de `any`)  

## 🔒 Segurança

- Todas as vulnerabilidades de segurança foram corrigidas
- Dependências atualizadas para versões mais recentes
- Variáveis de ambiente configuradas corretamente

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.