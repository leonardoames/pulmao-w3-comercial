CREATE TABLE public.leads_w3 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL DEFAULT '',
  nome_negocio text NOT NULL DEFAULT '',
  nome_mentorado text,
  nicho text,
  email text,
  data_entrada date,
  vigencia_meses integer,
  tempo_real_meses integer,
  status text DEFAULT 'Não informado',
  valor_total numeric,
  valor_pago numeric,
  saldo_devedor numeric,
  forma_pagamento text,
  faturamento_inicial numeric,
  ticket_medio numeric,
  nps text,
  motivo_saida text,
  is_cliente_educacao boolean NOT NULL DEFAULT false,
  is_cliente_trafego boolean NOT NULL DEFAULT false,
  is_cliente_marketplace boolean NOT NULL DEFAULT false,
  venda_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_w3 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver leads_w3"
  ON public.leads_w3 FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir leads_w3"
  ON public.leads_w3 FOR INSERT
  WITH CHECK (can_edit_vendas());

CREATE POLICY "Gestores podem atualizar leads_w3"
  ON public.leads_w3 FOR UPDATE
  USING (can_edit_vendas());

CREATE POLICY "Master pode deletar leads_w3"
  ON public.leads_w3 FOR DELETE
  USING (is_master());