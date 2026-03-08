

## Diagnóstico

O problema principal: a dashboard calcula MRR a partir da tabela `trafego_pago_registros` (registros mensais), **não** do campo `valor_mrr` do cliente. Se não existem registros para o mês selecionado, o MRR aparece como R$ 0,00 — mesmo com clientes ativos.

O fluxo atual para cadastrar registros é pouco intuitivo: o usuário precisa clicar no cliente → abrir drawer → ir na aba "Histórico Mensal" → preencher formulário. Não há indicação visual de quais clientes estão sem registro no mês.

## Plano de implementação

### 1. Indicador visual na tabela de clientes — coluna "Registro Mês Atual"

Adicionar uma coluna na tabela principal mostrando o status do registro do mês atual para cada cliente:
- **Verde** com valor: quando existe registro com `status_pagamento = 'Pago'`
- **Amarelo** "Pendente": quando existe registro com status Pendente
- **Vermelho** "Atrasado": quando existe registro com status Atrasado  
- **Cinza** "Sem registro": quando não existe registro para o mês — com botão "+ Registrar" inline

Clicar em "+ Registrar" abre um modal compacto para cadastrar o registro daquele cliente naquele mês, sem precisar entrar no drawer completo.

### 2. Modal rápido de registro mensal

Modal simples com os campos:
- Cliente (pré-preenchido, readonly)
- Mês/Ano (pré-preenchido com mês atual)
- Investimento Gerenciado (R$)
- Valor Pago (R$) — pré-preenchido com `valor_mrr` do cliente como sugestão
- Status Pagamento (Pago/Pendente/Atrasado)
- ROAS (opcional)
- Observação (opcional)

Botão "Salvar" → toast de sucesso → atualiza tabela automaticamente.

### 3. Banner de alerta no topo da página de clientes

Quando existirem clientes ativos sem registro no mês atual, exibir um banner:
> "X clientes ativos sem registro em [mês atual]. Registre os dados para que a dashboard reflita corretamente."

Com botão "Registrar em lote" que abre uma view onde todos os clientes sem registro aparecem em uma tabela editável para preenchimento rápido (investimento, valor pago, status) — salvando tudo de uma vez.

### 4. View de registro em lote

Tabela com todos os clientes ativos sem registro no mês:
- Colunas: Nome | MRR Esperado | Investimento | Valor Pago | Status Pgto
- Valor Pago pré-preenchido com `valor_mrr` do cliente
- Status padrão: "Pago"
- Botão "Salvar Todos" no final — insere todos os registros de uma vez

### Arquivos a modificar/criar

- `src/pages/TrafegoPagoClientes.tsx` — adicionar coluna, banner, modal rápido, view em lote
- `src/hooks/useTrafegoPago.ts` — adicionar mutation para inserção em lote de registros

Nenhuma alteração no banco, nas dashboards, nem em outras páginas.

