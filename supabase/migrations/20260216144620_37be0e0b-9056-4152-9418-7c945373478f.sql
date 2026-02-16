ALTER TABLE public.vendas
ADD COLUMN enviado_financeiro boolean NOT NULL DEFAULT false,
ADD COLUMN enviado_cs boolean NOT NULL DEFAULT false;