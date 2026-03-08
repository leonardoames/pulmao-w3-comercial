-- Add 'Reembolsado' to venda_status enum
ALTER TYPE public.venda_status ADD VALUE IF NOT EXISTS 'Reembolsado';

-- Add refund audit columns to vendas
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS motivo_reembolso text,
  ADD COLUMN IF NOT EXISTS reembolsado_por uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reembolsado_em timestamptz;

-- Allow MASTER to delete vendas
CREATE POLICY "MASTER pode deletar vendas"
  ON public.vendas
  FOR DELETE
  TO authenticated
  USING (is_master());