
-- Add new columns from CSV that don't exist in rh_colaboradores
ALTER TABLE public.rh_colaboradores
  ADD COLUMN IF NOT EXISTS cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS data_termino date,
  ADD COLUMN IF NOT EXISTS ote_comissao text,
  ADD COLUMN IF NOT EXISTS chave_pix text,
  ADD COLUMN IF NOT EXISTS aniversario text,
  ADD COLUMN IF NOT EXISTS centro_custo text[];

-- Create table for configurable sectors (centros de custo)
CREATE TABLE IF NOT EXISTS public.rh_setores_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text NOT NULL DEFAULT '#6B7280',
  icone text DEFAULT 'Building2',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rh_setores_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read setores" ON public.rh_setores_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage setores" ON public.rh_setores_config
  FOR ALL TO authenticated USING (public.can_edit_rh()) WITH CHECK (public.can_edit_rh());

-- Seed with sectors from the CSV
INSERT INTO public.rh_setores_config (nome, cor, ordem) VALUES
  ('Sócios', '#F97316', 1),
  ('Mentoria Ames', '#3B82F6', 2),
  ('W3 Tráfego Pago', '#8B5CF6', 3),
  ('W3 Marketplace', '#22C55E', 4),
  ('W3 Pagamentos', '#EAB308', 5),
  ('W3 Educação', '#06B6D4', 6)
ON CONFLICT (nome) DO NOTHING;
