-- Webhooks table for managing webhook URLs
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  url text NOT NULL,
  ambiente text NOT NULL DEFAULT 'teste' CHECK (ambiente IN ('teste', 'producao')),
  evento text NOT NULL DEFAULT 'nova_venda',
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid NOT NULL REFERENCES public.profiles(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Only MASTER can manage webhooks
CREATE POLICY "MASTER pode ver webhooks"
  ON public.webhooks FOR SELECT TO authenticated
  USING (is_master());

CREATE POLICY "MASTER pode inserir webhooks"
  ON public.webhooks FOR INSERT TO authenticated
  WITH CHECK (is_master());

CREATE POLICY "MASTER pode atualizar webhooks"
  ON public.webhooks FOR UPDATE TO authenticated
  USING (is_master());

CREATE POLICY "MASTER pode deletar webhooks"
  ON public.webhooks FOR DELETE TO authenticated
  USING (is_master());

-- Service role needs to read webhooks from edge functions
-- (service role bypasses RLS by default, so no extra policy needed)