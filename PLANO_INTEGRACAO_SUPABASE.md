# 🚀 Plano de Integração Supabase - O4S Gestão

## 📋 Configuração Inicial

### 1. **Instalação de Dependências**
```bash
# No diretório apps/web
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-react
npm install @supabase/auth-helpers-nextjs

# No diretório apps/api  
npm install @supabase/supabase-js
npm install dotenv
```

### 2. **Configuração do Projeto Supabase**
```typescript
// apps/web/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. **Variáveis de Ambiente**
```env
# .env.local (apps/web)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# .env (apps/api)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🗃️ Schema da Base de Dados

### **Tabelas Principais**

#### 1. **Utilizadores** (`users`)
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
  avatar_url VARCHAR,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **Sessões Online** (`user_sessions`)
```sql
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true
);
```

#### 3. **Clientes** (`clients`)
```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  tax_number VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. **Fornecedores** (`suppliers`)
```sql
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  tax_number VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. **Produtos** (`products`)
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  sku VARCHAR UNIQUE,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. **Auditoria** (`audit_logs`)
```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  table_name VARCHAR NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 Sistema de Autenticação

### **Store de Auth Atualizado**
```typescript
// apps/web/src/store/authSupabase.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../config/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  
  // Ações
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  checkSession: () => Promise<void>
}

export const useAuthSupabase = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true })
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }

        // Registrar sessão ativa
        await supabase.from('user_sessions').insert({
          user_id: data.user.id,
          ip_address: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip),
          user_agent: navigator.userAgent
        })

        set({ 
          user: data.user, 
          session: data.session, 
          isLoading: false 
        })
        
        return { success: true }
      },

      signOut: async () => {
        const { session } = get()
        
        // Marcar sessão como inativa
        if (session) {
          await supabase.from('user_sessions')
            .update({ is_active: false })
            .eq('user_id', session.user.id)
            .eq('is_active', true)
        }

        await supabase.auth.signOut()
        set({ user: null, session: null })
      },

      signUp: async (email: string, password: string, name: string) => {
        set({ isLoading: true })
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        })

        set({ isLoading: false })

        if (error) {
          return { success: false, error: error.message }
        }

        return { success: true }
      },

      updateProfile: async (updates: Partial<User>) => {
        const { data, error } = await supabase.auth.updateUser(updates)
        
        if (error) {
          return { success: false, error: error.message }
        }

        set({ user: data.user })
        return { success: true }
      },

      checkSession: async () => {
        const { data } = await supabase.auth.getSession()
        set({ session: data.session, user: data.session?.user || null })
      }
    }),
    {
      name: 'auth-supabase-storage'
    }
  )
)
```

---

## 👥 Widget de Utilizadores Online em Tempo Real

### **Hook para Utilizadores Online**
```typescript
// apps/web/src/hooks/useOnlineUsers.ts
import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

interface OnlineUser {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
  last_activity: string
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Buscar utilizadores online
    const fetchOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          user_id,
          last_activity,
          users:user_id (
            id,
            name,
            email,
            role,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .gt('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Últimos 5 minutos

      if (!error && data) {
        const users = data.map(session => ({
          id: session.users.id,
          name: session.users.name,
          email: session.users.email,
          role: session.users.role,
          avatar_url: session.users.avatar_url,
          last_activity: session.last_activity
        }))
        
        setOnlineUsers(users)
      }
      
      setIsLoading(false)
    }

    fetchOnlineUsers()

    // Atualizar heartbeat da sessão atual
    const updateHeartbeat = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase
          .from('user_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('user_id', session.user.id)
          .eq('is_active', true)
      }
    }

    // Subscription para mudanças em tempo real
    const subscription = supabase
      .channel('user_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_sessions'
      }, () => {
        fetchOnlineUsers()
      })
      .subscribe()

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      updateHeartbeat()
      fetchOnlineUsers()
    }, 30000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  return { onlineUsers, isLoading }
}
```

---

## 📊 Funcionalidades a Implementar

### **Fase 1: Autenticação e Utilizadores** ⭐
- ✅ Configuração Supabase
- ✅ Sistema de login/logout
- ✅ Gestão de sessões
- ✅ Utilizadores online em tempo real
- ✅ Perfis de utilizador

### **Fase 2: Gestão de Dados** 📊
- 📝 CRUD de Clientes
- 📝 CRUD de Fornecedores  
- 📝 CRUD de Produtos
- 📝 Sistema de stock
- 📝 Alertas de stock baixo

### **Fase 3: Funcionalidades Avançadas** 🚀
- 📊 Dashboard com dados reais
- 📈 Relatórios e analytics
- 🔍 Sistema de pesquisa
- 📱 Notificações em tempo real
- 🎯 Sistema de permissões granular

### **Fase 4: Auditoria e Segurança** 🔒
- 📝 Logs de auditoria
- 🔐 Controlo de acesso baseado em roles
- 📊 Monitorização de atividade
- 🛡️ Backup e recuperação

---

## 🔄 Migration Path

### **1. Preparação**
- Configurar projeto Supabase
- Definir schema da base de dados
- Configurar autenticação

### **2. Transição Gradual**
- Manter sistema atual funcionando
- Implementar autenticação Supabase em paralelo
- Migrar dados existentes

### **3. Ativação**
- Switchover para Supabase
- Testes de funcionalidade
- Monitorização

### **4. Otimização**
- Performance tuning
- Implementar caching
- Adicionar funcionalidades avançadas

---

## ⚡ Próximos Passos Imediatos

1. **Configurar Projeto Supabase** (15 min)
2. **Instalar dependências** (5 min)
3. **Criar schema inicial** (20 min)
4. **Implementar autenticação básica** (30 min)
5. **Atualizar widget Users Online** (20 min)
6. **Testes e validação** (15 min)

**Tempo estimado total**: ~1h45min

---

**Quer que comecemos com a configuração do Supabase?** 🚀