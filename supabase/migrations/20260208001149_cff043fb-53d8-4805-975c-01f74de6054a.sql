
-- Enums
CREATE TYPE public.user_role AS ENUM ('CEO', 'Founder', 'GestorComercial', 'Closer', 'SDR', 'CS', 'Mentor', 'Financeiro', 'Marketing');
CREATE TYPE public.user_area AS ENUM ('Comercial', 'CS', 'Financeiro', 'Marketing', 'Diretoria');
CREATE TYPE public.lead_origem AS ENUM ('Formulario', 'Instagram', 'WhatsApp', 'Indicacao', 'TrafegoPago');
CREATE TYPE public.lead_status_funil AS ENUM ('Novo', 'ContatoFeito', 'CallAgendada', 'CallRealizada', 'NoShow', 'Perdido', 'Ganho');
CREATE TYPE public.call_plataforma AS ENUM ('GoogleMeet', 'Zoom', 'Outro');
CREATE TYPE public.call_status AS ENUM ('Agendada', 'Realizada', 'No-show', 'Remarcada', 'Cancelada');
CREATE TYPE public.venda_forma_pagamento AS ENUM ('Pix', 'Cartao', 'Boleto');
CREATE TYPE public.venda_status AS ENUM ('Ativo', 'Congelado', 'Cancelado', 'Finalizado');

-- Tabela de perfis/usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'SDR',
  area user_area NOT NULL DEFAULT 'Comercial',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_pessoa TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  instagram TEXT,
  nome_empresa TEXT NOT NULL,
  cnpj TEXT,
  cidade TEXT,
  estado TEXT,
  origem lead_origem NOT NULL DEFAULT 'Formulario',
  closer_responsavel_user_id UUID REFERENCES public.profiles(id),
  sdr_responsavel_user_id UUID REFERENCES public.profiles(id),
  status_funil lead_status_funil NOT NULL DEFAULT 'Novo',
  motivo_perda TEXT,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_por UUID REFERENCES public.profiles(id)
);

-- Tabela de calls
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  plataforma call_plataforma NOT NULL DEFAULT 'GoogleMeet',
  link_reuniao TEXT,
  status call_status NOT NULL DEFAULT 'Agendada',
  closer_user_id UUID NOT NULL REFERENCES public.profiles(id),
  sdr_user_id UUID REFERENCES public.profiles(id),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_por UUID REFERENCES public.profiles(id)
);

-- Tabela de vendas (1 por lead)
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  closer_user_id UUID NOT NULL REFERENCES public.profiles(id),
  data_fechamento DATE NOT NULL DEFAULT CURRENT_DATE,
  plano_nome TEXT NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL,
  entrada_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  forma_pagamento venda_forma_pagamento NOT NULL DEFAULT 'Pix',
  detalhes_pagamento TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status venda_status NOT NULL DEFAULT 'Ativo',
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_por UUID REFERENCES public.profiles(id)
);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizado_em
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar status do lead quando call é criada/atualizada
CREATE OR REPLACE FUNCTION public.update_lead_status_on_call()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Agendada' OR NEW.status = 'Remarcada' THEN
    UPDATE public.leads SET status_funil = 'CallAgendada' WHERE id = NEW.lead_id;
  ELSIF NEW.status = 'Realizada' THEN
    UPDATE public.leads SET status_funil = 'CallRealizada' WHERE id = NEW.lead_id;
  ELSIF NEW.status = 'No-show' THEN
    UPDATE public.leads SET status_funil = 'NoShow' WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_call_status_change AFTER INSERT OR UPDATE ON public.calls FOR EACH ROW EXECUTE FUNCTION public.update_lead_status_on_call();

-- Função para atualizar status do lead quando venda é criada
CREATE OR REPLACE FUNCTION public.update_lead_status_on_venda()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads SET status_funil = 'Ganho' WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_venda_insert AFTER INSERT ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_lead_status_on_venda();

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: todos podem ver, apenas admins podem editar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver perfis" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Usuários podem editar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Função helper para verificar permissão de edição comercial
CREATE OR REPLACE FUNCTION public.can_edit_comercial()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_area public.user_area;
  v_role public.user_role;
BEGIN
  SELECT area, role INTO v_area, v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_area = 'Comercial' OR v_role IN ('CEO', 'Founder');
END;
$$;

-- Leads: todos podem ver, comercial/CEO/Founder podem editar
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver leads" ON public.leads FOR SELECT USING (true);

CREATE POLICY "Comercial pode inserir leads" ON public.leads FOR INSERT WITH CHECK (public.can_edit_comercial());

CREATE POLICY "Comercial pode atualizar leads" ON public.leads FOR UPDATE USING (public.can_edit_comercial());

CREATE POLICY "Comercial pode deletar leads" ON public.leads FOR DELETE USING (public.can_edit_comercial());

-- Calls: todos podem ver, comercial/CEO/Founder podem editar
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver calls" ON public.calls FOR SELECT USING (true);

CREATE POLICY "Comercial pode inserir calls" ON public.calls FOR INSERT WITH CHECK (public.can_edit_comercial());

CREATE POLICY "Comercial pode atualizar calls" ON public.calls FOR UPDATE USING (public.can_edit_comercial());

CREATE POLICY "Comercial pode deletar calls" ON public.calls FOR DELETE USING (public.can_edit_comercial());

-- Vendas: todos podem ver, comercial/CEO/Founder podem editar
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver vendas" ON public.vendas FOR SELECT USING (true);

CREATE POLICY "Comercial pode inserir vendas" ON public.vendas FOR INSERT WITH CHECK (public.can_edit_comercial());

CREATE POLICY "Comercial pode atualizar vendas" ON public.vendas FOR UPDATE USING (public.can_edit_comercial());

CREATE POLICY "Comercial pode deletar vendas" ON public.vendas FOR DELETE USING (public.can_edit_comercial());
