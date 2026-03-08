

# Webhook de Venda para WhatsApp (via N8N/Make)

## O que será feito

Criar uma Edge Function que recebe os dados completos da venda e envia para uma URL de webhook configurável (N8N/Make). Após o closer cadastrar uma venda com sucesso, o sistema dispara automaticamente o webhook com todas as informações.

## Arquitetura

```text
Closer registra venda → useCreateVenda (onSuccess) → Edge Function "venda-webhook" → URL do N8N/Make → WhatsApp
```

## Mudanças

### 1. Secret: `VENDA_WEBHOOK_URL`
- Adicionar um secret com a URL do webhook do N8N/Make que o usuário vai configurar

### 2. Nova Edge Function: `supabase/functions/venda-webhook/index.ts`
- Recebe o ID da venda via POST
- Usa service role key para buscar a venda completa (com nome do closer via join em profiles)
- Monta payload com todos os campos: nome do lead, empresa, closer, data, valores (pix, cartão, boleto), parcelas, valor total, duração do contrato, flags (pago, contrato assinado, enviado financeiro, enviado CS), status, observações
- Envia POST para `VENDA_WEBHOOK_URL` com o JSON completo
- Retorna sucesso/erro
- CORS headers incluídos
- `verify_jwt = false` no config.toml (validação manual do auth header)

### 3. `src/hooks/useVendas.ts`
- No `onSuccess` do `useCreateVenda`, após invalidar queries, chamar `supabase.functions.invoke('venda-webhook', { body: { venda_id: data.id } })`
- Não bloquear o fluxo — se o webhook falhar, apenas loga o erro (não impede o cadastro)

## Payload enviado ao N8N/Make

```json
{
  "evento": "nova_venda",
  "venda": {
    "id": "...",
    "data_fechamento": "2026-03-08",
    "closer": "João Silva",
    "nome_lead": "Maria",
    "nome_empresa": "Empresa X",
    "duracao_contrato_meses": 12,
    "valor_pix": 1000,
    "valor_cartao": 500,
    "valor_boleto_parcela": 200,
    "quantidade_parcelas_boleto": 3,
    "valor_total": 2100,
    "pago": false,
    "contrato_assinado": true,
    "enviado_financeiro": false,
    "enviado_cs": false,
    "status": "Ativo",
    "observacoes": "..."
  }
}
```

## Arquivos a modificar/criar

| Arquivo | Ação |
|---|---|
| `supabase/functions/venda-webhook/index.ts` | Criar |
| `supabase/config.toml` | Adicionar `[functions.venda-webhook]` |
| `src/hooks/useVendas.ts` | Disparar webhook no onSuccess |

