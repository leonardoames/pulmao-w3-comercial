

# Incluir detalhes de pagamento na exportacao PDF de Vendas

## Problema
A funcao `handleExportPDF` gera a tabela com apenas 6 colunas (Data, Lead, Empresa, Closer, Duracao, Valor Total), omitindo os detalhes de pagamento e as flags de status.

## Solucao
Atualizar a funcao `handleExportPDF` em `src/pages/Vendas.tsx` para incluir todas as informacoes relevantes.

### Colunas que serao adicionadas na tabela do PDF:
- **Pix (R$)** -- valor pago via Pix
- **Cartao (R$)** -- valor pago via cartao
- **Boleto (R$)** -- valor da parcela x quantidade de parcelas (ex: "3x R$ 500,00")
- **Pago** -- Sim/Nao
- **Contrato** -- Sim/Nao
- **Env. Financeiro** -- Sim/Nao
- **Env. CS** -- Sim/Nao

### Ajustes visuais:
- Layout da tabela sera ajustado para orientacao paisagem (`@page { size: landscape }`) para acomodar as colunas adicionais
- Fonte reduzida para caber todos os dados
- Valores monetarios alinhados a direita
- Flags exibidas como "Sim" / "Nao"

### Arquivo afetado
| Acao | Arquivo |
|------|---------|
| Editar | `src/pages/Vendas.tsx` (funcao `handleExportPDF`, linhas 226-270) |

### Detalhes tecnicos
Modificar o mapeamento de cada venda para incluir as novas colunas:

```text
Colunas do cabecalho:
Data | Lead | Empresa | Closer | Duracao | Pix | Cartao | Boleto | Valor Total | Pago | Contrato | Financeiro | CS

Cada linha tera:
- Pix/Cartao/Valor Total formatados com formatCurrency()
- Boleto exibido como "Nx R$ X,XX" ou "-" se zero
- Flags como "Sim"/"Nao"
- CSS @page com size:landscape para impressao
```

