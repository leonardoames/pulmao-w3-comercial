import { useState, useEffect, useMemo, useCallback } from "react";
import { useDashboardStats, useCloserRankings, DateFilter, DateRange, getDateRange } from "@/hooks/useDashboard";
import { useSocialSellingEntries } from "@/hooks/useSocialSelling";
import { useContentDailyLogs } from "@/hooks/useContentTracking";
import { useClosers } from "@/hooks/useProfiles";
import { useOteGoals } from "@/hooks/useOteGoals";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SCREEN_COUNT = 4;
const ROTATION_INTERVAL = 15000; // 15 seconds
const FADE_DURATION = 600;

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatCurrencyCompact = (value: number) => {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
};

// ─── TV Card ───
function TVCard({ children, className, highlight }: { children: React.ReactNode; className?: string; highlight?: boolean }) {
  return (
    <div
      className={cn("rounded-[20px] p-8", className)}
      style={{
        background: "#1a1a1a",
        border: highlight ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(255,165,0,0.1)",
        boxShadow: highlight ? "0 0 40px rgba(249,115,22,0.08)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function ScreenTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-8"
      style={{
        fontSize: "32px", fontWeight: 300, color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase", letterSpacing: "0.15em",
      }}
    >
      {children}
    </h2>
  );
}

function MetricLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>{children}</p>;
}

function MetricValue({ children, color }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontSize: "56px", fontWeight: 700, color: color || "#FFFFFF", lineHeight: 1.1 }} className="truncate">{children}</p>;
}

// ─── Screen 1: Resultado Comercial ───
function ScreenComercial({ stats, metaMensal }: { stats: any; metaMensal: number }) {
  const progressPercent = metaMensal > 0 ? Math.min(((stats?.volumeVendas || 0) / metaMensal) * 100, 100) : 0;

  return (
    <div>
      <ScreenTitle>
        Resultado Comercial — {format(new Date(), "MMMM yyyy").replace(/^\w/, (c) => c.toUpperCase())}
      </ScreenTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TVCard>
          <MetricLabel>Receita Total</MetricLabel>
          <MetricValue color="#F97316">{formatCurrencyCompact(stats?.volumeVendas || 0)}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Ticket Médio</MetricLabel>
          <MetricValue>{formatCurrencyCompact(stats?.ticketMedio || 0)}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Fat. por Call</MetricLabel>
          <MetricValue>{formatCurrencyCompact(stats?.faturamentoPorCall || 0)}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Total de Vendas</MetricLabel>
          <MetricValue>{stats?.totalVendas || 0}</MetricValue>
        </TVCard>
      </div>

      {/* Meta Progress */}
      <TVCard className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <MetricLabel>Meta Mensal</MetricLabel>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF" }}>
              {formatCurrency(stats?.volumeVendas || 0)}{" "}
              <span style={{ fontSize: "16px", fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>/ {formatCurrency(metaMensal)}</span>
            </p>
          </div>
          <p style={{ fontSize: "56px", fontWeight: 700, color: "#F97316" }}>{progressPercent.toFixed(0)}%</p>
        </div>
        <div style={{ height: "12px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }} className="w-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #F97316, #FBBF24)" }} />
        </div>
      </TVCard>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-3 gap-6">
        <TVCard>
          <MetricLabel>Pix</MetricLabel>
          <MetricValue color="#F97316">{formatCurrencyCompact(stats?.valorPix || 0)}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Cartão</MetricLabel>
          <MetricValue color="#FBBF24">{formatCurrencyCompact(stats?.valorCartao || 0)}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Boleto</MetricLabel>
          <MetricValue color="rgba(249,115,22,0.6)">{formatCurrencyCompact(stats?.valorBoleto || 0)}</MetricValue>
        </TVCard>
      </div>
    </div>
  );
}

// ─── Screen 2: Ranking dos Closers ───
function ScreenRanking({ rankings, oteGoals }: { rankings: any; oteGoals: any[] }) {
  const closers = rankings?.rankingGeral || [];

  return (
    <div>
      <ScreenTitle>Performance Individual dos Closers</ScreenTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {closers.slice(0, 8).map((closer: any, index: number) => {
          const goal = oteGoals?.find((g) => g.closer_user_id === closer.id);
          const goalValue = goal?.ote_target_value || 0;
          const progressPercent = goalValue > 0 ? Math.min((closer.volume / goalValue) * 100, 100) : 0;
          const isTop = index === 0;

          return (
            <TVCard key={closer.id} highlight={isTop}>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl", {
                    "bg-primary text-primary-foreground": index === 0,
                    "medal-silver": index === 1,
                    "medal-bronze": index === 2,
                    "bg-muted text-muted-foreground": index > 2,
                  })}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "22px", fontWeight: 700, color: "#FFFFFF" }} className="truncate">{closer.nome}</p>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                    {closer.vendas} vendas • {closer.taxaConversao.toFixed(0)}% conversão
                  </p>
                </div>
                <p style={{ fontSize: "32px", fontWeight: 700, color: "#F97316" }}>{formatCurrencyCompact(closer.volume)}</p>
              </div>
              {goalValue > 0 && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>Meta individual</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }} className="w-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #F97316, #FBBF24)" }} />
                  </div>
                </div>
              )}
            </TVCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── Screen 3: Social Selling ───
function ScreenSocialSelling({ ssEntries }: { ssEntries: any[] }) {
  const totals = useMemo(() => {
    if (!ssEntries) return { conversas: 0, convites: 0, formularios: 0, agendamentos: 0 };
    return {
      conversas: ssEntries.reduce((s, e) => s + e.conversas_iniciadas, 0),
      convites: ssEntries.reduce((s, e) => s + e.convites_enviados, 0),
      formularios: ssEntries.reduce((s, e) => s + e.formularios_preenchidos, 0),
      agendamentos: ssEntries.reduce((s, e) => s + e.agendamentos, 0),
    };
  }, [ssEntries]);

  const convRate = totals.formularios > 0 ? ((totals.agendamentos / totals.formularios) * 100).toFixed(0) : "0";

  return (
    <div>
      <ScreenTitle>Social Selling</ScreenTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TVCard>
          <MetricLabel>Conversas Iniciadas</MetricLabel>
          <MetricValue>{totals.conversas}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Convites Enviados</MetricLabel>
          <MetricValue>{totals.convites}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Formulários</MetricLabel>
          <MetricValue>{totals.formularios}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Agendamentos</MetricLabel>
          <MetricValue color="#22C55E">{totals.agendamentos}</MetricValue>
        </TVCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TVCard>
          <MetricLabel>Conv. Formulário → Agendamento</MetricLabel>
          <MetricValue color="#FBBF24">{convRate}%</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Conv. Conversa → Formulário</MetricLabel>
          <MetricValue color="#38BDF8">
            {totals.conversas > 0 ? ((totals.formularios / totals.conversas) * 100).toFixed(0) : "0"}%
          </MetricValue>
        </TVCard>
      </div>
    </div>
  );
}

// ─── Screen 4: Conteúdo ───
function ScreenConteudo({ contentLogs }: { contentLogs: any[] }) {
  const totals = useMemo(() => ({
    posts: contentLogs.reduce((s, l) => s + l.posts_published_count, 0),
    stories: contentLogs.reduce((s, l) => s + l.stories_done_count, 0),
    scheduled: contentLogs.reduce((s, l) => s + l.posts_scheduled_count, 0),
    youtube: contentLogs.reduce((s, l) => s + (l.youtube_videos_published_count || 0), 0),
    followersW3: contentLogs.length > 0 ? contentLogs[0].followers_w3 || 0 : 0,
    followersLeo: contentLogs.length > 0 ? contentLogs[0].followers_leo || 0 : 0,
  }), [contentLogs]);

  return (
    <div>
      <ScreenTitle>Dashboard de Conteúdo</ScreenTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TVCard>
          <MetricLabel>Posts Publicados</MetricLabel>
          <MetricValue color="#F97316">{totals.posts}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Stories</MetricLabel>
          <MetricValue color="#FBBF24">{totals.stories}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Agendados</MetricLabel>
          <MetricValue color="#22C55E">{totals.scheduled}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Vídeos YouTube</MetricLabel>
          <MetricValue>{totals.youtube}</MetricValue>
        </TVCard>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <TVCard>
          <MetricLabel>Seguidores W3</MetricLabel>
          <MetricValue>{totals.followersW3.toLocaleString("pt-BR")}</MetricValue>
        </TVCard>
        <TVCard>
          <MetricLabel>Seguidores Léo</MetricLabel>
          <MetricValue>{totals.followersLeo.toLocaleString("pt-BR")}</MetricValue>
        </TVCard>
      </div>
    </div>
  );
}

// ─── Main TV Mode Page ───
export default function TVModePage() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const filter: DateFilter = "month";
  const filterRange = useMemo(() => getDateRange(filter), []);
  const monthRef = format(startOfMonth(new Date()), "yyyy-MM");

  const { data: stats, refetch: refetchStats } = useDashboardStats(filter, undefined, "all");
  const { data: rankings, refetch: refetchRankings } = useCloserRankings(filter, undefined, "all");
  const { data: metaMensalDb } = useTvMetaMensal();
  const metaMensal = metaMensalDb ?? 100000;

  const { data: ssEntries = [], refetch: refetchSS } = useSocialSellingEntries({
    startDate: filterRange.start,
    endDate: filterRange.end,
  });

  const contentStartDate = format(filterRange.start, "yyyy-MM-dd");
  const contentEndDate = format(filterRange.end, "yyyy-MM-dd");
  const { data: contentLogs = [], refetch: refetchContent } = useContentDailyLogs(contentStartDate, contentEndDate);

  const { data: oteGoals = [] } = useOteGoals(monthRef);

  // Auto-refresh data every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchRankings();
      refetchSS();
      refetchContent();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchStats, refetchRankings, refetchSS, refetchContent]);

  // Screen rotation with fade
  const goToScreen = useCallback((next: number) => {
    setOpacity(0);
    setTimeout(() => {
      setCurrentScreen(next % SCREEN_COUNT);
      setProgress(0);
      setOpacity(1);
    }, FADE_DURATION / 2);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const tick = 50;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (tick / ROTATION_INTERVAL) * 100;
        if (next >= 100) {
          goToScreen(currentScreen + 1);
          return 0;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(interval);
  }, [isPlaying, currentScreen, goToScreen]);

  const handlePrev = () => goToScreen((currentScreen - 1 + SCREEN_COUNT) % SCREEN_COUNT);
  const handleNext = () => goToScreen(currentScreen + 1);

  return (
    <div className="fixed inset-0 z-50 overflow-auto" style={{ background: "#0d0d0d" }}>
      {/* Content */}
      <div
        className="min-h-screen p-8 lg:p-12 pb-24 transition-opacity"
        style={{ opacity, transitionDuration: `${FADE_DURATION / 2}ms` }}
      >
        {/* Branding */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700 }}>
              <span style={{ color: "#F97316" }}>Pulmão</span>{" "}
              <span style={{ color: "#FFFFFF" }}>W3</span>
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>
            Atualizado: {new Date().toLocaleTimeString("pt-BR")}
          </p>
        </div>

        {currentScreen === 0 && <ScreenComercial stats={stats} metaMensal={metaMensal} />}
        {currentScreen === 1 && <ScreenRanking rankings={rankings} oteGoals={oteGoals} />}
        {currentScreen === 2 && <ScreenSocialSelling ssEntries={ssEntries} />}
        {currentScreen === 3 && <ScreenConteudo contentLogs={contentLogs} />}
      </div>

      {/* Bottom-left: Exit */}
      <div className="fixed bottom-6 left-8 z-50">
        <Link to="/">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}
          >
            <X className="h-4 w-4" />
            Sair do Modo TV
          </button>
        </Link>
      </div>

      {/* Bottom-right: Controls */}
      <div className="fixed bottom-6 right-8 z-50 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 text-white/40 hover:text-white/80">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Dots */}
        <div className="flex gap-2">
          {Array.from({ length: SCREEN_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToScreen(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: i === currentScreen ? "#F97316" : "rgba(255,255,255,0.2)",
                transform: i === currentScreen ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 text-white/40 hover:text-white/80">
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-8 w-8 text-white/40 hover:text-white/80"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      {/* Progress bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #F97316, #FBBF24)",
            transitionDuration: "50ms",
            transitionTimingFunction: "linear",
          }}
        />
      </div>
    </div>
  );
}
