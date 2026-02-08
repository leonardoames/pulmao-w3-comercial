
-- Corrigir search_path das funções
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_status_on_call()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Agendada' OR NEW.status = 'Remarcada' THEN
    UPDATE public.leads SET status_funil = 'CallAgendada' WHERE id = NEW.lead_id;
  ELSIF NEW.status = 'Realizada' THEN
    UPDATE public.leads SET status_funil = 'CallRealizada' WHERE id = NEW.lead_id;
  ELSIF NEW.status = 'No-show' THEN
    UPDATE public.leads SET status_funil = 'NoShow' WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_status_on_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads SET status_funil = 'Ganho' WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$;
