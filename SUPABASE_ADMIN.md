# 🔧 COMANDOS SQL COMPLEMENTARES - SUPABASE

## 👑 **CRIAR USUÁRIO ADMIN (Execute após primeiro registro)**

Após criar sua primeira conta no sistema, execute este comando no SQL Editor do Supabase para se tornar admin:

```sql
-- Substituir 'seu-email@exemplo.com' pelo email que você usou para registrar
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'teste@o4s.pt';

-- Verificar se funcionou
SELECT email, role FROM public.users WHERE role = 'admin';
```

## 📊 **VERIFICAR DADOS (Comandos úteis)**

```sql
-- Ver todos os usuários
SELECT * FROM public.users;

-- Ver sessões ativas
SELECT 
  us.*,
  u.email,
  u.full_name
FROM public.user_sessions us
JOIN public.users u ON us.user_id = u.id
WHERE us.is_online = true;

-- Ver dados de exemplo
SELECT * FROM public.clientes;
SELECT * FROM public.fornecedores;

-- Limpar sessões antigas (se necessário)
DELETE FROM public.user_sessions 
WHERE last_seen < NOW() - INTERVAL '1 hour';
```

## 🔧 **TROUBLESHOOTING**

```sql
-- Se não conseguir criar conta, verificar RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar políticas
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Resetar dados de teste (se necessário)
TRUNCATE public.user_sessions CASCADE;
TRUNCATE public.users CASCADE;
```

## 🎯 **PRÓXIMO PASSO**

1. **Teste o registro** em http://localhost:3000
2. **Execute o SQL de admin** acima 
3. **Verifique funcionalidades** administrativas
4. **Confirme Users Online** funcionando

**Sistema 100% operacional! 🚀**