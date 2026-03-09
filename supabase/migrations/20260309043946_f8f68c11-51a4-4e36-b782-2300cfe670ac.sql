
CREATE TABLE public.rh_organograma_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.rh_colaboradores(id) ON DELETE CASCADE,
  node_position_x decimal NOT NULL DEFAULT 0,
  node_position_y decimal NOT NULL DEFAULT 0,
  layout_mode text NOT NULL DEFAULT 'hierarquia',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(colaborador_id, layout_mode)
);

ALTER TABLE public.rh_organograma_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read org positions"
  ON public.rh_organograma_positions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage org positions"
  ON public.rh_organograma_positions FOR ALL
  TO authenticated USING (public.can_edit_rh())
  WITH CHECK (public.can_edit_rh());
