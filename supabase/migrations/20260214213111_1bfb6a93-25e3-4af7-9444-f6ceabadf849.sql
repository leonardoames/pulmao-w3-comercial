
-- Enum for agent type
CREATE TYPE public.ai_agent_type AS ENUM ('caption', 'script');

-- Enum for request status
CREATE TYPE public.ai_request_status AS ENUM ('draft', 'processing', 'done', 'error');

-- Enum for output type
CREATE TYPE public.ai_output_type AS ENUM ('caption', 'script', 'variations');

-- Enum for platform
CREATE TYPE public.ai_platform AS ENUM ('instagram', 'tiktok', 'youtube');

-- Table: ai_agents
CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type ai_agent_type NOT NULL,
  prompt_base TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver agentes ativos"
  ON public.ai_agents FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Master pode gerenciar agentes"
  ON public.ai_agents FOR ALL
  USING (public.is_master());

-- Table: ai_requests
CREATE TABLE public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id),
  user_id UUID NOT NULL,
  platform ai_platform NOT NULL DEFAULT 'instagram',
  format TEXT,
  inputs_json JSONB NOT NULL DEFAULT '{}',
  status ai_request_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

-- Users see their own, admins see all
CREATE POLICY "Usuarios veem seus requests"
  ON public.ai_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
    )
  );

CREATE POLICY "Usuarios podem criar requests"
  ON public.ai_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem atualizar seus requests"
  ON public.ai_requests FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
    )
  );

-- Table: ai_outputs
CREATE TABLE public.ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.ai_requests(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  output_type ai_output_type NOT NULL,
  output_text TEXT NOT NULL DEFAULT '',
  meta_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem outputs dos seus requests"
  ON public.ai_outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_requests r
      WHERE r.id = request_id
        AND (r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('MASTER', 'DIRETORIA', 'GESTOR_COMERCIAL')
          ))
    )
  );

CREATE POLICY "Sistema pode inserir outputs"
  ON public.ai_outputs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at on ai_requests
CREATE TRIGGER update_ai_requests_updated_at
  BEFORE UPDATE ON public.ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: 2 initial agents
INSERT INTO public.ai_agents (name, type, prompt_base) VALUES
(
  'Legendas W3',
  'caption',
  E'Você é um copywriter especialista em redes sociais para a empresa W3.\n\nREGRAS:\n- Gere EXATAMENTE 3 versões: CURTA (até 150 chars), MÉDIA (150-300 chars) e LONGA (300-500 chars)\n- Use quebras de linha estratégicas para legibilidade\n- Emojis com moderação (máx 3-4 por versão)\n- Linguagem direta, estilo empreendedor, sem enrolação\n- Cada versão DEVE terminar com CTA (salvar/compartilhar/comentar)\n- Adapte o tom conforme solicitado\n- NÃO use palavras proibidas listadas\n\nFORMATO DE SAÍDA (JSON):\n{\n  "curta": "texto...",\n  "media": "texto...",\n  "longa": "texto..."\n}'
),
(
  'Roteiros W3',
  'script',
  E'Você é um roteirista especialista em vídeos curtos (Reels/TikTok/Shorts) para a empresa W3.\n\nREGRAS:\n- Estrutura obrigatória: GANCHO (2-3s) → CONTEXTO → 3 PONTOS PRINCIPAIS → CTA\n- Inclua sugestões de TEXTO NA TELA (overlay) para cada trecho\n- Linguagem direta, provocativa, estilo empreendedor\n- Adapte a duração conforme solicitado\n- NÃO use palavras proibidas listadas\n\nFORMATO DE SAÍDA (JSON):\n{\n  "gancho": {"fala": "...", "overlay": "..."},\n  "contexto": {"fala": "...", "overlay": "..."},\n  "pontos": [\n    {"fala": "...", "overlay": "..."},\n    {"fala": "...", "overlay": "..."},\n    {"fala": "...", "overlay": "..."}\n  ],\n  "cta": {"fala": "...", "overlay": "..."},\n  "duracao_estimada": "XXs"\n}'
);
