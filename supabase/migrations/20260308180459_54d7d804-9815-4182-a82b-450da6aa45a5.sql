
-- Adiciona coluna origem_lead na tabela vendas como text nullable
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS origem_lead text;

-- Comentário para documentação
COMMENT ON COLUMN public.vendas.origem_lead IS 'Origem do lead: como o contato chegou até a equipe comercial. Valores: Tráfego Pago, Formulário Direto, Bio, SDR, Social Selling';
