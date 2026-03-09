-- Partial unique index on email (NULLs allowed, duplicates not)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_colaboradores_email
  ON public.rh_colaboradores(email)
  WHERE email IS NOT NULL;

-- Partial unique index on closer_id (NULLs allowed, one closer = one colaborador)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_colaboradores_closer_id
  ON public.rh_colaboradores(closer_id)
  WHERE closer_id IS NOT NULL;

-- Comment documenting intent
COMMENT ON TABLE public.rh_colaboradores IS
  'Colaboradores da W3. email e closer_id são únicos quando preenchidos (índices parciais).';
