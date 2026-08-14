# Agent IT — Dashboard

Painel interno para acompanhar as acoes do Agent IT (restart de apps, diagnosticos,
acoes admin, feedback dos usuarios), com login restrito a contas Microsoft da JEM Systems.

## Arquitetura de seguranca (resumo)

1. Login obrigatorio via Microsoft (Azure AD / Entra ID), restrito ao tenant da empresa.
2. O navegador NUNCA fala com o Supabase diretamente - toda consulta passa pelas
   API routes desta aplicacao (`app/api/events`, `app/api/filters`, `app/api/stats`),
   que rodam no servidor da Vercel.
3. A Service Role Key do Supabase fica APENAS nas variaveis de ambiente do servidor
   (nunca `NEXT_PUBLIC_*`, nunca no codigo, nunca no navegador).
4. A tabela `agent_events` no Supabase tem Row Level Security ativado sem nenhuma
   policy publica - ninguem le nada sem passar por aqui.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local
# preencha .env.local com os valores reais (ver secao "Variaveis de ambiente")
npm run dev
```

Abra http://localhost:3000

## Variaveis de ambiente

Ver `.env.local.example` para a lista completa com instrucoes de onde encontrar
cada valor (Supabase Dashboard, Azure Portal).

**Nunca** commite o arquivo `.env.local` - ele ja esta no `.gitignore`.

## Deploy no Vercel

### 1. Subir este codigo para um repositorio GitHub (separado dos repositorios
   do Agent IT - esta e a dashboard, um projeto diferente)

```bash
git init
git add .
git commit -m "Initial commit - Agent IT Dashboard"
git branch -M main
git remote add origin https://github.com/ITJemsystems/NOME-DO-REPO.git
git push -u origin main
```

### 2. Importar no Vercel

- vercel.com -> Add New -> Project -> selecione o repositorio
- Framework Preset: Next.js (detectado automaticamente)
- Antes de clicar em Deploy, va em "Environment Variables" e adicione TODAS as
  variaveis do `.env.local.example`, com valores reais:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `AZURE_AD_CLIENT_ID`
  - `AZURE_AD_CLIENT_SECRET`
  - `AZURE_AD_TENANT_ID`
  - `NEXTAUTH_URL` (deixe em branco por enquanto se ainda nao souber a URL final -
    o Vercel gera algo como `https://agent-it-dashboard.vercel.app`; depois do
    primeiro deploy, volte aqui e preencha com a URL real, e faca um redeploy)
  - `NEXTAUTH_SECRET` (gere com `openssl rand -base64 32`)
- Clique em Deploy

### 3. Depois do primeiro deploy: atualizar o Redirect URI no Azure

- Copie a URL que o Vercel gerou (ex.: `https://agent-it-dashboard.vercel.app`)
- Volte no Azure Portal -> App registrations -> Agent IT Dashboard -> Authentication
- Add a platform -> Web -> Redirect URI:
  `https://SEU-DOMINIO.vercel.app/api/auth/callback/azure-ad`
- Save
- No Vercel, atualize a variavel `NEXTAUTH_URL` para essa mesma URL e faca um
  redeploy (Deployments -> ... -> Redeploy)

### 4. Testar

Acesse a URL da dashboard, clique em "Entrar com Microsoft", faca login com uma
conta do dominio da JEM Systems. Deve cair direto na tela principal, com os
eventos do Agent IT (producao e staging) ja aparecendo, filtraveis por
ambiente, aplicacao, tipo de evento, status, usuario e data.

## Estrutura do projeto

```
app/
  layout.tsx              Layout raiz
  page.tsx                 Pagina principal (verifica sessao, renderiza Dashboard)
  login/page.tsx            Tela de login
  api/
    auth/[...nextauth]/     Handler do NextAuth
    events/route.ts         Consulta filtrada de eventos
    filters/route.ts        Valores unicos para os dropdowns de filtro
    stats/route.ts           Aplicacoes mais usadas
components/
  Dashboard.tsx            Componente principal (filtros + tabela)
lib/
  auth.ts                  Configuracao do NextAuth (Azure AD)
  supabase.ts              Cliente Supabase server-only (Service Role Key)
middleware.ts              Protege todas as rotas atras do login
```
