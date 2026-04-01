

## Dashboard de Relatório Diário com Screenshot + Webhook n8n

### O que será criado

Uma nova página `/relatorio-diario` com um dashboard limpo contendo 3 cards de métricas (Social Selling, Conteúdo, Comercial) com dados mock, e um botão para capturar screenshot e enviar via POST para um webhook n8n.

### Arquivos a criar/alterar

**1. Instalar dependência: `html2canvas`**

**2. Criar `src/pages/RelatorioDiario.tsx`**
- Layout com 3 cards lado a lado (grid 3 colunas):
  - **Social Selling**: Conexões enviadas, Respostas recebidas, Reuniões agendadas (mock)
  - **Conteúdo**: Alcance total, Engajamento, Cliques no link (mock)
  - **Comercial**: Leads Qualificados, Propostas Enviadas, Vendas Fechadas (mock)
- Cada card com números grandes em destaque, ícones e mini-barras de progresso
- Uma `ref` na div principal do dashboard
- Botão "Enviar Relatório" que chama `dispararRelatorioN8n()`:
  1. Usa `html2canvas` para capturar a div referenciada
  2. Converte para Base64
  3. Faz POST para a URL do webhook (constante `WEBHOOK_N8N_URL`)
  4. Payload: `{ imagem_base64, descricao, data_referencia }`
- Toast de sucesso/erro

**3. Alterar `src/App.tsx`**
- Adicionar rota `/relatorio-diario` apontando para a nova página

**4. Alterar `src/components/layout/AppSidebar.tsx`**
- Adicionar item de navegação "Relatório Diário" com ícone `FileText` ou `Camera`

### Detalhes técnicos

- A URL do webhook será uma constante no topo do arquivo (`const WEBHOOK_N8N_URL = ""`), pronta para o usuário colar sua URL do n8n
- Dados mock hardcoded por enquanto, preparados para futura integração com dados reais
- Design seguindo o padrão visual do projeto (dark theme, cards estilo `#1a1a1a`, orange accent)

