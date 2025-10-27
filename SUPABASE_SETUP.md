# 🚀 CONFIGURAÇÃO DO SUPABASE - O4S GESTÃO

## Passo 1: Criar Conta e Projeto

1. **Acesse https://supabase.com**
2. **Clique em "Start your project"**
3. **Faça login com GitHub ou email**
4. **Clique em "New Project"**
5. **Configure:**
   - Nome: `O4S Gestão`
   - Organização: Sua conta pessoal
   - Senha do banco: (anote com segurança!)
   - Região: `West EU (Ireland)` (mais próxima de Portugal)
6. **Aguarde a criação (2-3 minutos)**

## Passo 2: Configurar Variáveis de Ambiente

1. **No painel do Supabase, vá para Settings > API**
2. **Copie os valores:**
   - URL: `https://[seu-projeto].supabase.co`
   - anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Edite o arquivo `.env` na pasta `apps/web/`:**
```env
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Passo 3: Criar Tabelas no Banco de Dados

1. **No painel do Supabase, vá para "SQL Editor"**
2. **Execute este script SQL:**

```sql
-- =========================================
-- SCHEMA O4S GESTÃO - SUPABASE
-- =========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de usuários (extende auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela de sessões de usuários (para tracking online)
CREATE TABLE public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_online BOOLEAN DEFAULT true,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_online ON public.user_sessions(is_online);
CREATE INDEX idx_user_sessions_last_seen ON public.user_sessions(last_seen);

-- Tabela de clientes
CREATE TABLE public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  categoria TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =========================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can do anything with users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid());

-- Políticas para clientes (apenas usuários autenticados)
CREATE POLICY "Authenticated users can view clientes" ON public.clientes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage clientes" ON public.clientes
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para fornecedores (apenas usuários autenticados)
CREATE POLICY "Authenticated users can view fornecedores" ON public.fornecedores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage fornecedores" ON public.fornecedores
  FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- DADOS DE EXEMPLO
-- =========================================

-- Inserir usuários de exemplo (será criado automaticamente quando se registrarem)
-- Para criar um admin, você pode executar após o primeiro registro:
-- UPDATE public.users SET role = 'admin' WHERE email = 'seu-email@exemplo.com';

-- Inserir clientes de exemplo
INSERT INTO public.clientes (nome, email, telefone, empresa, status) VALUES
  ('João Silva', 'joao@empresa.com', '+351 91 234 5678', 'Silva & Associados', 'ativo'),
  ('Maria Santos', 'maria@tech.pt', '+351 92 345 6789', 'Tech Solutions', 'ativo'),
  ('António Costa', 'antonio@costa.pt', '+351 93 456 7890', 'Costa Construções', 'pendente');

-- Inserir fornecedores de exemplo
INSERT INTO public.fornecedores (nome, email, telefone, empresa, categoria, status) VALUES
  ('TechSupply', 'vendas@techsupply.pt', '+351 21 123 4567', 'TechSupply Lda', 'Tecnologia', 'ativo'),
  ('Materiais Porto', 'info@materiaisporto.pt', '+351 22 234 5678', 'Materiais do Porto', 'Construção', 'ativo'),
  ('Serviços Lisboa', 'contacto@servicoslisboa.pt', '+351 21 345 6789', 'Serviços de Lisboa', 'Serviços', 'inativo');
```

## Passo 4: Configurar Autenticação

1. **No painel do Supabase, vá para Authentication > Settings**
2. **Configure:**
   - Site URL: `http://localhost:3000`
   - Additional Redirect URLs: `http://localhost:3000`
3. **Habilite o provedor de Email:**
   - Marque "Enable email confirmations" como **desabilitado** (para desenvolvimento)

## Passo 5: Testar Conexão

1. **No VS Code, abra o terminal**
2. **Execute o projeto:**
```bash
cd "C:\Users\Sergio Lenovo Pc\Desktop\o4s gest\apps\web"
npm run dev
```

3. **Acesse http://localhost:3000**
4. **Na página de login, clique no botão de alternar modo (será adicionado)**
5. **Crie uma nova conta ou faça login**

## Passo 6: Configurar Primeiro Admin

Após criar sua primeira conta:

1. **No painel do Supabase, vá para "SQL Editor"**
2. **Execute este comando (substitua pelo seu email):**
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

## ✅ Próximos Passos

Após a configuração:
1. Testar login/logout com Supabase
2. Verificar widget Users Online com dados reais
3. Implementar Real-time subscriptions
4. Configurar backup automático

## 🔧 Troubleshooting

- **Erro de conexão:** Verifique as variáveis de ambiente no `.env`
- **Erro de permissão:** Verifique as políticas RLS no Supabase
- **Usuário não aparece online:** Verifique se executou o SQL de criação das tabelas