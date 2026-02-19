import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateFilter, DateRange, getDateRange } from '@/hooks/useDashboard';

export interface FacebookAdsData {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  conversions: number;
}

export type FacebookAdsResult =
  | { status: 'ok'; data: FacebookAdsData }
  | { status: 'not_configured' }
  | { status: 'token_expired' }
  | { status: 'error'; message: string };

export function useFacebookAdsInsights(filter: DateFilter, customRange?: DateRange) {
  const { start, end } = getDateRange(filter, customRange);
  const dateStart = start.toISOString().split('T')[0];
  const dateEnd = end.toISOString().split('T')[0];

  return useQuery<FacebookAdsResult>({
    queryKey: ['facebook-ads-insights', dateStart, dateEnd],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('facebook-ads-insights', {
        body: { date_start: dateStart, date_end: dateEnd },
      });

      if (error) {
        return { status: 'error', message: error.message };
      }

      if (data.error === 'not_configured') return { status: 'not_configured' };
      if (data.error === 'token_expired') return { status: 'token_expired' };
      if (data.error) return { status: 'error', message: data.message || data.error };

      return { status: 'ok', data: data as FacebookAdsData };
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
