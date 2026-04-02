

## Relatório Diário com Dados Reais do Banco

Atualmente a página `/relatorio-diario` usa dados mock (hardcoded). O plano é substituir por dados reais das 3 tabelas do sistema, filtrando pelo mês atual.

### Métricas por Área

**Social Selling** (tabela `social_selling`):
- Conversas Iniciadas (soma do mês) — meta: 100/dia × dias úteis
- Convites Enviados (soma do mês) — meta: 30/dia × dias úteis
- Formulários Preenchidos (soma do mês) — meta: 20/dia × dias úteis
- Agendamentos (soma do mês) — meta: 10/dia × dias úteis
- Taxa de Conversão: Agendamentos / Conversas (%)

**Conteúdo** (tabela `content_daily_logs` + `content_post_items`):
- Posts Publicados (soma do mês) — meta: 6/dia × dias
- Stories Realizados (soma do mês) — meta: 10/dia × dias
- Vídeos YouTube (soma do mês)
- Seguidores @leo (último registro do mês)
- Seguidores @w3 (último registro do mês)

**Comercial** (tabelas `vendas` + `fechamentos`):
- Faturamento do Mês (soma `valor_total` vendas ativas)
- Vendas Fechadas (count)
- Calls Realizadas (soma `calls_realizadas`)
- No-Show (soma `no_show`)
- Taxa de Conversão: Vendas / Calls (%)

### Arquivos a alterar

**1. `src/pages/RelatorioDiario.tsx`**
- Remover todo mock data
- Adicionar queries ao banco para buscar dados do mês atual das 3 tabelas
- Agregar os valores (soma, contagem, último registro)
- Calcular metas proporcionais ao número de dias úteis do mês
- Manter o layout de 3 cards com `MetricRow` + Progress
- Adicionar filtro de mês (reutilizar `MonthYearSelector`)
- Manter a funcionalidade de screenshot + webhook intacta
- Adicionar estado de loading enquanto os dados carregam

### Detalhes técnicos

- Queries usam `supabase.from('social_selling').select('*').gte('data', startOfMonth).lte('data', endOfMonth)` e similares para as outras tabelas
- Metas diárias vêm das constantes já existentes em `SOCIAL_SELLING_GOALS` e das metas de conteúdo
- Meta de faturamento vem da tabela `metas_faturamento` (campo `month_ref`)
- O payload do webhook passa a incluir os dados numéricos reais além da imagem

