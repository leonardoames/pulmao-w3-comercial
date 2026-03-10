-- Add CNPJ to leads_w3 with unique partial index
ALTER TABLE public.leads_w3
  ADD COLUMN IF NOT EXISTS cnpj text;

CREATE UNIQUE INDEX uq_leads_w3_cnpj
  ON public.leads_w3(cnpj)
  WHERE cnpj IS NOT NULL;

-- Rename status to status_educacao (was always educação-specific)
ALTER TABLE public.leads_w3
  RENAME COLUMN status TO status_educacao;
