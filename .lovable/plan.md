

# Filtros Avancados e Tooltips Descritivos na Pagina de Vendas

## Resumo

Adicionar tooltips descritivos em todos os icones da pagina (incluindo flags sempre visiveis, mesmo quando inativas) e implementar uma barra de filtros avancados com data, duracao, valor e flags.

---

## 1. Flags sempre visiveis com tooltip descritivo

Atualmente as flags so aparecem quando ativas. Mudar para **sempre exibir os 4 icones**, com aparencia diferenciada:

- **Ativa**: icone colorido com fundo (como esta hoje)
- **Inativa**: icone cinza com opacidade reduzida (`opacity-30`)

Cada tooltip tera descricao funcional:
- Check: "Pagamento confirmado"
- Edit2: "Contrato assinado pelo cliente"
- Landmark: "Enviado ao setor financeiro"
- Headphones: "Enviado ao time de Customer Success"

---

## 2. Filtros avancados

Adicionar uma secao expansivel de filtros abaixo da barra de busca atual, com um botao "Filtros" que abre/fecha. Campos:

### Filtro por periodo (data de fechamento)
- Dois date pickers: "De" e "Ate"
- Usa o componente `Calendar` + `Popover` ja existente

### Filtro por duracao do contrato
- Select com opcoes: "Todos", "1-3 meses", "4-6 meses", "7-12 meses", "13+ meses"

### Filtro por faixa de valor total
- Select com opcoes: "Todos", "Ate R$ 5.000", "R$ 5.000 - R$ 20.000", "R$ 20.000 - R$ 50.000", "Acima de R$ 50.000"

### Filtro por flags
- 4 checkboxes: "Pago", "Contrato Assinado", "Enviado Financeiro", "Enviado CS"
- Quando marcado, filtra apenas vendas que TEM aquela flag ativa

### Botao "Limpar Filtros"
- Reseta todos os filtros para o estado padrao

---

## 3. Logica de filtragem

Todos os filtros serao aplicados no `filteredVendas` existente, adicionando condicoes ao `.filter()` atual. Novos estados:

```
dateFrom, dateTo, duracaoFilter, valorFilter, flagFilters (pago, contrato_assinado, enviado_financeiro, enviado_cs)
```

---

## Arquivo afetado

1. `src/pages/Vendas.tsx` -- unico arquivo modificado

