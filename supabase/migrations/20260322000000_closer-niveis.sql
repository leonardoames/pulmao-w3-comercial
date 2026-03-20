-- Tabela de configuração de níveis de closer (admin edita sem código)
CREATE TABLE public.closer_niveis (
  nivel TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  taxa_conversao NUMERIC NOT NULL DEFAULT 0.20,
  salario_fixo NUMERIC NOT NULL DEFAULT 0,
  ordem INT NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Seed com 9 níveis (valores editáveis pelo admin)
INSERT INTO public.closer_niveis VALUES
  ('jr1',     'Jr 1',      0.15, 0, 1),
  ('jr2',     'Jr 2',      0.18, 0, 2),
  ('jr3',     'Jr 3',      0.22, 0, 3),
  ('pleno1',  'Pleno 1',   0.25, 0, 4),
  ('pleno2',  'Pleno 2',   0.28, 0, 5),
  ('pleno3',  'Pleno 3',   0.32, 0, 6),
  ('senior1', 'Sênior 1',  0.35, 0, 7),
  ('senior2', 'Sênior 2',  0.40, 0, 8),
  ('senior3', 'Sênior 3',  0.45, 0, 9);

-- RLS: todos leem; apenas MASTER/DIRETORIA editam
ALTER TABLE public.closer_niveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos leem niveis"
  ON public.closer_niveis
  FOR SELECT
  USING (true);

CREATE POLICY "admin edita niveis"
  ON public.closer_niveis
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('MASTER', 'DIRETORIA')
    )
  );

-- Campos extras em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nivel_closer TEXT REFERENCES closer_niveis(nivel),
  ADD COLUMN IF NOT EXISTS rampagem TEXT DEFAULT 'none'
    CHECK (rampagem IN ('none', 'ramp1', 'ramp2'));
