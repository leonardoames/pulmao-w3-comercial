

## Problema Identificado

A Edge Function `test-webhook` está enviando os dados via **GET** com o payload na query string (linha 113), mas o n8n espera receber via **POST** com body JSON.

O erro `"The requested webhook GET f685529c... is not registered"` acontece porque no n8n o webhook está configurado para aceitar POST, não GET.

O envio do Relatório Diário (`RelatorioDiario.tsx`) já usa POST corretamente, mas pode estar falhando pelo mesmo motivo se o webhook do n8n não estiver ativo/listening.

## Correção

**Arquivo: `supabase/functions/test-webhook/index.ts`**

Substituir o envio via GET (linhas 111-115):
```typescript
// ANTES (quebrado):
const encodedPayload = encodeURIComponent(JSON.stringify(payload));
const separator = webhook_url.includes("?") ? "&" : "?";
const webhookRes = await fetch(`${webhook_url}${separator}data=${encodedPayload}`, {
  method: "GET",
});

// DEPOIS (correto):
const webhookRes = await fetch(webhook_url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

Isso alinha o test-webhook com o mesmo padrão que o Relatório Diário já usa (POST + JSON body), que é o que o n8n espera.

## Checklist do lado do n8n

Confirme também que:
- O workflow no n8n está **ativo** (não em modo de teste/listening)
- A URL do webhook está correta e completa no painel admin

