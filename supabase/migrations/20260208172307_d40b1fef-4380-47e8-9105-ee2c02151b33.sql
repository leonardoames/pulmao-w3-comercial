-- Adicionar foreign key para closer_user_id
ALTER TABLE public.ote_goals
ADD CONSTRAINT ote_goals_closer_user_id_fkey
FOREIGN KEY (closer_user_id) REFERENCES public.profiles(id);

-- Adicionar foreign key para created_by_user_id
ALTER TABLE public.ote_goals
ADD CONSTRAINT ote_goals_created_by_user_id_fkey
FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id);