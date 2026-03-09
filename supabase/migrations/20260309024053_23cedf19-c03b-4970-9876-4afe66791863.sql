
-- Security definer function for admin access
CREATE OR REPLACE FUNCTION public.can_edit_administrativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('MASTER', 'ADMINISTRATIVO')
  )
$$;

-- ===================== ALMOXARIFADO =====================

CREATE TABLE public.almoxarifado_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'Outros',
  unidade_medida text NOT NULL DEFAULT 'Unidade',
  quantidade_atual integer NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  estoque_maximo integer NOT NULL DEFAULT 0,
  ultimo_preco numeric NOT NULL DEFAULT 0,
  fornecedor_habitual text DEFAULT '',
  observacoes text DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.almoxarifado_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver almoxarifado_itens"
  ON public.almoxarifado_itens FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir almoxarifado_itens"
  ON public.almoxarifado_itens FOR INSERT WITH CHECK (can_edit_administrativo());

CREATE POLICY "Admins podem atualizar almoxarifado_itens"
  ON public.almoxarifado_itens FOR UPDATE USING (can_edit_administrativo());

CREATE POLICY "Master pode deletar almoxarifado_itens"
  ON public.almoxarifado_itens FOR DELETE USING (is_master());

CREATE TABLE public.almoxarifado_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.almoxarifado_itens(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('Entrada', 'Saida')),
  quantidade integer NOT NULL,
  valor_unitario numeric DEFAULT 0,
  data_movimentacao date NOT NULL DEFAULT CURRENT_DATE,
  observacao text DEFAULT '',
  responsavel_user_id uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.almoxarifado_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver almoxarifado_movimentacoes"
  ON public.almoxarifado_movimentacoes FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir almoxarifado_movimentacoes"
  ON public.almoxarifado_movimentacoes FOR INSERT WITH CHECK (can_edit_administrativo());

-- ===================== PATRIMÔNIO =====================

CREATE TABLE public.patrimonio_ambientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patrimonio_ambientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver patrimonio_ambientes"
  ON public.patrimonio_ambientes FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir patrimonio_ambientes"
  ON public.patrimonio_ambientes FOR INSERT WITH CHECK (can_edit_administrativo());

CREATE POLICY "Admins podem atualizar patrimonio_ambientes"
  ON public.patrimonio_ambientes FOR UPDATE USING (can_edit_administrativo());

CREATE POLICY "Master pode deletar patrimonio_ambientes"
  ON public.patrimonio_ambientes FOR DELETE USING (is_master());

CREATE SEQUENCE IF NOT EXISTS public.patrimonio_tombamento_seq START 1;

CREATE TABLE public.patrimonio_bens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tombamento text NOT NULL UNIQUE,
  descricao text NOT NULL,
  categoria text NOT NULL DEFAULT 'Outros',
  numero_serie text DEFAULT '',
  marca_modelo text DEFAULT '',
  data_aquisicao date NOT NULL DEFAULT CURRENT_DATE,
  valor_compra numeric NOT NULL DEFAULT 0,
  fornecedor text DEFAULT '',
  nota_fiscal text DEFAULT '',
  vida_util_anos integer NOT NULL DEFAULT 5,
  valor_residual_pct numeric NOT NULL DEFAULT 10,
  depreciacao_anual numeric NOT NULL DEFAULT 0,
  ambiente_id uuid REFERENCES public.patrimonio_ambientes(id),
  responsavel_user_id uuid,
  estado_conservacao text NOT NULL DEFAULT 'Bom',
  foto_url text DEFAULT '',
  observacoes_manutencao text DEFAULT '',
  status text NOT NULL DEFAULT 'Ativo',
  criado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patrimonio_bens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver patrimonio_bens"
  ON public.patrimonio_bens FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir patrimonio_bens"
  ON public.patrimonio_bens FOR INSERT WITH CHECK (can_edit_administrativo());

CREATE POLICY "Admins podem atualizar patrimonio_bens"
  ON public.patrimonio_bens FOR UPDATE USING (can_edit_administrativo());

CREATE POLICY "Master pode deletar patrimonio_bens"
  ON public.patrimonio_bens FOR DELETE USING (is_master());

CREATE OR REPLACE FUNCTION public.generate_tombamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.tombamento IS NULL OR NEW.tombamento = '' THEN
    NEW.tombamento := 'W3-' || LPAD(nextval('patrimonio_tombamento_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_tombamento
  BEFORE INSERT ON public.patrimonio_bens
  FOR EACH ROW EXECUTE FUNCTION public.generate_tombamento();

CREATE TABLE public.patrimonio_transferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id uuid NOT NULL REFERENCES public.patrimonio_bens(id) ON DELETE CASCADE,
  de_responsavel_user_id uuid,
  para_responsavel_user_id uuid,
  de_ambiente_id uuid REFERENCES public.patrimonio_ambientes(id),
  para_ambiente_id uuid REFERENCES public.patrimonio_ambientes(id),
  data_transferencia date NOT NULL DEFAULT CURRENT_DATE,
  transferido_por uuid NOT NULL,
  observacao text DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patrimonio_transferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver patrimonio_transferencias"
  ON public.patrimonio_transferencias FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir patrimonio_transferencias"
  ON public.patrimonio_transferencias FOR INSERT WITH CHECK (can_edit_administrativo());

CREATE TABLE public.patrimonio_manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id uuid NOT NULL REFERENCES public.patrimonio_bens(id) ON DELETE CASCADE,
  descricao text NOT NULL DEFAULT '',
  data_manutencao date NOT NULL DEFAULT CURRENT_DATE,
  registrado_por uuid NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patrimonio_manutencoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver patrimonio_manutencoes"
  ON public.patrimonio_manutencoes FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem inserir patrimonio_manutencoes"
  ON public.patrimonio_manutencoes FOR INSERT WITH CHECK (can_edit_administrativo());

-- Storage bucket for patrimonio photos
INSERT INTO storage.buckets (id, name, public) VALUES ('patrimonio', 'patrimonio', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Admins podem fazer upload patrimonio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patrimonio' AND auth.uid() IS NOT NULL);

CREATE POLICY "Todos podem ver fotos patrimonio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patrimonio');

-- Insert default ambientes
INSERT INTO public.patrimonio_ambientes (nome, descricao) VALUES
  ('Recepção', 'Área de recepção'),
  ('Sala de Reunião', 'Sala de reuniões'),
  ('Escritório Principal', 'Escritório principal'),
  ('Copa', 'Copa e cozinha'),
  ('Banheiro', 'Banheiros'),
  ('Depósito', 'Depósito e almoxarifado');
