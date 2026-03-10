
CREATE TABLE public.leads_w3_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads_w3(id) ON DELETE CASCADE,
  produto text NOT NULL CHECK (produto IN ('educacao','trafego','marketplace','pagamentos')),
  status text NOT NULL DEFAULT 'nunca_contratou'
    CHECK (status IN ('ativo','finalizado','cancelado','congelado','nunca_contratou')),
  valor_total numeric(12,2),
  valor_pago numeric(12,2),
  saldo_devedor numeric(12,2),
  data_inicio date,
  data_fim date,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, produto)
);

ALTER TABLE public.leads_w3_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver leads_produtos"
  ON public.leads_w3_produtos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir leads_produtos"
  ON public.leads_w3_produtos FOR INSERT
  WITH CHECK (can_edit_vendas());

CREATE POLICY "Gestores podem atualizar leads_produtos"
  ON public.leads_w3_produtos FOR UPDATE
  USING (can_edit_vendas());

CREATE POLICY "Master pode deletar leads_produtos"
  ON public.leads_w3_produtos FOR DELETE
  USING (is_master());

-- Migrar dados existentes de educação para a nova tabela
INSERT INTO public.leads_w3_produtos
  (lead_id, produto, status, valor_total, valor_pago, saldo_devedor, data_inicio)
SELECT
  id,
  'educacao',
  CASE status
    WHEN 'Em Andamento' THEN 'ativo'
    WHEN 'Finalizado'   THEN 'finalizado'
    WHEN 'Cancelado'    THEN 'cancelado'
    WHEN 'Congelado'    THEN 'congelado'
    ELSE 'nunca_contratou'
  END,
  valor_total,
  valor_pago,
  saldo_devedor,
  data_entrada
FROM public.leads_w3
WHERE status IS NOT NULL
ON CONFLICT (lead_id, produto) DO NOTHING;
