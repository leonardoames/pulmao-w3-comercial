-- Meta de faturamento por mês (substitui tv_settings.meta_mensal como referência principal)
CREATE TABLE public.metas_faturamento (
  month_ref TEXT PRIMARY KEY,        -- 'YYYY-MM'
  valor NUMERIC NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.metas_faturamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos leem metas_faturamento"
  ON public.metas_faturamento
  FOR SELECT
  USING (true);

CREATE POLICY "gestores editam metas_faturamento"
  ON public.metas_faturamento
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
    )
  );
