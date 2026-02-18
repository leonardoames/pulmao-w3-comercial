
# Integracao Facebook Ads no Dashboard de Marketing

## Visao Geral

Adicionar uma secao no Dashboard de Marketing que permite ao gestor configurar o acesso a API do Facebook Marketing e visualizar metricas das campanhas (gastos, impressoes, cliques, CTR, leads e conversoes) diretamente no dashboard, ao lado das metricas ja existentes.

## Arquitetura

A API do Facebook exige um Access Token e um Ad Account ID. Como sao credenciais privadas, serao armazenadas de forma segura no backend e acessadas apenas por uma Edge Function que faz proxy das chamadas a API do Facebook.

```text
Frontend (Dashboard)
    |
    v
Edge Function (facebook-ads-insights)
    |
    |--> Le secrets: FB_ACCESS_TOKEN, FB_AD_ACCOUNT_ID
    |--> Chama graph.facebook.com/v24.0/act_{ID}/insights
    |
    v
Retorna metricas ao frontend
```

## Etapas

### 1. Configuracao de Secrets

Solicitar ao usuario duas credenciais:
- **FB_ACCESS_TOKEN**: Token de acesso da API de Marketing do Facebook (obtido em developers.facebook.com > Tools > Access Token Tool, com permissao `ads_read`)
- **FB_AD_ACCOUNT_ID**: ID da conta de anuncios (formato numerico, sem o prefixo `act_`)

Ambas serao armazenadas como secrets do backend, acessiveis apenas pela Edge Function.

### 2. Edge Function: `facebook-ads-insights`

Criar `supabase/functions/facebook-ads-insights/index.ts`:

- Recebe via query params: `date_start`, `date_end`
- Autenticacao: valida JWT do usuario (apenas usuarios autenticados)
- Le as secrets `FB_ACCESS_TOKEN` e `FB_AD_ACCOUNT_ID`
- Faz GET para `https://graph.facebook.com/v24.0/act_{AD_ACCOUNT_ID}/insights` com:
  - `fields=spend,impressions,clicks,ctr,actions`
  - `time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}`
  - `access_token=FB_ACCESS_TOKEN`
- Filtra `actions` para extrair `lead` e `offsite_conversion` (ou outros tipos de conversao)
- Retorna JSON com: `spend`, `impressions`, `clicks`, `ctr`, `leads`, `conversions`
- CORS headers incluidos

Adicionar ao `supabase/config.toml`:
```toml
[functions.facebook-ads-insights]
verify_jwt = false
```

### 3. Hook: `useFacebookAdsInsights`

Criar em `src/hooks/useFacebookAdsInsights.ts`:

- Recebe `filter` (DateFilter) e `customRange` (DateRange)
- Usa `useQuery` para chamar a edge function via `supabase.functions.invoke('facebook-ads-insights', { body: { date_start, date_end } })`
- Retorna dados tipados: `spend`, `impressions`, `clicks`, `ctr`, `leads`, `conversions`
- `enabled` somente quando o usuario tem permissao de gerenciar o dashboard

### 4. Frontend: Nova secao no Dashboard

No `MarketingDashboard.tsx`, adicionar uma nova secao "Facebook Ads" (visivel apenas para gestores) com 6 StatCards:

| Card | Dado | Formato |
|---|---|---|
| Gasto Facebook | spend | R$ (moeda) |
| Impressoes | impressions | numero |
| Cliques | clicks | numero |
| CTR | ctr | percentual |
| Leads | leads (da action "lead") | numero |
| Conversoes | conversions (da action "offsite_conversion") | numero |

A secao mostra um estado de "nao configurado" caso a edge function retorne erro de credenciais ausentes, com um link/instrucoes para o gestor solicitar a configuracao.

### 5. Tratamento de Erros

- Se as secrets nao estiverem configuradas, a edge function retorna `{ error: "not_configured" }` com status 200
- O frontend exibe um card informativo: "Facebook Ads nao configurado. Entre em contato com o administrador."
- Se o token estiver expirado, a API do Facebook retorna 190 -- a edge function retorna `{ error: "token_expired" }` e o frontend exibe aviso para renovar o token

---

## Detalhes Tecnicos

### Edge Function - Estrutura

```typescript
// Valida auth via getClaims
// Le FB_ACCESS_TOKEN e FB_AD_ACCOUNT_ID do env
// GET https://graph.facebook.com/v24.0/act_{id}/insights
//   ?fields=spend,impressions,clicks,ctr,actions
//   &time_range={"since":"...","until":"..."}
//   &access_token=...
// Parseia actions para extrair leads e conversoes
// Retorna JSON estruturado
```

### Campos retornados pela API do Facebook

- `spend`: valor gasto (string numerica)
- `impressions`: total de impressoes
- `clicks`: total de cliques
- `ctr`: click-through rate (percentual)
- `actions`: array de objetos `{ action_type, value }` -- filtrar por `lead` e `offsite_conversion.*`

### Arquivos criados/modificados

| Arquivo | Acao |
|---|---|
| `supabase/functions/facebook-ads-insights/index.ts` | Criar |
| `supabase/config.toml` | Adicionar config da funcao |
| `src/hooks/useFacebookAdsInsights.ts` | Criar |
| `src/pages/MarketingDashboard.tsx` | Adicionar secao Facebook Ads |

### Secrets necessarias

- `FB_ACCESS_TOKEN` -- sera solicitado ao usuario
- `FB_AD_ACCOUNT_ID` -- sera solicitado ao usuario
