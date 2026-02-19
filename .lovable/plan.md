

# Usar Spend do Facebook Ads como Investimento no Dashboard

## Objetivo

Substituir o uso do valor manual de investimento (tabela `marketing_investimentos`) pelo valor de `spend` retornado pela API do Facebook Ads para alimentar automaticamente todas as metricas dependentes de investimento: CPA, Custo por Call, CAC, ROAS Global e ROAS Imediato.

## Como funciona hoje

1. O gestor registra manualmente o investimento diario na tabela `marketing_investimentos`
2. O hook `useMarketingStats` busca esses registros e calcula `investimentoTotal`
3. Esse valor alimenta CPA, CAC, ROAS Global e ROAS Imediato
4. A secao Facebook Ads exibe os dados da API separadamente, sem influencia nas metricas

## O que vai mudar

O `useMarketingStats` passara a receber o `spend` do Facebook Ads como fonte primaria de investimento. Se os dados do Facebook estiverem disponiveis, o `spend` substitui o valor manual. Se nao estiverem (token expirado, nao configurado), o sistema continua usando o registro manual como fallback.

```text
Facebook Ads API (spend)
    |
    v
useFacebookAdsInsights --> spend disponivel?
    |                          |
   SIM                        NAO
    |                          |
    v                          v
spend = investimentoTotal   marketing_investimentos = investimentoTotal
    |                          |
    +----------+---------------+
               |
               v
         CPA, CAC, ROAS
```

## Mudancas tecnicas

### 1. `src/pages/MarketingDashboard.tsx`

- Extrair o valor de `spend` do resultado do Facebook Ads quando `status === 'ok'`
- Passar esse valor como parametro opcional `fbSpend` para o hook `useMarketingStats`
- A secao de Facebook Ads continua visivel para gestores

### 2. `src/hooks/useMarketingDashboard.ts` - `useMarketingStats`

- Adicionar parametro opcional `fbSpend?: number | null`
- Logica de `investimentoTotal`:
  - Se `fbSpend` for um numero valido (nao null/undefined): usar `fbSpend`
  - Caso contrario: manter o calculo atual a partir de `marketing_investimentos`
- Todas as metricas derivadas (CPA, custo por call, CAC, ROAS) continuam calculadas da mesma forma, apenas usando a nova fonte de investimento

### 3. Card "Investimento em Trafego"

- Quando usando dados do Facebook, exibir um subtitle indicando "Via Facebook Ads" para transparencia
- Manter o formulario de registro manual disponivel (como fallback / controle)

## Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/hooks/useMarketingDashboard.ts` | Adicionar parametro `fbSpend` ao `useMarketingStats` e usar como fonte primaria de investimento |
| `src/pages/MarketingDashboard.tsx` | Extrair `spend` do resultado do Facebook e passar ao hook; ajustar subtitle do card de investimento |

## Fallback

O registro manual de investimento e o formulario permanecem funcionais. Caso o Facebook Ads nao esteja configurado ou o token expire, o dashboard volta a usar os dados manuais automaticamente, sem intervencao do usuario.

