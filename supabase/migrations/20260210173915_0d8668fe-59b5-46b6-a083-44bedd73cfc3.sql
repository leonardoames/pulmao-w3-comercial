
-- Table to store TV mode settings (global meta mensal)
CREATE TABLE public.tv_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tv_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated can read
CREATE POLICY "Todos autenticados podem ver tv_settings"
  ON public.tv_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can insert/update
CREATE POLICY "Gestores podem inserir tv_settings"
  ON public.tv_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  ));

CREATE POLICY "Gestores podem atualizar tv_settings"
  ON public.tv_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  ));

-- Seed default value
INSERT INTO public.tv_settings (key, value) VALUES ('meta_mensal', '100000');
