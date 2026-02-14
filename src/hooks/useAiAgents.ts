import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AiAgent {
  id: string;
  name: string;
  type: 'caption' | 'script';
  prompt_base: string;
  is_active: boolean;
  created_at: string;
}

export interface AiRequest {
  id: string;
  agent_id: string;
  user_id: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  format: string | null;
  inputs_json: Record<string, any>;
  status: 'draft' | 'processing' | 'done' | 'error';
  created_at: string;
  updated_at: string;
  ai_agents?: AiAgent;
}

export interface AiOutput {
  id: string;
  request_id: string;
  version: number;
  output_type: 'caption' | 'script' | 'variations';
  output_text: string;
  meta_json: Record<string, any>;
  created_at: string;
}

export function useAiAgents() {
  return useQuery({
    queryKey: ['ai-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as AiAgent[];
    },
  });
}

export function useAiRequests() {
  return useQuery({
    queryKey: ['ai-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_requests')
        .select('*, ai_agents(name, type)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AiRequest[];
    },
  });
}

export function useAiRequest(id?: string) {
  return useQuery({
    queryKey: ['ai-request', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('ai_requests')
        .select('*, ai_agents(name, type, prompt_base)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as AiRequest;
    },
    enabled: !!id,
  });
}

export function useAiOutputs(requestId?: string) {
  return useQuery({
    queryKey: ['ai-outputs', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const { data, error } = await supabase
        .from('ai_outputs')
        .select('*')
        .eq('request_id', requestId)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as AiOutput[];
    },
    enabled: !!requestId,
  });
}

export function useCreateAiRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      agent_id: string;
      platform: string;
      format?: string;
      inputs_json: Record<string, any>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await supabase
        .from('ai_requests')
        .insert({
          agent_id: data.agent_id,
          user_id: user.id,
          platform: data.platform as any,
          format: data.format || null,
          inputs_json: data.inputs_json,
          status: 'draft' as any,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-requests'] });
    },
    onError: (err) => {
      console.error('Error creating request:', err);
      toast.error('Erro ao criar solicitação');
    },
  });
}

export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      agent_id: string;
      request_id: string;
      inputs_json: Record<string, any>;
    }) => {
      const { data: result, error } = await supabase.functions.invoke('generate-content', {
        body: data,
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result as { output_text: string; version: number };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-outputs', variables.request_id] });
      queryClient.invalidateQueries({ queryKey: ['ai-request', variables.request_id] });
      queryClient.invalidateQueries({ queryKey: ['ai-requests'] });
      toast.success('Conteúdo gerado com sucesso!');
    },
    onError: (err: Error) => {
      console.error('Error generating content:', err);
      if (err.message.includes('Limite')) {
        toast.error(err.message);
      } else if (err.message.includes('Créditos')) {
        toast.error(err.message);
      } else {
        toast.error('Erro ao gerar conteúdo. Tente novamente.');
      }
    },
  });
}

export function useDuplicateRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: original, error: fetchErr } = await supabase
        .from('ai_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      if (fetchErr || !original) throw fetchErr || new Error('Not found');

      const { data: result, error } = await supabase
        .from('ai_requests')
        .insert({
          agent_id: original.agent_id,
          user_id: user.id,
          platform: original.platform,
          format: original.format,
          inputs_json: original.inputs_json,
          status: 'draft' as any,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-requests'] });
      toast.success('Solicitação duplicada!');
    },
  });
}
