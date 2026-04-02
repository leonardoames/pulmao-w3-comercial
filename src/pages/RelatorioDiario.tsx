import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Users,
  MessageSquare,
  CalendarCheck,
  Eye,
  Heart,
  MousePointerClick,
  UserCheck,
  FileText,
  DollarSign,
  Send,
  Loader2,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';

// ── Mock data ──────────────────────────────────────────────
const socialSellingData = [
  { label: 'Conexões Enviadas', value: 147, goal: 200, icon: Users },
  { label: 'Respostas Recebidas', value: 42, goal: 80, icon: MessageSquare },
  { label: 'Reuniões Agendadas', value: 12, goal: 20, icon: CalendarCheck },
];

const conteudoData = [
  { label: 'Alcance Total', value: '23.4K', numValue: 23400, goal: 30000, icon: Eye },
  { label: 'Engajamento', value: '1.8K', numValue: 1800, goal: 3000, icon: Heart },
  { label: 'Cliques no Link', value: '312', numValue: 312, goal: 500, icon: MousePointerClick },
];

const comercialData = [
  { label: 'Leads Qualificados', value: 38, goal: 50, icon: UserCheck },
  { label: 'Propostas Enviadas', value: 15, goal: 25, icon: FileText },
  { label: 'Vendas Fechadas', value: 6, goal: 10, icon: DollarSign },
];

// ── Metric row inside a card ───────────────────────────────
function MetricRow({
  label,
  value,
  goal,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  goal: number;
  icon: React.ElementType;
}) {
  const numVal = typeof value === 'number' ? value : Number(String(value).replace(/[^\d]/g, ''));
  const pct = Math.min(Math.round((numVal / goal) * 100), 100);

  return (
    <div className="flex items-center gap-4 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316' }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {label}
        </p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            / {goal.toLocaleString('pt-BR')}
          </span>
        </div>
        <Progress value={pct} className="mt-2 h-1.5" />
      </div>
      <span className="text-sm font-semibold" style={{ color: pct >= 100 ? '#22C55E' : '#F97316' }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────
function SectionCard({
  title,
  metrics,
}: {
  title: string;
  metrics: { label: string; value: string | number; goal: number; icon: React.ElementType; numValue?: number }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        {metrics.map((m) => (
          <MetricRow
            key={m.label}
            label={m.label}
            value={m.value}
            goal={m.goal}
            icon={m.icon}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function RelatorioDiario() {
  const dashRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  async function dispararRelatorioN8n() {
    if (!dashRef.current) return;

    setSending(true);
    try {
      // Buscar webhooks ativos do tipo relatorio_diario
      const { data: webhooks, error: whError } = await supabase
        .from('webhooks')
        .select('url')
        .eq('evento', 'relatorio_diario')
        .eq('ativo', true);

      if (whError) throw whError;

      if (!webhooks || webhooks.length === 0) {
        toast.error('Nenhum webhook de Relatório Diário ativo. Configure no Painel Admin → Webhooks.');
        setSending(false);
        return;
      }

      const canvas = await html2canvas(dashRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      const imagem_base64 = canvas.toDataURL('image/png');

      const payload = {
        imagem_base64,
        descricao: 'Relatório Diário Consolidado - Social Selling, Conteúdo e Comercial',
        data_referencia: format(new Date(), 'yyyy-MM-dd'),
      };

      // Disparar para todos os webhooks ativos em paralelo
      const results = await Promise.allSettled(
        webhooks.map((wh) =>
          fetch(wh.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        )
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        toast.warning(`Enviado para ${results.length - failed.length}/${results.length} webhooks.`);
      } else {
        toast.success(`Relatório enviado para ${results.length} webhook(s)!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Falha ao enviar relatório: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setSending(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatório Diário</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(), "dd/MM/yyyy '—' EEEE")}
            </p>
          </div>
          <Button onClick={dispararRelatorioN8n} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Enviando…' : 'Enviar Relatório'}
          </Button>
        </div>

        {/* Dashboard capturável */}
        <div ref={dashRef} className="grid gap-6 md:grid-cols-3">
          <SectionCard title="Social Selling" metrics={socialSellingData} />
          <SectionCard title="Conteúdo" metrics={conteudoData} />
          <SectionCard title="Comercial" metrics={comercialData} />
        </div>
      </div>
    </AppLayout>
  );
}
