
-- Enum for client status (shared by both modules)
CREATE TYPE public.client_status AS ENUM ('Ativo', 'Pausado', 'Cancelado', 'Trial');

-- Enum for payment status
CREATE TYPE public.payment_status AS ENUM ('Pago', 'Pendente', 'Atrasado');

-- Enum for marketplace billing model
CREATE TYPE public.billing_model AS ENUM ('percentual_faixas', 'fixo_percentual', 'somente_fixo');

-- ============================================
-- W3 TRÁFEGO PAGO — CLIENTES
-- ============================================
CREATE TABLE public.trafego_pago_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_ecommerce TEXT NOT NULL,
  site TEXT DEFAULT '',
  nicho TEXT DEFAULT '',
  faturamento_ao_entrar NUMERIC DEFAULT 0,
  data_entrada DATE DEFAULT CURRENT_DATE,
  dia_cobranca INTEGER DEFAULT 1,
  gestor_user_id UUID REFERENCES public.profiles(id),
  plataformas TEXT[] DEFAULT '{}',
  status client_status NOT NULL DEFAULT 'Ativo',
  tabela_precos TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  valor_mrr NUMERIC DEFAULT 0,
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trafego_pago_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver trafego_pago_clientes"
  ON public.trafego_pago_clientes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir trafego_pago_clientes"
  ON public.trafego_pago_clientes FOR INSERT
  WITH CHECK (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Gestores podem atualizar trafego_pago_clientes"
  ON public.trafego_pago_clientes FOR UPDATE
  USING (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Master pode deletar trafego_pago_clientes"
  ON public.trafego_pago_clientes FOR DELETE
  USING (is_master());

-- Trigger for atualizado_em
CREATE TRIGGER update_trafego_pago_clientes_updated_at
  BEFORE UPDATE ON public.trafego_pago_clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- W3 TRÁFEGO PAGO — REGISTROS MENSAIS
-- ============================================
CREATE TABLE public.trafego_pago_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.trafego_pago_clientes(id) ON DELETE CASCADE,
  mes_ano TEXT NOT NULL, -- format: 'YYYY-MM'
  investimento_gerenciado NUMERIC DEFAULT 0,
  valor_pago NUMERIC DEFAULT 0,
  status_pagamento payment_status NOT NULL DEFAULT 'Pendente',
  roas_entregue NUMERIC DEFAULT NULL,
  observacao TEXT DEFAULT '',
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, mes_ano)
);

ALTER TABLE public.trafego_pago_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver trafego_pago_registros"
  ON public.trafego_pago_registros FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir trafego_pago_registros"
  ON public.trafego_pago_registros FOR INSERT
  WITH CHECK (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Gestores podem atualizar trafego_pago_registros"
  ON public.trafego_pago_registros FOR UPDATE
  USING (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Master pode deletar trafego_pago_registros"
  ON public.trafego_pago_registros FOR DELETE
  USING (is_master());

CREATE TRIGGER update_trafego_pago_registros_updated_at
  BEFORE UPDATE ON public.trafego_pago_registros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- W3 MARKETPLACES — CLIENTES
-- ============================================
CREATE TABLE public.marketplace_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_ecommerce TEXT NOT NULL,
  site TEXT DEFAULT '',
  nicho TEXT DEFAULT '',
  faturamento_ao_entrar NUMERIC DEFAULT 0,
  data_entrada DATE DEFAULT CURRENT_DATE,
  dia_cobranca INTEGER DEFAULT 1,
  gestor_user_id UUID REFERENCES public.profiles(id),
  marketplaces TEXT[] DEFAULT '{}',
  status client_status NOT NULL DEFAULT 'Ativo',
  modelo_cobranca billing_model NOT NULL DEFAULT 'percentual_faixas',
  valor_fixo NUMERIC DEFAULT 0,
  faixas_percentual JSONB DEFAULT '[]',
  observacoes TEXT DEFAULT '',
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver marketplace_clientes"
  ON public.marketplace_clientes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir marketplace_clientes"
  ON public.marketplace_clientes FOR INSERT
  WITH CHECK (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Gestores podem atualizar marketplace_clientes"
  ON public.marketplace_clientes FOR UPDATE
  USING (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Master pode deletar marketplace_clientes"
  ON public.marketplace_clientes FOR DELETE
  USING (is_master());

CREATE TRIGGER update_marketplace_clientes_updated_at
  BEFORE UPDATE ON public.marketplace_clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- W3 MARKETPLACES — REGISTROS MENSAIS
-- ============================================
CREATE TABLE public.marketplace_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.marketplace_clientes(id) ON DELETE CASCADE,
  mes_ano TEXT NOT NULL, -- format: 'YYYY-MM'
  faturamento_informado NUMERIC DEFAULT 0,
  fixo_cobrado NUMERIC DEFAULT 0,
  percentual_aplicado NUMERIC DEFAULT 0,
  valor_variavel NUMERIC DEFAULT 0,
  total_a_receber NUMERIC DEFAULT 0,
  status_pagamento payment_status NOT NULL DEFAULT 'Pendente',
  observacao TEXT DEFAULT '',
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, mes_ano)
);

ALTER TABLE public.marketplace_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver marketplace_registros"
  ON public.marketplace_registros FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestores podem inserir marketplace_registros"
  ON public.marketplace_registros FOR INSERT
  WITH CHECK (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Gestores podem atualizar marketplace_registros"
  ON public.marketplace_registros FOR UPDATE
  USING (can_access_admin_panel() OR can_edit_vendas());

CREATE POLICY "Master pode deletar marketplace_registros"
  ON public.marketplace_registros FOR DELETE
  USING (is_master());

CREATE TRIGGER update_marketplace_registros_updated_at
  BEFORE UPDATE ON public.marketplace_registros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
