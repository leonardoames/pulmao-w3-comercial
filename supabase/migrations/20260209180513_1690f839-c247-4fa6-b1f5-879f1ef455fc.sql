
-- Add CHECK constraints for data integrity on vendas
ALTER TABLE public.vendas ADD CONSTRAINT vendas_valor_pix_positive CHECK (valor_pix >= 0);
ALTER TABLE public.vendas ADD CONSTRAINT vendas_valor_cartao_positive CHECK (valor_cartao >= 0);
ALTER TABLE public.vendas ADD CONSTRAINT vendas_valor_boleto_positive CHECK (valor_boleto_parcela >= 0);
ALTER TABLE public.vendas ADD CONSTRAINT vendas_valor_total_positive CHECK (valor_total >= 0);
ALTER TABLE public.vendas ADD CONSTRAINT vendas_parcelas_positive CHECK (quantidade_parcelas_boleto >= 0);
ALTER TABLE public.vendas ADD CONSTRAINT vendas_duracao_positive CHECK (duracao_contrato_meses >= 1);

-- Add CHECK constraints for fechamentos
ALTER TABLE public.fechamentos ADD CONSTRAINT fechamentos_calls_positive CHECK (calls_realizadas >= 0);
ALTER TABLE public.fechamentos ADD CONSTRAINT fechamentos_noshow_positive CHECK (no_show >= 0);
