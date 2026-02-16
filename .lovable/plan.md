# Refatoracao: Acompanhamento Diario -> Historico em Tabela + Modal

## Resumo

Substituir a tela atual de checklist por dia por uma tela de historico em tabela com cadastro/edicao via modal. A tabela lista registros diarios (1 linha = 1 dia) com filtros de periodo e responsavel. O modal concentra todos os dados do dia: 6 posts obrigatorios com tri-state, posts adicionais, stories, YouTube, seguidores @leo/@w3 e observacao.

---

## 1. Migracao de Banco de Dados

Adicionar colunas na tabela `content_daily_logs`:

- `followers_leo` integer NOT NULL DEFAULT 0
- `followers_w3` integer NOT NULL DEFAULT 0
- `responsible_name` text NOT NULL DEFAULT 'Otto'

A coluna `followers_gained` existente sera mantida por compatibilidade mas deixara de ser usada nesta tela (os novos campos substituem).

---

## 2. Atualizar Tipos TypeScript

### Arquivo: `src/types/content.ts`

- Atualizar `ContentDailyLog` para incluir `followers_leo`, `followers_w3`, `responsible_name`
- Atualizar o template de posts obrigatorios com os 6 novos textos fixos (sem variacao par/impar)
- Renomear labels de status para UI: "Nao fez" / "Publicado" / "Agendado" (os enums do DB permanecem `pendente`/`feito`/`agendado`)

Novos 6 posts obrigatorios fixos:

1. Post 1 Léo: Corte do podcast - Autoridade/viral
2. Post 2 Léo: Viral
3. Post 3 Léo: Frase Twitter - Viral/Educativo
4. Post 4 Léo: Frase Twitter -- Viral/Educativo
5. Post 5 Léo: Documentario dia a dia do ecomm
6. Post 6 W3: Institucional ou Depoimento

---

## 3. Atualizar Hooks

### Arquivo: `src/hooks/useContentTracking.ts`

- `useContentDailyLogs`: adicionar filtro opcional por `responsible_name`
- `useDeleteContentDailyLog`: novo hook para excluir um log e seus post items associados
- Manter hooks de post items existentes

---

## 4. Reescrever Pagina Principal

### Arquivo: `src/pages/ConteudoAcompanhamento.tsx`

Substituir todo o conteudo por:

### 4.1 Topbar

- Titulo "Acompanhamento Diario"
- Filtros de periodo: Hoje / 7D / Mes / Personalizado (date range picker)
- Filtro por responsavel (Select com opcoes: "Todos", "Otto", etc.)
- Botao primario: "+ Novo registro"

### 4.2 Tabela de Historico

Colunas:
| Data | Responsavel | Posts publicados | Posts agendados | Stories | YouTube | Seguidores @leo | Seguidores @w3 | Obs | Acoes |

- Dados vem de `content_daily_logs` + contagens calculadas de `content_post_items`
- Posts publicados = count de items com status `feito` para aquele dia
- Posts agendados = count de items com status `agendado`
- Coluna Obs: icone de texto com tooltip ou preview curto (primeiros 50 chars)
- Acoes: botoes Ver / Editar / Excluir
- Ordenacao padrao: data decrescente
- Empty state: "Nenhum registro encontrado"

### 4.3 Permissoes na tabela

- Todos veem a tabela
- Apenas gestores (canEdit) veem botao "+ Novo registro" e acoes Editar/Excluir

---

## 5. Modal de Cadastro/Edicao

### Novo componente: `src/components/conteudos/DailyLogModal.tsx`

Dialog grande (`max-w-2xl`) com scroll, dividido em blocos:

### Bloco Header

- Titulo: "Novo registro do dia" (ou "Editar registro" se editando)

### Bloco A -- Data + Responsavel

- Data: datepicker obrigatorio (default hoje)
- Responsavel: Select com "Otto" pre-selecionado

### Bloco B -- Posts obrigatorios (6 itens fixos)

Titulo: "Posts obrigatorios"

- 6 linhas fixas, cada uma com:
  - Label do post (texto fixo, nao editavel)
  - Tri-state toggle: Nao fez (cinza) / Publicado (verde) / Agendado (amarelo)
- Nao pode remover itens obrigatorios

### Bloco C -- Posts adicionais

Titulo: "Posts adicionais"

- Botao "+ Adicionar post"
- Cada item adicionado tem:
  - Plataforma (Select: Instagram / YouTube)
  - Status tri-state: Nao fez / Publicado / Agendado
  - Titulo (input curto)
  - Descricao (textarea curta, opcional)
  - Botao remover (X)

### Bloco D -- Stories

- Label: "Quantidade de stories do dia"
- Input numerico (default 0)

### Bloco E -- YouTube

- Label: "YouTube publicados"
- Input numerico (default 0)

### Bloco F -- Seguidores

- Dois campos lado a lado:
  - "Seguidores @leo" (numerico, default 0)
  - "Seguidores @w3" (numerico, default 0)

### Bloco G -- Observacao

- Textarea: "Observacao do dia"

### Botoes

- "Cancelar" (fecha modal)
- "Salvar registro" (primario, laranja)

### Logica ao salvar:

1. Calcula posts_published_count = count de items (obrigatorios + adicionais) com status "Publicado" (feito)
2. Calcula posts_scheduled_count = count com status "Agendado"
3. Upsert em `content_daily_logs` com todos os campos
4. Upsert/replace `content_post_items` para a data (delete existentes + insert novos)
5. Fecha modal e invalida queries

---

## 6. Modal/Sheet de Visualizacao

### Novo componente: `src/components/conteudos/DailyLogViewSheet.tsx`

Sheet lateral (ou Dialog read-only) mostrando resumo do dia:

- Data e responsavel
- Lista dos 6 posts obrigatorios com status visual
- Lista de posts adicionais
- Metricas: Stories, YouTube, Seguidores @leo, Seguidores @w3
- Observacao

---

## 7. Impacto no Dashboard de Conteudo

O `ConteudoDashboard.tsx` continuara funcionando pois le de `content_daily_logs`. Os novos campos `followers_leo` e `followers_w3` podem ser usados futuramente para graficos separados, mas nao e necessario alterar o dashboard agora.

---

## 8. Arquivos Afetados


| Acao            | Arquivo                                          |
| --------------- | ------------------------------------------------ |
| Migracao SQL    | Nova migracao (3 colunas em content_daily_logs)  |
| Editar tipos    | `src/types/content.ts`                           |
| Editar hooks    | `src/hooks/useContentTracking.ts`                |
| Reescrever      | `src/pages/ConteudoAcompanhamento.tsx`           |
| Novo componente | `src/components/conteudos/DailyLogModal.tsx`     |
| Novo componente | `src/components/conteudos/DailyLogViewSheet.tsx` |


---

## 9. Sequencia de Implementacao

1. Migracao SQL (novas colunas)
2. Atualizar tipos em `content.ts`
3. Atualizar hooks em `useContentTracking.ts`
4. Criar componente `DailyLogModal.tsx`
5. Criar componente `DailyLogViewSheet.tsx`
6. Reescrever `ConteudoAcompanhamento.tsx`