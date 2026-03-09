
-- Create rh_colaboradores table
CREATE TABLE public.rh_colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  foto_url text,
  cargo text DEFAULT '',
  setor text DEFAULT 'outro',
  data_entrada date,
  tipo_contrato text DEFAULT 'clt',
  salario numeric,
  status text DEFAULT 'ativo',
  responsavel_id uuid REFERENCES public.rh_colaboradores(id) ON DELETE SET NULL,
  closer_id uuid,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rh_feedbacks table
CREATE TABLE public.rh_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.rh_colaboradores(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL,
  tipo text DEFAULT 'neutro',
  titulo text DEFAULT '',
  conteudo text NOT NULL,
  visibilidade text DEFAULT 'gestor',
  created_at timestamptz DEFAULT now()
);

-- Create rh_ciclos_avaliacao table
CREATE TABLE public.rh_ciclos_avaliacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  periodo text DEFAULT 'trimestral',
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status text DEFAULT 'rascunho',
  created_at timestamptz DEFAULT now()
);

-- Create rh_avaliacoes table
CREATE TABLE public.rh_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.rh_ciclos_avaliacao(id) ON DELETE CASCADE,
  avaliado_id uuid NOT NULL REFERENCES public.rh_colaboradores(id) ON DELETE CASCADE,
  avaliador_id uuid NOT NULL,
  tipo_avaliador text DEFAULT 'gestor',
  nota_resultado integer,
  nota_atitude integer,
  nota_colaboracao integer,
  nota_desenvolvimento integer,
  pontos_fortes text,
  pontos_melhoria text,
  comentario_geral text,
  status text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rh_colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_ciclos_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_avaliacoes ENABLE ROW LEVEL SECURITY;

-- Security definer function for RH access
CREATE OR REPLACE FUNCTION public.can_edit_rh()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
  )
$$;

-- RLS for rh_colaboradores
CREATE POLICY "Todos autenticados podem ver rh_colaboradores" ON public.rh_colaboradores FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Gestores podem inserir rh_colaboradores" ON public.rh_colaboradores FOR INSERT WITH CHECK (can_edit_rh());
CREATE POLICY "Gestores podem atualizar rh_colaboradores" ON public.rh_colaboradores FOR UPDATE USING (can_edit_rh());
CREATE POLICY "Master pode deletar rh_colaboradores" ON public.rh_colaboradores FOR DELETE USING (is_master());

-- RLS for rh_feedbacks (only gestores/admins can see)
CREATE POLICY "Gestores podem ver rh_feedbacks" ON public.rh_feedbacks FOR SELECT USING (can_edit_rh());
CREATE POLICY "Gestores podem inserir rh_feedbacks" ON public.rh_feedbacks FOR INSERT WITH CHECK (can_edit_rh());
CREATE POLICY "Master pode deletar rh_feedbacks" ON public.rh_feedbacks FOR DELETE USING (is_master());

-- RLS for rh_ciclos_avaliacao
CREATE POLICY "Todos autenticados podem ver rh_ciclos" ON public.rh_ciclos_avaliacao FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Gestores podem inserir rh_ciclos" ON public.rh_ciclos_avaliacao FOR INSERT WITH CHECK (can_edit_rh());
CREATE POLICY "Gestores podem atualizar rh_ciclos" ON public.rh_ciclos_avaliacao FOR UPDATE USING (can_edit_rh());
CREATE POLICY "Master pode deletar rh_ciclos" ON public.rh_ciclos_avaliacao FOR DELETE USING (is_master());

-- RLS for rh_avaliacoes (users can fill their own)
CREATE POLICY "Todos autenticados podem ver rh_avaliacoes" ON public.rh_avaliacoes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Autenticados podem inserir rh_avaliacoes" ON public.rh_avaliacoes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Usuarios podem atualizar suas rh_avaliacoes" ON public.rh_avaliacoes FOR UPDATE USING (avaliador_id = auth.uid() OR can_edit_rh());
CREATE POLICY "Master pode deletar rh_avaliacoes" ON public.rh_avaliacoes FOR DELETE USING (is_master());

-- Triggers for updated_at
CREATE TRIGGER update_rh_colaboradores_updated_at BEFORE UPDATE ON public.rh_colaboradores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_en();
CREATE TRIGGER update_rh_avaliacoes_updated_at BEFORE UPDATE ON public.rh_avaliacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_en();
