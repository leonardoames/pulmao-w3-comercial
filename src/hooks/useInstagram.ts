import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InstagramDailyMetric {
  id: string;
  account_id: string;
  date: string;
  followers_count: number;
  media_count: number;
  reach: number;
  profile_views: number;
  synced_at: string;
  instagram_accounts: {
    username: string;
    account_label: string;
  };
}

export interface InstagramPostInsight {
  id: string;
  account_id: string;
  instagram_media_id: string;
  media_type: string;
  permalink: string | null;
  caption: string | null;
  published_at: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  views: number;
  profile_visits: number;
  synced_at: string;
  instagram_accounts: {
    username: string;
    account_label: string;
  };
}

export function useInstagramDailyMetrics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['instagram-daily-metrics', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('instagram_daily_metrics')
        .select('*, instagram_accounts(username, account_label)')
        .order('date', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as InstagramDailyMetric[];
    },
  });
}

export function useInstagramPostInsights(accountId?: string, limit = 30) {
  return useQuery({
    queryKey: ['instagram-post-insights', accountId, limit],
    queryFn: async () => {
      let query = supabase
        .from('instagram_post_insights')
        .select('*, instagram_accounts(username, account_label)')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (accountId) query = query.eq('account_id', accountId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as InstagramPostInsight[];
    },
  });
}

export function useLatestFollowersCount() {
  return useQuery({
    queryKey: ['instagram-latest-followers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_daily_metrics')
        .select('followers_count, date, instagram_accounts(account_label)')
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const leo = (data ?? []).find(
        (d) => (d.instagram_accounts as any)?.account_label === 'Leo'
      );
      const w3 = (data ?? []).find(
        (d) => (d.instagram_accounts as any)?.account_label === 'W3'
      );

      return {
        leo: leo?.followers_count ?? 0,
        w3: w3?.followers_count ?? 0,
      };
    },
  });
}

export function useInstagramSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('instagram-sync');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-daily-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-post-insights'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-latest-followers'] });
      toast.success(
        data?.posts_synced !== undefined
          ? `Instagram sincronizado! ${data.posts_synced} posts atualizados.`
          : data?.message ?? 'Sincronização concluída.'
      );
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao sincronizar Instagram');
    },
  });
}
