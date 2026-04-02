import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, parse, eachDayOfInterval, isWeekend, format } from 'date-fns';
import { SOCIAL_SELLING_GOALS } from '@/hooks/useSocialSelling';

function getWorkingDays(monthRef: string): number {
  const start = parse(monthRef + '-01', 'yyyy-MM-dd', new Date());
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length;
}

function getTotalDays(monthRef: string): number {
  const start = parse(monthRef + '-01', 'yyyy-MM-dd', new Date());
  return endOfMonth(start).getDate();
}

export function useRelatorioDiario(monthRef: string) {
  const startDate = monthRef + '-01';
  const end = endOfMonth(parse(startDate, 'yyyy-MM-dd', new Date()));
  const endDate = format(end, 'yyyy-MM-dd');
  const workingDays = getWorkingDays(monthRef);
  const totalDays = getTotalDays(monthRef);

  const socialSelling = useQuery({
    queryKey: ['relatorio-social-selling', monthRef],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_selling')
        .select('conversas_iniciadas, convites_enviados, formularios_preenchidos, agendamentos')
        .gte('data', startDate)
        .lte('data', endDate);
      if (error) throw error;
      const agg = (data || []).reduce(
        (acc, r) => ({
          conversas: acc.conversas + (r.conversas_iniciadas || 0),
          convites: acc.convites + (r.convites_enviados || 0),
          formularios: acc.formularios + (r.formularios_preenchidos || 0),
          agendamentos: acc.agendamentos + (r.agendamentos || 0),
        }),
        { conversas: 0, convites: 0, formularios: 0, agendamentos: 0 }
      );
      return agg;
    },
  });

  const conteudo = useQuery({
    queryKey: ['relatorio-conteudo', monthRef],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_daily_logs')
        .select('posts_published_count, stories_done_count, youtube_videos_published_count, followers_leo, followers_w3, date')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      if (error) throw error;
      const rows = data || [];
      const agg = rows.reduce(
        (acc: any, r: any) => ({
          posts: acc.posts + (r.posts_published_count || 0),
          stories: acc.stories + (r.stories_done_count || 0),
          youtube: acc.youtube + (r.youtube_videos_published_count || 0),
        }),
        { posts: 0, stories: 0, youtube: 0 }
      );
      const latest = rows[0];
      return {
        ...agg,
        followersLeo: latest?.followers_leo || 0,
        followersW3: latest?.followers_w3 || 0,
      };
    },
  });

  const comercial = useQuery({
    queryKey: ['relatorio-comercial', monthRef],
    queryFn: async () => {
      const [vendasRes, fechamentosRes] = await Promise.all([
        supabase
          .from('vendas')
          .select('valor_total, id')
          .gte('data_fechamento', startDate)
          .lte('data_fechamento', endDate)
          .in('status', ['Ativo', 'Reembolsado']),
        supabase
          .from('fechamentos')
          .select('calls_realizadas, no_show')
          .gte('data', startDate)
          .lte('data', endDate),
      ]);
      if (vendasRes.error) throw vendasRes.error;
      if (fechamentosRes.error) throw fechamentosRes.error;

      const vendas = vendasRes.data || [];
      const fechamentos = fechamentosRes.data || [];

      const faturamento = vendas.reduce((s, v) => s + Number(v.valor_total || 0), 0);
      const totalVendas = vendas.length;
      const calls = fechamentos.reduce((s, f) => s + (f.calls_realizadas || 0), 0);
      const noShow = fechamentos.reduce((s, f) => s + (f.no_show || 0), 0);

      return { faturamento, totalVendas, calls, noShow };
    },
  });

  const metaFaturamento = useQuery({
    queryKey: ['relatorio-meta-fat', monthRef],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_faturamento' as any)
        .select('valor')
        .eq('month_ref', monthRef)
        .maybeSingle();
      if (error) throw error;
      return data ? Number((data as any).valor) : 500000;
    },
  });

  const isLoading =
    socialSelling.isLoading || conteudo.isLoading || comercial.isLoading || metaFaturamento.isLoading;

  const ss = socialSelling.data || { conversas: 0, convites: 0, formularios: 0, agendamentos: 0 };
  const ct = conteudo.data || { posts: 0, stories: 0, youtube: 0, followersLeo: 0, followersW3: 0 };
  const cm = comercial.data || { faturamento: 0, totalVendas: 0, calls: 0, noShow: 0 };
  const metaFat = metaFaturamento.data || 500000;

  const taxaConversaoSS = ss.conversas > 0 ? ((ss.agendamentos / ss.conversas) * 100) : 0;
  const taxaConversaoCom = cm.calls > 0 ? ((cm.totalVendas / cm.calls) * 100) : 0;

  return {
    isLoading,
    monthRef,
    socialSelling: {
      metrics: [
        { label: 'Conversas Iniciadas', value: ss.conversas, goal: SOCIAL_SELLING_GOALS.conversas_iniciadas * workingDays },
        { label: 'Convites Enviados', value: ss.convites, goal: SOCIAL_SELLING_GOALS.convites_enviados * workingDays },
        { label: 'Formulários Preenchidos', value: ss.formularios, goal: SOCIAL_SELLING_GOALS.formularios_preenchidos * workingDays },
        { label: 'Agendamentos', value: ss.agendamentos, goal: SOCIAL_SELLING_GOALS.agendamentos * workingDays },
        { label: 'Taxa de Conversão', value: `${taxaConversaoSS.toFixed(1)}%`, goal: 100, isPercentage: true },
      ],
    },
    conteudo: {
      metrics: [
        { label: 'Posts Publicados', value: ct.posts, goal: 6 * totalDays },
        { label: 'Stories Realizados', value: ct.stories, goal: 10 * totalDays },
        { label: 'Vídeos YouTube', value: ct.youtube, goal: 8 },
        { label: 'Seguidores @leo', value: ct.followersLeo.toLocaleString('pt-BR'), goal: 0, isInfo: true },
        { label: 'Seguidores @w3', value: ct.followersW3.toLocaleString('pt-BR'), goal: 0, isInfo: true },
      ],
    },
    comercial: {
      metrics: [
        { label: 'Faturamento', value: `R$ ${cm.faturamento.toLocaleString('pt-BR')}`, goal: metaFat, numValue: cm.faturamento },
        { label: 'Vendas Fechadas', value: cm.totalVendas, goal: 20 },
        { label: 'Calls Realizadas', value: cm.calls, goal: workingDays * 5 },
        { label: 'No-Show', value: cm.noShow, goal: 0, isInfo: true },
        { label: 'Taxa de Conversão', value: `${taxaConversaoCom.toFixed(1)}%`, goal: 100, isPercentage: true },
      ],
    },
    rawData: { ss, ct, cm, metaFat },
  };
}
