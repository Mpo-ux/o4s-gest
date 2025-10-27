# 🧪 TESTE LOGIN SUPABASE - DEBUG

## 🔍 Problema Identificado
Erro 400 (Bad Request) ao tentar fazer login no modo Supabase.

## 🛠️ Melhorias Implementadas

### 1. **Debug Aprimorado**
- ✅ Logs detalhados no console do navegador
- ✅ Mensagens de erro específicas 
- ✅ Diferenciação entre tipos de erro (credenciais vs configuração)

### 2. **Tratamento de Erros**
```typescript
// Login com logs detalhados
console.log("🌐 Tentando login Supabase com:", { email, supabaseUrl });

if (error.message.includes("Invalid login credentials")) {
  throw new Error("Email ou password incorretos. Para testar use: admin@o4s.com / admin123");
} else if (error.message.includes("signup")) {
  throw new Error("Conta não existe. Verifique se a conta foi criada no Supabase.");
}
```

## 📋 Credenciais para Teste

### **IMPORTANTE**: Para o login Supabase funcionar, precisa de criar uma conta na consola do Supabase

### Opção 1: Criar Utilizador no Supabase Dashboard
1. Aceder a: https://supabase.com/dashboard/project/ckmzmhwqlfbimpbbwvjw
2. Ir para **Authentication** > **Users**
3. Clicar em **Add user**
4. Criar utilizador:
   - **Email**: `admin@o4s.com`
   - **Password**: `admin123`
   - **Email Confirm**: ✅ (confirmar)

### Opção 2: Usar SignUp no Frontend
1. Alternar para modo Supabase
2. Implementar função de registo (se ainda não existir)
3. Registar conta nova

### Opção 3: SQL Direct Insert
```sql
-- Executar na consola SQL do Supabase
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@o4s.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

## 🧪 Como Testar

1. **Abrir Consola do Navegador** (F12)
2. **Alternar para Modo Supabase** (via toggle)
3. **Tentar Login** com credenciais:
   - Email: `admin@o4s.com`
   - Password: `admin123`
4. **Verificar Logs** na consola:
   - `🌐 Tentando login Supabase com:` - Info de debug
   - `❌ Erro no login Supabase:` - Se houver erro
   - `✅ Login Supabase bem-sucedido:` - Se funcionar

## 🔧 Próximos Passos

Se ainda der erro após criar o utilizador:
1. Verificar se as tabelas `users` e `user_sessions` existem
2. Verificar as Row Level Security (RLS) policies
3. Verificar se o utilizador tem o role correto na tabela `users`

## 📞 Status
- ✅ Debug implementado
- ⏳ Aguardando criação de utilizador de teste no Supabase
- ⏳ Teste final do login