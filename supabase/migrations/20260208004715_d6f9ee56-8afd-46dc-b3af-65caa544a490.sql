-- Remover triggers e functions usando CASCADE
DROP FUNCTION IF EXISTS public.update_lead_status_on_call() CASCADE;
DROP FUNCTION IF EXISTS public.update_lead_status_on_venda() CASCADE;

-- Criar tabela de fechamentos diários
CREATE TABLE public.fechamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  closer_user_id UUID NOT NULL REFERENCES public.profiles(id),
  calls_realizadas INTEGER NOT NULL DEFAULT 0,
  no_show INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(data, closer_user_id)
);

-- Enable RLS
ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;

-- Todos podem ver fechamentos
CREATE POLICY "Todos podem ver fechamentos"
ON public.fechamentos
FOR SELECT
USING (true);

-- Closers podem inserir próprio fechamento
CREATE POLICY "Closers podem inserir próprio fechamento"
ON public.fechamentos
FOR INSERT
WITH CHECK (auth.uid() = closer_user_id);

-- Closers podem editar próprio fechamento
CREATE POLICY "Closers podem editar próprio fechamento"
ON public.fechamentos
FOR UPDATE
USING (auth.uid() = closer_user_id);

-- Trigger para atualizado_em
CREATE TRIGGER update_fechamentos_updated_at
BEFORE UPDATE ON public.fechamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Alterar tabela vendas - remover FK de leads, adicionar novos campos
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_lead_id_fkey;
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_lead_id_key;

-- Remover colunas antigas
ALTER TABLE public.vendas DROP COLUMN IF EXISTS lead_id;
ALTER TABLE public.vendas DROP COLUMN IF EXISTS plano_nome;
ALTER TABLE public.vendas DROP COLUMN IF EXISTS entrada_valor;
ALTER TABLE public.vendas DROP COLUMN IF EXISTS forma_pagamento;
ALTER TABLE public.vendas DROP COLUMN IF EXISTS detalhes_pagamento;
ALTER TABLE public.vendas DROP COLUMN IF EXISTS data_inicio;
ALTER TABLE public.vendas DROP COLUMN IF EXISTS data_fim;

-- Adicionar novos campos
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS nome_lead TEXT NOT NULL DEFAULT '';
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS nome_empresa TEXT NOT NULL DEFAULT '';
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS duracao_contrato_meses INTEGER NOT NULL DEFAULT 12;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor_pix NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor_cartao NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor_boleto_parcela NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS quantidade_parcelas_boleto INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS pago BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS contrato_assinado BOOLEAN NOT NULL DEFAULT false;

-- Dropar tabela de leads e calls (não mais necessárias)
DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;