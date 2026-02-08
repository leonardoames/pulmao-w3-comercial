-- Permitir INSERT em vendas para roles que podem editar
CREATE POLICY "Usuários autorizados podem inserir vendas" 
ON public.vendas 
FOR INSERT 
TO authenticated
WITH CHECK (public.can_edit_vendas());

-- Permitir UPDATE em vendas para roles que podem editar
CREATE POLICY "Usuários autorizados podem atualizar vendas" 
ON public.vendas 
FOR UPDATE 
TO authenticated
USING (public.can_edit_vendas());

-- Permitir INSERT em fechamentos para roles que podem editar (próprio ou qualquer)
CREATE POLICY "Usuários podem inserir fechamentos" 
ON public.fechamentos 
FOR INSERT 
TO authenticated
WITH CHECK (
    -- Closers só podem inserir para si mesmos
    (public.is_closer() AND closer_user_id = auth.uid())
    OR
    -- Gestores podem inserir para qualquer closer
    public.can_edit_any_fechamento()
);

-- Permitir UPDATE em fechamentos para roles que podem editar
CREATE POLICY "Usuários podem atualizar fechamentos" 
ON public.fechamentos 
FOR UPDATE 
TO authenticated
USING (
    (public.is_closer() AND closer_user_id = auth.uid())
    OR
    public.can_edit_any_fechamento()
);