
-- Create social_selling table
CREATE TABLE public.social_selling (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data date NOT NULL,
  closer_user_id uuid NOT NULL REFERENCES public.profiles(id),
  conversas_iniciadas integer NOT NULL DEFAULT 0,
  convites_enviados integer NOT NULL DEFAULT 0,
  agendamentos integer NOT NULL DEFAULT 0,
  observacoes text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_selling_data_closer_unique UNIQUE (data, closer_user_id),
  CONSTRAINT social_selling_conversas_check CHECK (conversas_iniciadas >= 0),
  CONSTRAINT social_selling_convites_check CHECK (convites_enviados >= 0),
  CONSTRAINT social_selling_agendamentos_check CHECK (agendamentos >= 0)
);

-- Trigger for updated_at
CREATE TRIGGER update_social_selling_updated_at
  BEFORE UPDATE ON public.social_selling
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.social_selling ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated
CREATE POLICY "Todos autenticados podem ver social_selling"
  ON public.social_selling
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: own or managers
CREATE POLICY "Usuários podem inserir social_selling"
  ON public.social_selling
  FOR INSERT
  WITH CHECK (
    (is_closer() AND closer_user_id = auth.uid()) OR can_edit_any_fechamento()
  );

-- UPDATE: own or managers
CREATE POLICY "Usuários podem atualizar social_selling"
  ON public.social_selling
  FOR UPDATE
  USING (
    (is_closer() AND closer_user_id = auth.uid()) OR can_edit_any_fechamento()
  );
