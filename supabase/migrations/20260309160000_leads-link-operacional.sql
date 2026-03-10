-- Fase 1: Adicionar lead_id e cnpj nas tabelas operacionais
-- para criar integridade referencial com a Base Leads W3

-- Tráfego Pago
ALTER TABLE public.trafego_pago_clientes
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads_w3(id) ON DELETE SET NULL;

-- Marketplace
ALTER TABLE public.marketplace_clientes
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads_w3(id) ON DELETE SET NULL;
