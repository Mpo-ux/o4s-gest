# Configuração OAuth Scopes - Google Drive Picker

## ✅ Resposta à tua pergunta principal:

**O `provider_token` é automático e individual para cada utilizador!**

- ❌ **NÃO precisas** adicionar utilizadores manualmente no Supabase
- ❌ **NÃO precisas** configurar tokens por utilizador
- ✅ **Cada pessoa que fizer login** recebe automaticamente o seu próprio `provider_token`
- ✅ **O token é renovado automaticamente** pelo Supabase quando expira

---

## 📋 Checklist de configuração (uma vez só)

### 1. **Supabase - Configurar OAuth Scopes**

Para o Google Picker funcionar, precisa dos scopes corretos:

1. Vai ao **Supabase Dashboard** > Authentication > Providers > Google
2. Na secção **"Scopes"**, adiciona:
   ```
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/drive.readonly
   ```
3. Clica **"Save"**

**Nota:** Todos os **novos** logins após esta alteração terão os scopes corretos. Utilizadores já autenticados terão de fazer logout/login novamente.

---

### 2. **Google Cloud Console - OAuth Consent Screen**

#### **Modo Testing** (recomendado para desenvolvimento):
- Status: "Testing"
- Só utilizadores que adicionares na lista "Test users" podem usar a app
- **Como adicionar utilizadores de teste:**
  1. Google Cloud Console > "APIs & Services" > "OAuth consent screen"
  2. Na secção "Test users", clica "+ ADD USERS"
  3. Adiciona os emails das pessoas que queres autorizar
  4. Clica "Save"

#### **Modo Production** (para app pública):
- Status: "In production"
- Qualquer pessoa com conta Google pode usar a app
- Requer verificação do Google (processo mais longo)

---

### 3. **Google Cloud Console - Authorized Redirect URIs**

Certifica-te que tens:
```
https://dedlakyhcycjqegmgojr.supabase.co/auth/v1/callback
http://localhost:5173
```

---

## 🔐 Como funciona para cada utilizador

### Fluxo automático:

1. **Utilizador A faz login** → Supabase dá-lhe um `provider_token` único
2. **Utilizador B faz login** → Supabase dá-lhe **outro** `provider_token` único
3. **Utilizador C faz login** → Supabase dá-lhe **outro** `provider_token` único

Cada token:
- ✅ Só funciona para o utilizador que fez login
- ✅ Só dá acesso aos **seus próprios** ficheiros/sheets do Drive
- ✅ Expira após 1 hora (renovado automaticamente)
- ✅ É revogado se o utilizador fizer logout

---

## 🧪 Como testar

### 1. **Testa com a tua conta:**
```bash
npm run dev
```
1. Faz login com a tua conta Google
2. Clica "Add Sheet" > "Browse Drive"
3. Verifica se o picker abre e mostra os teus spreadsheets

### 2. **Testa com outra conta:**
1. Adiciona outro email na lista "Test users" do Google Cloud Console
2. Faz logout da app
3. Faz login com a outra conta
4. Verifica se funciona igual

---

## ⚠️ Erros comuns

### "The OAuth client was not found"
- ❌ Client ID errado no `.env.local`
- ✅ Copia o Client ID da **lista** de credenciais, não da página de edição

### "Access blocked: This app's request is invalid"
- ❌ Scopes não configurados no Supabase
- ✅ Adiciona os scopes corretos e faz logout/login

### "Picker not ready or no access token"
- ❌ Utilizador não tem `provider_token` (fez login antes dos scopes)
- ✅ Faz logout e login novamente

### "Sign in to use this app"
- ❌ Email não está na lista de "Test users"
- ✅ Adiciona o email no Google Cloud Console

---

## 📝 Resumo

**Configuração inicial (uma vez):**
1. ✅ Adiciona scopes no Supabase: `spreadsheets` + `drive.readonly`
2. ✅ Configura OAuth Consent Screen (Testing ou Production)
3. ✅ Adiciona redirect URIs no Google Cloud Console

**Para cada novo utilizador (automático):**
- Nada! O Supabase dá automaticamente o `provider_token` quando faz login.
- Se está em modo "Testing", só precisas adicionar o email dele na lista "Test users".

---

## 🚀 Estado atual

✅ `.env.local` configurado com Client ID e API Key
✅ Google APIs incluídas no `index.html`
✅ Hook `useGooglePicker` implementado
✅ Botão "Browse Drive" adicionado ao formulário
✅ Theme toggle (dark/light) implementado

**Falta apenas:**
- [ ] Adicionar scopes no Supabase (se ainda não adicionaste)
- [ ] Testar login e picker

Boa sorte! 🎉
