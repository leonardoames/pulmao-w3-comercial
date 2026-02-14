
-- Tabela para investimento diário em tráfego (Marketing Dashboard)
CREATE TABLE public.marketing_investimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data date NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid NOT NULL,
  CONSTRAINT marketing_investimentos_data_unique UNIQUE (data),
  CONSTRAINT marketing_investimentos_valor_positive CHECK (valor >= 0)
);

-- Enable RLS
ALTER TABLE public.marketing_investimentos ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver
CREATE POLICY "Todos autenticados podem ver marketing_investimentos"
ON public.marketing_investimentos
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Gestores podem inserir
CREATE POLICY "Gestores podem inserir marketing_investimentos"
ON public.marketing_investimentos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);

-- Gestores podem atualizar
CREATE POLICY "Gestores podem atualizar marketing_investimentos"
ON public.marketing_investimentos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_marketing_investimentos_updated_at
BEFORE UPDATE ON public.marketing_investimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
