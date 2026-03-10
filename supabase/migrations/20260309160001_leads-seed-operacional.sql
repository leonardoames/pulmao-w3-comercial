-- Fase 2: Conectar clientes existentes de Tráfego e Marketplace à Base Leads W3
-- Estratégia: match por nome_ecommerce ≈ nome_negocio (case-insensitive)
-- Se não achar: cria um novo lead automaticamente

-- ─────────────────────────────────────────────
-- TRÁFEGO PAGO
-- ─────────────────────────────────────────────

-- 2.1: Linkar clientes de tráfego que já têm correspondência em leads_w3
UPDATE public.trafego_pago_clientes t
SET lead_id = l.id
FROM public.leads_w3 l
WHERE lower(trim(t.nome_ecommerce)) = lower(trim(l.nome_negocio))
  AND t.lead_id IS NULL;

-- 2.2: Criar leads para clientes de tráfego sem correspondência
WITH inserted AS (
  INSERT INTO public.leads_w3 (
    codigo, nome_negocio, nicho, data_entrada,
    is_cliente_trafego, is_cliente_educacao, is_cliente_marketplace
  )
  SELECT
    'TP-' || substring(t.id::text, 1, 8),
    t.nome_ecommerce,
    t.nicho,
    t.data_entrada,
    true, false, false
  FROM public.trafego_pago_clientes t
  WHERE t.lead_id IS NULL
  RETURNING id, nome_negocio
)
UPDATE public.trafego_pago_clientes t
SET lead_id = i.id
FROM inserted i
WHERE lower(trim(t.nome_ecommerce)) = lower(trim(i.nome_negocio))
  AND t.lead_id IS NULL;

-- 2.3: Upsert leads_w3_produtos com produto = 'trafego'
INSERT INTO public.leads_w3_produtos (lead_id, produto, status, data_inicio)
SELECT
  t.lead_id,
  'trafego',
  CASE t.status
    WHEN 'Ativo'     THEN 'ativo'
    WHEN 'Pausado'   THEN 'congelado'
    WHEN 'Trial'     THEN 'ativo'
    WHEN 'Cancelado' THEN 'cancelado'
    ELSE 'cancelado'
  END,
  t.data_entrada
FROM public.trafego_pago_clientes t
WHERE t.lead_id IS NOT NULL
ON CONFLICT (lead_id, produto) DO UPDATE
  SET status     = EXCLUDED.status,
      data_inicio = EXCLUDED.data_inicio,
      updated_at  = now();

-- 2.4: Atualizar flag is_cliente_trafego nos leads vinculados
UPDATE public.leads_w3
SET is_cliente_trafego = true
WHERE id IN (
  SELECT lead_id FROM public.trafego_pago_clientes WHERE lead_id IS NOT NULL
);

-- ─────────────────────────────────────────────
-- MARKETPLACE
-- ─────────────────────────────────────────────

-- 2.5: Linkar clientes de marketplace que já têm correspondência em leads_w3
UPDATE public.marketplace_clientes m
SET lead_id = l.id
FROM public.leads_w3 l
WHERE lower(trim(m.nome_ecommerce)) = lower(trim(l.nome_negocio))
  AND m.lead_id IS NULL;

-- 2.6: Criar leads para clientes de marketplace sem correspondência
WITH inserted AS (
  INSERT INTO public.leads_w3 (
    codigo, nome_negocio, nicho, data_entrada,
    is_cliente_marketplace, is_cliente_educacao, is_cliente_trafego
  )
  SELECT
    'MK-' || substring(m.id::text, 1, 8),
    m.nome_ecommerce,
    m.nicho,
    m.data_entrada,
    true, false, false
  FROM public.marketplace_clientes m
  WHERE m.lead_id IS NULL
  RETURNING id, nome_negocio
)
UPDATE public.marketplace_clientes m
SET lead_id = i.id
FROM inserted i
WHERE lower(trim(m.nome_ecommerce)) = lower(trim(i.nome_negocio))
  AND m.lead_id IS NULL;

-- 2.7: Upsert leads_w3_produtos com produto = 'marketplace'
INSERT INTO public.leads_w3_produtos (lead_id, produto, status, data_inicio)
SELECT
  m.lead_id,
  'marketplace',
  CASE m.status
    WHEN 'Ativo'     THEN 'ativo'
    WHEN 'Pausado'   THEN 'congelado'
    WHEN 'Trial'     THEN 'ativo'
    WHEN 'Cancelado' THEN 'cancelado'
    ELSE 'cancelado'
  END,
  m.data_entrada
FROM public.marketplace_clientes m
WHERE m.lead_id IS NOT NULL
ON CONFLICT (lead_id, produto) DO UPDATE
  SET status     = EXCLUDED.status,
      data_inicio = EXCLUDED.data_inicio,
      updated_at  = now();

-- 2.8: Atualizar flag is_cliente_marketplace nos leads vinculados
UPDATE public.leads_w3
SET is_cliente_marketplace = true
WHERE id IN (
  SELECT lead_id FROM public.marketplace_clientes WHERE lead_id IS NOT NULL
);
