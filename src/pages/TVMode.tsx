import { useState, useEffect, useMemo } from "react";
import { useDashboardStats, useCloserRankings, DateFilter, DateRange, getDateRange } from "@/hooks/useDashboard";
import { useSocialSellingEntries, SOCIAL_SELLING_GOALS } from "@/hooks/useSocialSelling";
import { useContentDailyLogs } from "@/hooks/useContentTracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Trophy, Target, Phone, Settings, Moon, Sun, Save, MessageCircle, FileText, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { TVDateFilter } from "@/components/tv/TVDateFilter";
import { OteTVPanel } from "@/components/ote/OteTVPanel";
import { useClosers } from "@/hooks/useProfiles";
import { format, startOfMonth, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SectionLabel } from "@/components/dashboard/SectionLabel";

function useTvMetaMensal() {
  return useQuery({
    queryKey: ["tv-settings", "meta_mensal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tv_settings")
        .select("value")
        .eq("key", "meta_mensal")
        .maybeSingle();
      if (error) throw error;
      return data ? Number(data.value) : 100000;
    },
  });
}

function useSaveTvMetaMensal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: number) => {
      const { error } = await supabase
        .from("tv_settings")
        .update({ value: String(value), updated_at: new Date().toISOString() })
        .eq("key", "meta_mensal");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tv-settings", "meta_mensal"] });
      toast.success("Meta mensal salva com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar meta: " + err.message);
    },
  });
}

export default function TVModePage() {
  const [filter, setFilter] = useState<DateFilter>("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [selectedCloser, setSelectedCloser] = useState<string>("all");

  const { data: metaMensalDb } = useTvMetaMensal();
  const saveMeta = useSaveTvMetaMensal();
  const [metaMensal, setMetaMensal] = useState<number>(100000);
  const [metaDirty, setMetaDirty] = useState(false);

  useEffect(() => {
    if (metaMensalDb !== undefined && !metaDirty) {
      setMetaMensal(metaMensalDb);
    }
  }, [metaMensalDb, metaDirty]);

  const handleMetaChange = (value: number) => {
    setMetaMensal(value);
    setMetaDirty(true);
  };

  const handleSaveMeta = () => {
    saveMeta.mutate(metaMensal, { onSuccess: () => setMetaDirty(false) });
  };

  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { theme, setTheme } = useTheme();

  const { data: closers } = useClosers();

  const getMonthRefFromFilter = (): string => {
    if (filter === "custom" && customRange) {
      return format(customRange.start, "yyyy-MM");
    }
    return format(startOfMonth(new Date()), "yyyy-MM");
  };

  const monthRef = getMonthRefFromFilter();

  const { data: stats, refetch: refetchStats } = useDashboardStats(filter, customRange, selectedCloser);
  const { data: rankings, refetch: refetchRankings } = useCloserRankings(filter, customRange, selectedCloser);

  // Social Selling data
  const filterRange = useMemo(() => getDateRange(filter, customRange), [filter, customRange]);
  const { data: ssEntries, refetch: refetchSS } = useSocialSellingEntries({
    startDate: filterRange.start,
    endDate: filterRange.end,
  });

  const ssTotals = useMemo(() => {
    if (!ssEntries) return { conversas: 0, convites: 0, formularios: 0, agendamentos: 0 };
    return {
      conversas: ssEntries.reduce((s, e) => s + e.conversas_iniciadas, 0),
      convites: ssEntries.reduce((s, e) => s + e.convites_enviados, 0),
      formularios: ssEntries.reduce((s, e) => s + e.formularios_preenchidos, 0),
      agendamentos: ssEntries.reduce((s, e) => s + e.agendamentos, 0),
    };
  }, [ssEntries]);

  // Content data
  const contentStartDate = format(filterRange.start, 'yyyy-MM-dd');
  const contentEndDate = format(filterRange.end, 'yyyy-MM-dd');
  const { data: contentLogs = [], refetch: refetchContent } = useContentDailyLogs(contentStartDate, contentEndDate);

  const contentTotals = useMemo(() => {
    return {
      posts: contentLogs.reduce((s, l) => s + l.posts_published_count, 0),
      stories: contentLogs.reduce((s, l) => s + l.stories_done_count, 0),
      scheduled: contentLogs.reduce((s, l) => s + l.posts_scheduled_count, 0),
    };
  }, [contentLogs]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchRankings();
      refetchSS();
      refetchContent();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchStats, refetchRankings, refetchSS, refetchContent]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1_000_000) {
      return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    }
    if (value >= 1_000) {
      return `R$ ${(value / 1_000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  const progressoMeta = metaMensal > 0 ? ((stats?.volumeVendas || 0) / metaMensal) * 100 : 0;

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: 'radial-gradient(ellipse at 15% 0%, rgba(249,115,22,0.05) 0%, transparent 55%), hsl(var(--background))',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-primary">Pulmão</span> W3
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Dashboard ao Vivo</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCloser} onValueChange={setSelectedCloser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por closer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Closers</SelectItem>
              {closers?.map((closer) => (
                <SelectItem key={closer.id} value={closer.id}>
                  {closer.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TVDateFilter
            filter={filter}
            onFilterChange={setFilter}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
            Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
          </p>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-5 w-5" />
          </Button>
          <Link to="/">
            <Button variant="outline" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div
          className="mb-8 p-4 rounded-2xl"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid rgba(255, 165, 0, 0.12)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Meta Mensal:</label>
            <Input
              type="number"
              value={metaMensal}
              onChange={(e) => handleMetaChange(Number(e.target.value) || 0)}
              className="w-40"
            />
            <Button onClick={handleSaveMeta} disabled={saveMeta.isPending || !metaDirty} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saveMeta.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      )}

      {/* ── COMERCIAL ── */}
      <SectionLabel title="Comercial" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }} className="mb-2">Volume de Vendas</p>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }} className="truncate">{formatCurrencyCompact(stats?.volumeVendas || 0)}</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }} className="mt-2">{stats?.totalVendas || 0} vendas</p>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }} className="mb-2">Calls Realizadas</p>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#22C55E' }}>{stats?.callsRealizadas || 0}</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }} className="mt-2">{stats?.callsAgendadas || 0} agendadas</p>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }} className="mb-2">Taxa de Conversão</p>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#FFFFFF' }}>{(stats?.taxaConversao || 0).toFixed(1)}%</p>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }} className="mb-2">% No-Show</p>
          <p style={{ fontSize: '36px', fontWeight: 700 }} className={cn((stats?.percentNoShow || 0) > 20 ? "text-destructive" : "text-success")}>
            {(stats?.percentNoShow || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Meta Progress */}
      <div
        className="mb-6 rounded-2xl"
        style={{
          padding: '24px',
          background: 'hsl(var(--card))',
          border: '1px solid rgba(255, 165, 0, 0.12)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Progresso da Meta Mensal</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF' }}>
              {formatCurrency(stats?.volumeVendas || 0)} <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>/ {formatCurrency(metaMensal)}</span>
            </p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>{progressoMeta.toFixed(0)}%</p>
        </div>
        <div
          className="w-full overflow-hidden"
          style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className={cn('h-full transition-all duration-1000', progressoMeta >= 100 ? 'progress-fill-success' : 'progress-fill')}
            style={{ width: `${Math.min(progressoMeta, 100)}%`, borderRadius: '999px' }}
          />
        </div>
      </div>

      {/* OTE Panel and Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <OteTVPanel monthRef={monthRef} selectedCloser={selectedCloser} />

        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card" style={{ borderColor: 'rgba(249,115,22,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-6 w-6" style={{ color: '#F97316' }} />
              <p className="font-medium" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Top do Dia</p>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{rankings?.topCloserDia?.nome || "-"}</p>
            {rankings?.topCloserDia && (
              <p className="font-medium" style={{ color: '#F97316' }}>{formatCurrency(rankings.topCloserDia.volume)}</p>
            )}
          </div>

          <div className="stat-card" style={{ borderColor: 'rgba(249,115,22,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-6 w-6" style={{ color: '#F97316' }} />
              <p className="font-medium" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Top da Semana</p>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{rankings?.topCloserSemana?.nome || "-"}</p>
            {rankings?.topCloserSemana && (
              <p className="font-medium" style={{ color: '#F97316' }}>{formatCurrency(rankings.topCloserSemana.volume)}</p>
            )}
          </div>

          <div className="stat-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6" style={{ color: '#22C55E' }} />
              <p className="font-medium" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Top Conversão</p>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{rankings?.topConversao?.nome || "-"}</p>
            {rankings?.topConversao && (
              <p className="font-medium" style={{ color: '#22C55E' }}>{rankings.topConversao.taxaConversao.toFixed(1)}%</p>
            )}
          </div>

          <div className="stat-card" style={{ borderColor: 'rgba(56,189,248,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Phone className="h-6 w-6" style={{ color: '#38BDF8' }} />
              <p className="font-medium" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Menor No-Show</p>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{rankings?.menorNoShow?.nome || "-"}</p>
            {rankings?.menorNoShow && (
              <p className="font-medium" style={{ color: '#38BDF8' }}>{rankings.menorNoShow.percentNoShow.toFixed(1)}%</p>
            )}
          </div>
        </div>
      </div>

      {/* ── SOCIAL SELLING ── */}
      <SectionLabel title="Social Selling" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-4 w-4" style={{ color: '#F97316' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Conversas</p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#FFFFFF' }}>{ssTotals.conversas}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4" style={{ color: '#F97316' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Formulários</p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#FFFFFF' }}>{ssTotals.formularios}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" style={{ color: '#22C55E' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Agendamentos</p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#22C55E' }}>{ssTotals.agendamentos}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" style={{ color: '#FBBF24' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Conv. Form→Agend</p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#FBBF24' }}>
            {ssTotals.formularios > 0 ? ((ssTotals.agendamentos / ssTotals.formularios) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <SectionLabel title="Conteúdo" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4" style={{ color: '#F97316' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Posts Publicados</p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#F97316' }}>{contentTotals.posts}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Film className="h-4 w-4" style={{ color: '#FBBF24' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Stories</p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#FBBF24' }}>{contentTotals.stories}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" style={{ color: '#22C55E' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Agendados</p>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#22C55E' }}>{contentTotals.scheduled}</p>
        </div>
      </div>

      {/* Full Ranking */}
      {rankings?.rankingGeral && rankings.rankingGeral.length > 0 && (
        <>
          <SectionLabel title="Ranking Geral" />
          <div
            className="rounded-2xl"
            style={{
              padding: '24px',
              background: 'hsl(var(--card))',
              border: '1px solid rgba(255, 165, 0, 0.12)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings.rankingGeral.slice(0, 6).map((closer, index) => (
                <div key={closer.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl",
                      index === 0 && "bg-primary text-primary-foreground",
                      index === 1 && "medal-silver",
                      index === 2 && "medal-bronze",
                      index > 2 && "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-foreground">{closer.nome}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                      {closer.vendas} vendas • {closer.taxaConversao.toFixed(0)}% conv.
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#F97316' }}>{formatCurrency(closer.volume)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
