
-- Enum for content status
CREATE TYPE public.conteudo_status AS ENUM (
  'Ideia',
  'EmGravacao',
  'EmEdicao',
  'EmAprovacao',
  'EmAjuste',
  'Aprovado'
);

-- Main content table
CREATE TABLE public.conteudos_marketing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT '',
  roteiro TEXT DEFAULT '',
  legenda TEXT DEFAULT '',
  data_publicacao DATE,
  responsavel_user_id UUID REFERENCES public.profiles(id),
  onde_postar TEXT[] NOT NULL DEFAULT '{}',
  tipo_conteudo TEXT[] NOT NULL DEFAULT '{}',
  status public.conteudo_status NOT NULL DEFAULT 'Ideia',
  link_drive TEXT DEFAULT '',
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ordem INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.conteudos_marketing ENABLE ROW LEVEL SECURITY;

-- All authenticated can read
CREATE POLICY "Todos autenticados podem ver conteudos"
ON public.conteudos_marketing FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Gestores and responsible can insert
CREATE POLICY "Autenticados podem inserir conteudos"
ON public.conteudos_marketing FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Gestores and responsible can update
CREATE POLICY "Autenticados podem atualizar conteudos"
ON public.conteudos_marketing FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Gestores can delete
CREATE POLICY "Gestores podem deletar conteudos"
ON public.conteudos_marketing FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
));

-- Trigger for updated_at
CREATE TRIGGER update_conteudos_marketing_updated_at
BEFORE UPDATE ON public.conteudos_marketing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comments table
CREATE TABLE public.conteudo_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo_id UUID NOT NULL REFERENCES public.conteudos_marketing(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  texto TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conteudo_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver comentarios"
ON public.conteudo_comentarios FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados podem inserir comentarios"
ON public.conteudo_comentarios FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios podem deletar seus comentarios"
ON public.conteudo_comentarios FOR DELETE
USING (auth.uid() = user_id);
