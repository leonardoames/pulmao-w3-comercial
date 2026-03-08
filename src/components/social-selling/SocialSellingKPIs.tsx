import { StatCard } from '@/components/ui/stat-card';
import { MessageCircle, Link2, FileText, CalendarCheck, ArrowRight } from 'lucide-react';

interface KPIData {
  conversas: number;
  convites: number;
  formularios: number;
  agendamentos: number;
  prevConversas: number;
  prevConvites: number;
  prevFormularios: number;
  prevAgendamentos: number;
}

function pctChange(current: number, previous: number): { value: number; isPositive: boolean } | undefined {
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return { value: 100, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.round(Math.abs(change)), isPositive: change >= 0 };
}

function safePct(num: number, den: number): string {
  if (den === 0) return '0%';
  return ((num / den) * 100).toFixed(1) + '%';
}

function conversionColor(num: number, den: number): string {
  if (den === 0) return '#EF4444';
  const pct = (num / den) * 100;
  if (pct > 30) return '#22C55E';
  if (pct >= 10) return '#FBBF24';
  return '#EF4444';
}

export function SocialSellingKPIs({ data }: { data: KPIData }) {
  const {
    conversas, convites, formularios, agendamentos,
    prevConversas, prevConvites, prevFormularios, prevAgendamentos,
  } = data;

  // Conversion rates
  const convToConvite = safePct(convites, conversas);
  const conviteToForm = safePct(formularios, convites);
  const formToAgend = safePct(agendamentos, formularios);

  // Previous conversion rates for comparison
  const prevConvToConvite = prevConversas > 0 ? (prevConvites / prevConversas) * 100 : 0;
  const prevConviteToForm = prevConvites > 0 ? (prevFormularios / prevConvites) * 100 : 0;
  const prevFormToAgend = prevFormularios > 0 ? (prevAgendamentos / prevFormularios) * 100 : 0;

  const currConvToConvite = conversas > 0 ? (convites / conversas) * 100 : 0;
  const currConviteToForm = convites > 0 ? (formularios / convites) * 100 : 0;
  const currFormToAgend = formularios > 0 ? (agendamentos / formularios) * 100 : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Row 1: Volume metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Conversas Iniciadas"
          value={conversas.toLocaleString('pt-BR')}
          icon={<MessageCircle className="h-5 w-5" style={{ color: '#0EA5E9' }} />}
          trend={pctChange(conversas, prevConversas)}
          subtitle="vs período anterior"
        />
        <StatCard
          title="Convites Enviados"
          value={convites.toLocaleString('pt-BR')}
          icon={<Link2 className="h-5 w-5" style={{ color: '#8B5CF6' }} />}
          trend={pctChange(convites, prevConvites)}
          subtitle="vs período anterior"
        />
        <StatCard
          title="Formulários Enviados"
          value={formularios.toLocaleString('pt-BR')}
          icon={<FileText className="h-5 w-5" style={{ color: '#F97316' }} />}
          trend={pctChange(formularios, prevFormularios)}
          subtitle="vs período anterior"
        />
        <StatCard
          title="Agendamentos Gerados"
          value={agendamentos.toLocaleString('pt-BR')}
          icon={<CalendarCheck className="h-5 w-5" style={{ color: '#22C55E' }} />}
          trend={pctChange(agendamentos, prevAgendamentos)}
          subtitle="vs período anterior"
        />
      </div>

      {/* Row 2: Conversion metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Conversa → Convite"
          value={convToConvite}
          icon={<ArrowRight className="h-5 w-5" style={{ color: conversionColor(convites, conversas) }} />}
          trend={pctChange(currConvToConvite, prevConvToConvite)}
          subtitle="vs período anterior"
        />
        <StatCard
          title="Convite → Formulário"
          value={conviteToForm}
          icon={<ArrowRight className="h-5 w-5" style={{ color: conversionColor(formularios, convites) }} />}
          trend={pctChange(currConviteToForm, prevConviteToForm)}
          subtitle="vs período anterior"
        />
        <StatCard
          title="Formulário → Agendamento"
          value={formToAgend}
          icon={<ArrowRight className="h-5 w-5" style={{ color: conversionColor(agendamentos, formularios) }} />}
          trend={pctChange(currFormToAgend, prevFormToAgend)}
          subtitle="vs período anterior"
        />
      </div>
    </div>
  );
}
