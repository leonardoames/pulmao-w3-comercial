import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContentDailyLog, ContentPostItem, getDailyTemplate } from '@/types/content';
import { format } from 'date-fns';

// ─── Daily Logs ────────────────────────────────────────────────

export function useContentDailyLogs(startDate?: string, endDate?: string, responsibleName?: string) {
  return useQuery({
    queryKey: ['content-daily-logs', startDate, endDate, responsibleName],
    queryFn: async () => {
      let query = (supabase as any).from('content_daily_logs').select('*');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      if (responsibleName) query = query.eq('responsible_name', responsibleName);
      query = query.order('date', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentDailyLog[];
    },
  });
}

export function useUpsertContentDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<ContentDailyLog> & { date: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Não autenticado');

      const { data: existing } = await (supabase as any)
        .from('content_daily_logs')
        .select('id')
        .eq('date', log.date)
        .maybeSingle();

      const payload = {
        ...log,
        responsible_user_id: log.responsible_user_id || user.user.id,
      };

      if (existing) {
        const { error } = await (supabase as any)
          .from('content_daily_logs')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('content_daily_logs')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-daily-logs'] });
    },
  });
}

export function useDeleteContentDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      // Delete post items for this date first
      await (supabase as any)
        .from('content_post_items')
        .delete()
        .eq('date', date);
      // Delete the log
      const { error } = await (supabase as any)
        .from('content_daily_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-daily-logs'] });
      qc.invalidateQueries({ queryKey: ['content-post-items'] });
    },
  });
}

// ─── Post Items ────────────────────────────────────────────────

export function useContentPostItems(date?: string) {
  return useQuery({
    queryKey: ['content-post-items', date],
    queryFn: async () => {
      if (!date) return [];
      const { data, error } = await (supabase as any)
        .from('content_post_items')
        .select('*')
        .eq('date', date)
        .order('is_required', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ContentPostItem[];
    },
    enabled: !!date,
  });
}

export function useReplaceContentPostItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, items }: { date: string; items: Omit<ContentPostItem, 'id' | 'created_at' | 'updated_at'>[] }) => {
      // Delete existing items for the date
      await (supabase as any)
        .from('content_post_items')
        .delete()
        .eq('date', date);
      // Insert new items
      if (items.length > 0) {
        const { error } = await (supabase as any)
          .from('content_post_items')
          .insert(items);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-post-items'] });
    },
  });
}

export function useCreateContentPostItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<ContentPostItem> & { date: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Não autenticado');
      const { error } = await (supabase as any)
        .from('content_post_items')
        .insert({ ...item, created_by: user.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-post-items'] });
    },
  });
}

export function useUpdateContentPostItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentPostItem> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('content_post_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-post-items'] });
    },
  });
}

export function useDeleteContentPostItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('content_post_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-post-items'] });
    },
  });
}

export function useAutoGenerateRequiredItems() {
  const createItem = useCreateContentPostItem();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ date }: { date: string }) => {
      const { data: existing } = await (supabase as any)
        .from('content_post_items')
        .select('id')
        .eq('date', date)
        .eq('is_required', true)
        .limit(1);

      if (existing && existing.length > 0) return;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Não autenticado');

      const template = getDailyTemplate();
      const items = template.map(t => ({
        date,
        type: t.type,
        label: t.label,
        platform: t.platform,
        status: 'pendente',
        is_required: true,
        created_by: user.user!.id,
      }));

      const { error } = await (supabase as any)
        .from('content_post_items')
        .insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-post-items'] });
    },
  });
}
