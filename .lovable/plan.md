

# Separar Leads e ScheduledCG no Facebook Ads

## Situacao atual

Hoje o card "Leads" exibe apenas o evento `schedule` (ScheduledCG) da API do Facebook. O usuario quer ver **dois cards separados**: um para o evento `lead` (Leads) e outro para o evento `schedule` (ScheduledCG).

## Mudancas

### 1. Edge Function (`supabase/functions/facebook-ads-insights/index.ts`)

- Adicionar parsing do evento `lead` separado do `schedule`
- Retornar dois campos no JSON: `leads` (action_type === "lead") e `scheduled` (action_type === "schedule")
- Manter o campo `conversions` como esta

### 2. Hook (`src/hooks/useFacebookAdsInsights.ts`)

- Adicionar `scheduled: number` na interface `FacebookAdsData`

### 3. Componente (`src/components/marketing/FacebookAdsSection.tsx`)

- Trocar o card "Leads" para exibir `data.leads` (evento `lead` da API)
- Adicionar um novo card "ScheduledCG" exibindo `data.scheduled`
- Trocar o card "Conversoes" (que ja existe) ou manter, totalizando 7 cards no grid

### Resultado visual

| Card | Fonte API |
|---|---|
| Gasto Facebook | spend |
| Impressoes | impressions |
| Cliques | clicks |
| CTR | ctr |
| Leads | action_type = "lead" |
| ScheduledCG | action_type = "schedule" |
| Conversoes | action_type starts with "offsite_conversion" |

### Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/facebook-ads-insights/index.ts` | Separar parsing de `lead` e `schedule` em dois campos |
| `src/hooks/useFacebookAdsInsights.ts` | Adicionar `scheduled` na interface |
| `src/components/marketing/FacebookAdsSection.tsx` | Exibir cards separados para Leads e ScheduledCG |

