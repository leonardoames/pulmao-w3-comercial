import { useState, useEffect, useMemo, useCallback } from "react";
import { useDashboardStats, useCloserRankings, DateFilter, getDateRange } from "@/hooks/useDashboard";
import { useSocialSellingEntries } from "@/hooks/useSocialSelling";
import { useContentDailyLogs } from "@/hooks/useContentTracking";
import { useOteGoals } from "@/hooks/useOteGoals";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play, X, MessageSquare, Send, FileText, CalendarCheck, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format, startOfMonth, getDaysInMonth, getDate, isWeekend, eachDayOfInterval, startOfMonth as startOfMonthFn, endOfMonth as endOfMonthFn } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SCREEN_COUNT = 4;
const ROTATION_INTERVAL = 15000;
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
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatInteger = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

// ─── Shared Components ───

function TVCard({ children, className, highlight, style }: { children: React.ReactNode; className?: string; highlight?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("rounded-[20px]", className)}
      style={{
        background: highlight ? "rgba(249,115,22,0.06)" : "#1a1a1a",
        border: highlight ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,165,0,0.1)",
        padding: "32px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ScreenTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-6"
      style={{
        fontSize: "26px", fontWeight: 300, color: "rgba(255,255,255,0.5)",
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

function MetricValue({ children, color, size, className }: { children: React.ReactNode; color?: string; size?: string; className?: string }) {
  return (
    <p
      style={{ fontSize: size || "56px", fontWeight: 700, color: color || "#FFFFFF", lineHeight: 1.1 }}
      className={cn("truncate", className)}
    >
      {children}
    </p>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4">
      <span style={{ fontSize: "32px", opacity: 0.4 }}>{icon}</span>
      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>{text || "Sem dados no período"}</p>
    </div>
  );
}

function DonutChart({ percent, size = 120 }: { percent: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#F97316" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span
        className="absolute"
        style={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF" }}
      >
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

function GradientBar({ percent, height = 6 }: { percent: number; height?: number }) {
  return (
    <div style={{ height: `${height}px`, borderRadius: "999px", background: "rgba(255,255,255,0.08)" }} className="w-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${Math.min(percent, 100)}%`, background: "linear-gradient(90deg, #F97316, #FBBF24)" }}
      />
    </div>
  );
}

// ─── Helpers ───
function getWorkingDaysInMonth(date: Date) {
  const days = eachDayOfInterval({ start: startOfMonthFn(date), end: endOfMonthFn(date) });
  return days.filter(d => !isWeekend(d)).length;
}

function getWorkingDaysElapsed(date: Date) {
  const days = eachDayOfInterval({ start: startOfMonthFn(date), end: date });
  return days.filter(d => !isWeekend(d)).length;
}

function getExpectedProgressPercent() {
  const now = new Date();
  const totalDays = getDaysInMonth(now);
  const currentDay = getDate(now);
  return (currentDay / totalDays) * 100;
}

// ─── Screen 1: Resultado Comercial ───
function ScreenComercial({ stats, metaMensal }: { stats: any; metaMensal: number }) {
  const revenue = stats?.volumeVendas || 0;
  const progressPercent = metaMensal > 0 ? (revenue / metaMensal) * 100 : 0;
  const totalPayments = (stats?.valorPix || 0) + (stats?.valorCartao || 0) + (stats?.valorBoleto || 0);
  const pctPix = totalPayments > 0 ? ((stats?.valorPix || 0) / totalPayments) * 100 : 0;
  const pctCartao = totalPayments > 0 ? ((stats?.valorCartao || 0) / totalPayments) * 100 : 0;
  const pctBoleto = totalPayments > 0 ? ((stats?.valorBoleto || 0) / totalPayments) * 100 : 0;
  const monthLabel = format(new Date(), "MMMM yyyy", { locale: ptBR }).toUpperCase();

  // Expected value calculations
  const now = new Date();
  const workingDaysTotal = getWorkingDaysInMonth(now);
  const workingDaysElapsed = getWorkingDaysElapsed(now);
  const expectedToday = workingDaysTotal > 0 ? (metaMensal / workingDaysTotal) * workingDaysElapsed : 0;
  const variance = revenue - expectedToday;
  const isAhead = variance >= 0;
  const expectedProgressPercent = getExpectedProgressPercent();

  // Conversion & no-show color helpers
  const convRate = stats?.taxaConversao || 0;
  const noShowRate = stats?.percentNoShow || 0;
  const convColor = convRate >= 30 ? "#22C55E" : convRate >= 15 ? "#F97316" : "#EF4444";
  const noShowColor = noShowRate <= 20 ? "#22C55E" : noShowRate <= 35 ? "#F97316" : "#EF4444";

  return (
    <div className="flex flex-col h-full" style={{ gap: "10px" }}>
      {/* Title */}
      <ScreenTitle>Resultado Comercial — {monthLabel}</ScreenTitle>

      {/* ROW 1 — HERO METRIC */}
      <div
        className="rounded-[20px] flex items-center justify-between shrink-0"
        style={{
          height: "22vh",
          background: "#1e1a14",
          border: "1px solid rgba(249,115,22,0.2)",
          padding: "24px 32px",
        }}
      >
        <div className="flex flex-col justify-center">
          <p style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>
            Receita Total
          </p>
          <p style={{ fontSize: "clamp(42px, 5vw, 64px)", fontWeight: 800, color: "#F97316", lineHeight: 1.1, whiteSpace: "nowrap" }}>
            {formatCurrency(revenue)}
          </p>
        </div>
        <div className="flex flex-col items-end justify-center gap-2">
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
            Esperado hoje: {formatCurrency(expectedToday)}
          </p>
          <span
            className="inline-flex items-center gap-1"
            style={{
              fontSize: "13px",
              padding: "4px 12px",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              background: isAhead ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: isAhead ? "#22C55E" : "#EF4444",
            }}
          >
            {isAhead ? "✓" : "↓"} {formatCurrency(Math.abs(variance))} {isAhead ? "acima" : "abaixo"} do esperado
          </span>
        </div>
      </div>

      {/* ROW 2 — META PROGRESS */}
      <div
        className="rounded-[20px] flex flex-col justify-center shrink-0"
        style={{
          height: "10vh",
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 24px",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
          <div className="flex items-baseline gap-2" style={{ whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Meta Mensal</span>
            <span style={{ fontSize: "clamp(14px, 1.5vw, 20px)", fontWeight: 700, color: "#FFFFFF" }}>{formatCurrency(revenue)}</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>/ {formatCurrency(metaMensal)}</span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#F97316", lineHeight: 1 }}>{progressPercent.toFixed(0)}%</p>
        </div>
        <div className="relative w-full">
          <GradientBar percent={progressPercent} height={8} />
          {/* Expected progress tick mark */}
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: `${Math.min(expectedProgressPercent, 100)}%`,
              width: "2px",
              height: "16px",
              background: "rgba(255,255,255,0.5)",
              borderRadius: "1px",
              transform: "translateX(-1px)",
            }}
          />
        </div>
      </div>

      {/* ROW 3 — SECONDARY METRICS */}
      <div className="grid grid-cols-3 gap-3 shrink-0" style={{ height: "18vh" }}>
        {[
          { label: "Ticket Médio", value: formatCurrency(stats?.ticketMedio || 0) },
          { label: "Fat. por Call", value: formatCurrency(stats?.faturamentoPorCall || 0) },
          { label: "Total de Vendas", value: formatInteger(stats?.totalVendas || 0) },
        ].map((m) => (
          <TVCard key={m.label} style={{ padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" }} className="flex flex-col justify-center h-full">
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>{m.label}</p>
            <p style={{ fontSize: "clamp(22px, 2.2vw, 32px)", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, whiteSpace: "nowrap" }}>{m.value}</p>
          </TVCard>
        ))}
      </div>

      {/* ROW 4 — CONVERSION & PIPELINE */}
      <div className="grid grid-cols-3 gap-3 shrink-0" style={{ height: "18vh" }}>
        <TVCard style={{ padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" }} className="flex flex-col justify-center h-full">
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Taxa de Conversão</p>
          <p style={{ fontSize: "clamp(22px, 2.2vw, 32px)", fontWeight: 700, color: convColor, lineHeight: 1.1 }}>{convRate.toFixed(1)}%</p>
        </TVCard>
        <TVCard style={{ padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" }} className="flex flex-col justify-center h-full">
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>No-show Global</p>
          <p style={{ fontSize: "clamp(22px, 2.2vw, 32px)", fontWeight: 700, color: noShowColor, lineHeight: 1.1 }}>{noShowRate.toFixed(1)}%</p>
        </TVCard>
        <TVCard style={{ padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" }} className="flex flex-col justify-center h-full">
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>Calls Realizadas</p>
          <p style={{ fontSize: "clamp(22px, 2.2vw, 32px)", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1 }}>{formatInteger(stats?.callsRealizadas || 0)}</p>
        </TVCard>
      </div>

      {/* ROW 5 — PAYMENT BREAKDOWN */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        {[
          { label: "Pix", value: stats?.valorPix || 0, pct: pctPix },
          { label: "Cartão", value: stats?.valorCartao || 0, pct: pctCartao },
          { label: "Boleto", value: stats?.valorBoleto || 0, pct: pctBoleto },
        ].map((m) => (
          <TVCard key={m.label} style={{ padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" }} className="flex flex-col justify-center h-full">
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>{m.label}</p>
            <p style={{ fontSize: "clamp(20px, 2vw, 28px)", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, whiteSpace: "nowrap" }}>{formatCurrency(m.value)}</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>{m.pct.toFixed(1)}%</p>
          </TVCard>
        ))}
      </div>
    </div>
  );
}
// ─── Screen 2: Ranking dos Closers ───
function ScreenRanking({ rankings, oteGoals }: { rankings: any; oteGoals: any[] }) {
  const closers = rankings?.rankingGeral || [];
  const leader = closers[0] || null;
  const rest = closers.slice(1);

  const noShowColor = (pct: number) => pct <= 20 ? "#22C55E" : pct <= 35 ? "#F97316" : "#EF4444";
  const convColor = (pct: number) => pct >= 30 ? "#22C55E" : pct >= 15 ? "#F97316" : "#EF4444";

  const getOte = (closer: any) => {
    const goal = oteGoals?.find((g) => g.closer_user_id === closer.id);
    const goalValue = goal?.ote_target_value || 0;
    const oteRealized = closer.oteRealizado || 0;
    const otePercent = goalValue > 0 ? (oteRealized / goalValue) * 100 : 0;
    return { goalValue, oteRealized, otePercent };
  };

  const getCallsAgendadas = (c: any) => c.callsRealizadas + c.reagendado + c.noShow;

  return (
    <div className="flex flex-col h-full">
      <ScreenTitle>Performance Individual dos Closers</ScreenTitle>

      <div className="flex flex-1 min-h-0" style={{ gap: "16px" }}>
        {/* LEFT — HERO CARD (#1) */}
        {leader && (() => {
          const { goalValue, oteRealized, otePercent } = getOte(leader);
          const isEmpty = leader.volume === 0 && leader.vendas === 0;
          const agendadas = getCallsAgendadas(leader);

          return (
            <div
              className="rounded-[16px] flex flex-col shrink-0"
              style={{
                flex: "0 0 42%",
                background: "#1e1a14",
                border: "1px solid rgba(249,115,22,0.3)",
                padding: "28px 32px",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{ background: "#F97316", color: "#000" }}
                >
                  1
                </div>
                <p style={{ fontSize: "22px", fontWeight: 700, color: "#FFFFFF" }}>{leader.nome}</p>
                <span className="shrink-0 px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "#F97316", color: "#000", fontSize: "11px", fontWeight: 700 }}>
                  <Trophy className="h-3 w-3" /> Líder
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0 20px" }} />

              {/* PRIMARY — Receita Realizada */}
              <div className="mb-5">
                <p style={{ fontSize: "11px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>
                  Receita Realizada
                </p>
                <p style={{ fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 800, color: "#F97316", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                  {isEmpty ? "—" : formatCurrency(leader.volume)}
                </p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>
                  {isEmpty ? "Sem vendas no período" : `${leader.vendas} vendas fechadas`}
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 0 16px" }} />

              {/* OTE REALIZADO */}
              <div className="mb-5">
                <p style={{ fontSize: "11px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>
                  OTE Realizado
                </p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                  {formatCurrency(oteRealized)}
                </p>
                {goalValue > 0 && (
                  <>
                    <div className="mt-3"><GradientBar percent={otePercent} height={6} /></div>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>
                      {otePercent.toFixed(0)}% da meta OTE ({formatCurrency(goalValue)})
                    </p>
                  </>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 0 16px" }} />

              {/* SECONDARY — 2 columns */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Calls Agendadas</p>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>{formatInteger(agendadas)}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>No-show</p>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: noShowColor(leader.percentNoShow) }}>
                    {leader.percentNoShow.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Conversão */}
              <div className="mt-auto">
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Conversão</p>
                <p style={{ fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 700, color: convColor(leader.taxaConversao), lineHeight: 1.1 }}>
                  {leader.taxaConversao.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })()}

        {/* RIGHT — COMPACT LIST */}
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: "12px" }}>
          {rest.length === 0 && (
            <div className="flex-1 flex items-center justify-center rounded-[12px]" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>Nenhum outro closer no período</p>
            </div>
          )}
          {rest.map((closer: any, index: number) => {
            const { goalValue, oteRealized, otePercent } = getOte(closer);
            const isEmpty = closer.volume === 0 && closer.vendas === 0;
            const agendadas = getCallsAgendadas(closer);
            const rank = index + 2;

            return (
              <div
                key={closer.id}
                className="rounded-[12px] flex flex-col justify-between"
                style={{
                  flex: 1,
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "16px 24px",
                  minHeight: 0,
                }}
              >
                {/* ROW 1 */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                  >
                    {rank}
                  </div>
                  <p className="flex-1 min-w-0" style={{ fontSize: "16px", fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {closer.nome}
                  </p>
                  <p className="shrink-0" style={{ fontSize: "20px", fontWeight: 700, color: isEmpty ? "rgba(255,255,255,0.25)" : "#FFFFFF", whiteSpace: "nowrap" }}>
                    {isEmpty ? "—" : formatCurrency(closer.volume)}
                  </p>
                </div>

                {/* ROW 2 */}
                <div className="flex items-center justify-between mt-2" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                  <div className="flex items-center gap-4">
                    <span>{closer.vendas > 0 ? `${closer.vendas} vendas` : "0 vendas"}</span>
                    <span style={{ whiteSpace: "nowrap" }}>
                      OTE: {formatCurrency(oteRealized)}
                      {goalValue > 0 && <span style={{ color: "#F97316", marginLeft: "4px" }}>({otePercent.toFixed(0)}%)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>Calls: {formatInteger(agendadas)}</span>
                    <span>No-show: <span style={{ color: noShowColor(closer.percentNoShow) }}>{closer.percentNoShow.toFixed(1)}%</span></span>
                    {agendadas > 0 && (
                      <span>Conv: <span style={{ color: convColor(closer.taxaConversao) }}>{closer.taxaConversao.toFixed(1)}%</span></span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {goalValue > 0 && (
                  <div className="mt-2"><GradientBar percent={otePercent} height={4} /></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ─── Screen 3: Social Selling ───
function ScreenSocialSelling({ ssEntries }: { ssEntries: any[] }) {
  const totals = useMemo(() => {
    if (!ssEntries || ssEntries.length === 0) return { conversas: 0, convites: 0, formularios: 0, agendamentos: 0 };
    return {
      conversas: ssEntries.reduce((s, e) => s + e.conversas_iniciadas, 0),
      convites: ssEntries.reduce((s, e) => s + e.convites_enviados, 0),
      formularios: ssEntries.reduce((s, e) => s + e.formularios_preenchidos, 0),
      agendamentos: ssEntries.reduce((s, e) => s + e.agendamentos, 0),
    };
  }, [ssEntries]);

  const allZero = totals.conversas === 0 && totals.convites === 0 && totals.formularios === 0 && totals.agendamentos === 0;
  const convRateForm = totals.formularios > 0 ? (totals.agendamentos / totals.formularios) * 100 : 0;
  const convRateConv = totals.conversas > 0 ? (totals.formularios / totals.conversas) * 100 : 0;

  const metrics = [
    { label: "Conversas Iniciadas", value: totals.conversas, icon: <MessageSquare className="h-6 w-6" style={{ color: "rgba(255,255,255,0.3)" }} /> },
    { label: "Convites Enviados", value: totals.convites, icon: <Send className="h-6 w-6" style={{ color: "rgba(255,255,255,0.3)" }} /> },
    { label: "Formulários", value: totals.formularios, icon: <FileText className="h-6 w-6" style={{ color: "rgba(255,255,255,0.3)" }} /> },
    { label: "Agendamentos", value: totals.agendamentos, icon: <CalendarCheck className="h-6 w-6" style={{ color: "rgba(255,255,255,0.3)" }} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <ScreenTitle>Social Selling</ScreenTitle>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <TVCard key={m.label} className="flex flex-col justify-center">
            <MetricLabel>{m.label}</MetricLabel>
            {allZero ? (
              <EmptyState icon={m.icon} />
            ) : (
              <MetricValue color={m.value > 0 ? "#FFFFFF" : "rgba(255,255,255,0.3)"}>
                {formatInteger(m.value)}
              </MetricValue>
            )}
          </TVCard>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <TVCard className="flex flex-col items-center justify-center">
          <MetricLabel>Conv. Formulário → Agendamento</MetricLabel>
          {allZero ? (
            <EmptyState icon={<CalendarCheck className="h-6 w-6" style={{ color: "rgba(255,255,255,0.3)" }} />} />
          ) : (
            <div className="mt-4">
              <DonutChart percent={convRateForm} />
            </div>
          )}
        </TVCard>
        <TVCard className="flex flex-col items-center justify-center">
          <MetricLabel>Conv. Conversa → Formulário</MetricLabel>
          {allZero ? (
            <EmptyState icon={<FileText className="h-6 w-6" style={{ color: "rgba(255,255,255,0.3)" }} />} />
          ) : (
            <div className="mt-4">
              <DonutChart percent={convRateConv} />
            </div>
          )}
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

  const allZero = totals.posts === 0 && totals.stories === 0 && totals.scheduled === 0 && totals.youtube === 0;

  const metrics = [
    { label: "Posts Publicados", value: totals.posts },
    { label: "Stories", value: totals.stories },
    { label: "Agendados", value: totals.scheduled },
    { label: "Vídeos YouTube", value: totals.youtube },
  ];

  return (
    <div className="flex flex-col h-full">
      <ScreenTitle>Dashboard de Conteúdo</ScreenTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <TVCard key={m.label} className="flex flex-col justify-center" style={{ minHeight: "160px" }}>
            <MetricLabel>{m.label}</MetricLabel>
            {allZero ? (
              <EmptyState icon="📝" />
            ) : (
              <MetricValue color={m.value > 0 ? "#F97316" : "rgba(255,255,255,0.3)"}>
                {formatInteger(m.value)}
              </MetricValue>
            )}
          </TVCard>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <TVCard className="flex flex-col justify-center" style={{ minHeight: "160px" }}>
          <MetricLabel>Seguidores W3</MetricLabel>
          {totals.followersW3 === 0 && allZero ? (
            <EmptyState icon="👥" />
          ) : (
            <MetricValue>{formatInteger(totals.followersW3)}</MetricValue>
          )}
        </TVCard>
        <TVCard className="flex flex-col justify-center" style={{ minHeight: "160px" }}>
          <MetricLabel>Seguidores Léo</MetricLabel>
          {totals.followersLeo === 0 && allZero ? (
            <EmptyState icon="👥" />
          ) : (
            <MetricValue>{formatInteger(totals.followersLeo)}</MetricValue>
          )}
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
      setCurrentScreen(((next % SCREEN_COUNT) + SCREEN_COUNT) % SCREEN_COUNT);
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

  const handlePrev = () => goToScreen(currentScreen - 1);
  const handleNext = () => goToScreen(currentScreen + 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0d0d0d" }}>
      {/* Content area */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-opacity"
        style={{ opacity, transitionDuration: `${FADE_DURATION / 2}ms`, padding: "16px 32px 48px 32px" }}
      >
        {/* Header row — 48px */}
        <div className="flex items-center justify-between shrink-0" style={{ height: "48px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>
            <span style={{ color: "#F97316" }}>Pulmão</span>{" "}
            <span style={{ color: "#FFFFFF" }}>W3</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="tv-live-dot" />
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
              Atualizado: {new Date().toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Screen content — fills remaining space */}
        <div className="flex-1 min-h-0">
          {currentScreen === 0 && <ScreenComercial stats={stats} metaMensal={metaMensal} />}
          {currentScreen === 1 && <ScreenRanking rankings={rankings} oteGoals={oteGoals} />}
          {currentScreen === 2 && <ScreenSocialSelling ssEntries={ssEntries} />}
          {currentScreen === 3 && <ScreenConteudo contentLogs={contentLogs} />}
        </div>
      </div>

      {/* Bottom-left: Exit */}
      <div className="fixed bottom-4 left-8 z-50">
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
      <div className="fixed bottom-4 right-8 z-50 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 text-white/40 hover:text-white/80">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          {Array.from({ length: SCREEN_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToScreen(i)}
              className="rounded-full transition-all"
              style={{
                width: "10px",
                height: "10px",
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

      {/* Progress bar — very bottom edge */}
      <div className="fixed bottom-0 left-0 right-0 z-50" style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full"
          style={{ width: `${progress}%`, background: "#F97316", transition: "width 50ms linear" }}
        />
      </div>
    </div>
  );
}
