

## Link Compartilhavel de Dashboard (Somente Visualizacao)

### Objetivo
Criar uma rota publica `/dashboard/share/:token` que permite visualizar o dashboard sem login, usando um token unico gerado pelo admin/gestor.

### Como vai funcionar

1. **Geracao do link**: No Dashboard, um botao "Compartilhar" gera um token unico (UUID) e salva no banco com data de expiracao opcional
2. **Rota publica**: Uma nova rota `/shared/:token` renderiza o dashboard em modo somente leitura (sem sidebar, sem acoes)
3. **Validacao**: O token e validado via uma edge function que retorna os dados sem exigir autenticacao

### Etapas de Implementacao

**1. Tabela `shared_links` no banco**
- Campos: `id`, `token` (UUID unico), `created_by` (user_id), `expires_at` (timestamp opcional), `is_active` (boolean), `created_at`
- RLS: somente usuarios autenticados podem criar/gerenciar; leitura publica por token

**2. Edge Function `validate-share-token`**
- Recebe o token, valida se existe e esta ativo/nao expirado
- Retorna os dados do dashboard (stats, rankings, no-show) diretamente, sem exigir auth
- Isso evita expor as tabelas publicamente

**3. Nova pagina `SharedDashboard.tsx`**
- Rota publica: `/shared/:token`
- Layout limpo (sem sidebar, sem navegacao)
- Exibe os mesmos cards e rankings do dashboard normal, porem somente leitura
- Header com logo "Pulmao W3" e indicacao "Visualizacao Compartilhada"

**4. Botao "Compartilhar" no Dashboard**
- Visivel apenas para Master/Gestor
- Abre um dialog com:
  - Botao para gerar novo link
  - Campo com o link gerado para copiar
  - Opcao de definir expiracao (24h, 7 dias, 30 dias, sem expiracao)
  - Lista de links ativos com opcao de desativar

**5. Rota no App.tsx**
- Adicionar rota publica (sem `ProtectedRoute`): `<Route path="/shared/:token" element={<SharedDashboard />} />`

### Detalhes Tecnicos

- O token sera um UUID v4 gerado via `crypto.randomUUID()`
- A edge function consulta as tabelas `vendas`, `fechamentos`, `profiles` e `ote_goals` internamente usando a service role key, retornando apenas dados agregados (nunca dados brutos sensiveis)
- O link gerado tera o formato: `https://pulmao-w3-comercial.lovable.app/shared/abc123-uuid`
- Nenhuma alteracao nas telas existentes alem do botao "Compartilhar" no header do Dashboard

### Seguranca
- Dados retornados sao apenas agregados (totais, percentuais, rankings) — sem emails ou dados pessoais
- Tokens podem ser desativados a qualquer momento
- Expiracao automatica configuravel
- Sem acesso direto as tabelas via RLS — tudo passa pela edge function

