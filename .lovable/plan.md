

# Adicionar campo "Reagendado" nos Fechamentos + Exportar PDF de Vendas

## Parte 1: Campo "Reagendado" nos Fechamentos

### 1.1 Migracao SQL
Adicionar coluna `reagendado` (integer, default 0, NOT NULL) na tabela `fechamentos`.

```sql
ALTER TABLE public.fechamentos ADD COLUMN reagendado integer NOT NULL DEFAULT 0;
ALTER TABLE public.fechamentos ADD CONSTRAINT fechamentos_reagendado_check CHECK (reagendado >= 0 AND reagendado <= 1000);
```

### 1.2 Formulario de cadastro (MeuFechamento.tsx)
- Adicionar campo "Reagendados" entre "Calls Realizadas" e "No-Shows"
- Mudar o grid de 2 para 3 colunas: Realizadas | Reagendados | No-Shows
- Atualizar o calculo de "Calls Agendadas" para: `callsRealizadas + reagendado + noShow`
- Adicionar state `reagendado` e carregar do banco ao mudar de data
- Enviar o campo no `handleSave`

### 1.3 Historico (tabela no MeuFechamento.tsx)
- Adicionar coluna "Reagendados" entre "Realizadas" e "No-Show (%)"
- Ordem das colunas: Data | Realizadas | Reagendados | No-Show (%) | Agendadas
- Atualizar a formula de Agendadas para incluir reagendado: `realizadas + reagendado + no_show`
- Adicionar totais de reagendado no rodape

### 1.4 Hook useFechamentos.ts
- Incluir `reagendado` no tipo e na query
- Atualizar o campo derivado `calls_agendadas` para: `calls_realizadas + reagendado + no_show`

### 1.5 Schema de validacao (validation.ts)
- Adicionar `reagendado: z.number().int().min(0).max(1000)` no `fechamentoSchema`

### 1.6 Tipo CRM (crm.ts)
- Adicionar `reagendado: number` na interface `Fechamento`

### 1.7 Dashboard Comercial (useDashboard.ts + Dashboard.tsx)
- Buscar `reagendado` junto com `calls_realizadas` e `no_show` nos fechamentos
- Calcular total de reagendamentos e percentual: `reagendados / agendadas * 100`
- Atualizar `callsAgendadas` para incluir reagendado
- Adicionar StatCard "% Reagendado" na secao Performance Comercial, entre "Vendas Realizadas" e "Calls Realizadas"
- Mesmo padrao visual dos outros cards (icone, subtitle com valor absoluto)

### 1.8 Modo TV e SharedDashboard
- Verificar se esses componentes usam os mesmos dados do dashboard e ajustar se necessario

---

## Parte 2: Exportar PDF de Vendas

### 2.1 Botao de exportacao (Vendas.tsx)
- Adicionar botao "Exportar PDF" ao lado dos filtros, usando a lib `html-to-image` (ja instalada) para gerar imagem e abrir em nova janela para impressao/download
- Alternativa mais robusta: gerar o PDF diretamente no navegador usando a API nativa `window.print()` com um layout formatado, ou criar uma funcao que monta um HTML formatado dos dados filtrados e usa `window.open` + `window.print()`
- O PDF incluira: cabecalho com titulo e periodo do filtro, tabela com todas as vendas filtradas (mesmas colunas da tela), e totais no rodape

### 2.2 Implementacao
- Criar funcao `handleExportPDF` que:
  1. Abre uma nova janela com layout de impressao
  2. Renderiza tabela HTML com os dados de `filteredVendas`
  3. Inclui resumo (total vendas, faturamento, ticket medio)
  4. Chama `window.print()` automaticamente
- Nao requer dependencia adicional

---

## Arquivos afetados

| Acao | Arquivo |
|------|---------|
| Criar | Migracao SQL (adicionar coluna `reagendado`) |
| Editar | `src/types/crm.ts` (interface Fechamento) |
| Editar | `src/schemas/validation.ts` (fechamentoSchema) |
| Editar | `src/hooks/useFechamentos.ts` (query + upsert + derivado) |
| Editar | `src/hooks/useDashboard.ts` (incluir reagendado nos calculos) |
| Editar | `src/pages/MeuFechamento.tsx` (formulario + historico) |
| Editar | `src/pages/Dashboard.tsx` (novo StatCard reagendado) |
| Editar | `src/pages/Vendas.tsx` (botao + funcao exportar PDF) |

