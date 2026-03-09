CREATE TABLE public.leads_w3 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome_negocio text NOT NULL,
  nome_mentorado text,
  nicho text,
  email text,
  data_entrada date,
  vigencia_meses integer,
  tempo_real_meses integer,
  status text CHECK (status IN ('Em Andamento','Finalizado','Cancelado',
    'Congelado','Renovação','Reembolsado','Sem Retorno','Não informado')),
  valor_total numeric(12,2),
  valor_pago numeric(12,2),
  saldo_devedor numeric(12,2),
  forma_pagamento text,
  faturamento_inicial numeric(12,2),
  ticket_medio numeric(12,2),
  nps text,
  motivo_saida text,
  is_cliente_educacao boolean DEFAULT false,
  is_cliente_trafego boolean DEFAULT false,
  is_cliente_marketplace boolean DEFAULT false,
  venda_id uuid REFERENCES vendas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads_w3 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam leads" ON public.leads_w3
  USING (can_edit_rh());
