
-- Tabela para links compartilháveis do dashboard
CREATE TABLE public.shared_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Somente gestores podem criar links
CREATE POLICY "Gestores podem inserir shared_links"
ON public.shared_links FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);

-- Somente gestores podem ver/gerenciar links
CREATE POLICY "Gestores podem ver shared_links"
ON public.shared_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);

-- Somente gestores podem atualizar (desativar) links
CREATE POLICY "Gestores podem atualizar shared_links"
ON public.shared_links FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);

-- Somente gestores podem deletar links
CREATE POLICY "Gestores podem deletar shared_links"
ON public.shared_links FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
);
