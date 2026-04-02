

## Adicionar evento "Formulários" nos Webhooks do Painel Admin

### Alteração

**`src/components/admin/WebhooksPanel.tsx`** — Adicionar uma nova opção `<SelectItem>` no dropdown de "Evento":

```
<SelectItem value="formulario">Formulário</SelectItem>
```

Isso permitirá criar webhooks com o evento "formulario", para que URLs de n8n/Make/Zapier recebam notificações quando formulários forem preenchidos.

Nenhuma alteração de banco de dados é necessária — o campo `evento` na tabela `webhooks` é do tipo `text`, então aceita qualquer valor.

