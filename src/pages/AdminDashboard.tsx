import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Building2, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { useAlmoxarifadoItens } from '@/hooks/useAlmoxarifado';
import { usePatrimonioBens, calcDepreciacaoAcumulada } from '@/hooks/usePatrimonio';
import { useProfiles } from '@/hooks/useProfiles';
import { useNavigate } from 'react-router-dom';
import { SectionLabel } from '@/components/dashboard/SectionLabel';

export default function AdminDashboard() {
  const { data: itens = [] } = useAlmoxarifadoItens();
  const { data: bens = [] } = usePatrimonioBens();
  const { data: profiles = [] } = useProfiles();
  const navigate = useNavigate();

  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    (profiles as any[]).forEach(p => { m[p.id] = p.nome; });
    return m;
  }, [profiles]);

  const itensAtivos = itens.filter(i => i.ativo);
  const abaixoMinimo = itensAtivos.filter(i => i.quantidade_atual < i.estoque_minimo);
  const bensAtivos = bens.filter(b => b.status === 'Ativo');
  const totalValorCompra = bensAtivos.reduce((s, b) => s + b.valor_compra, 0);

  const depData = bensAtivos.map(b => calcDepreciacaoAcumulada(b.valor_compra, b.valor_residual_pct, b.vida_util_anos, b.data_aquisicao));
  const totalDepAcumulada = depData.reduce((s, d) => s + d.depAcumulada, 0);
  const totalValorAtual = depData.reduce((s, d) => s + d.valorAtual, 0);

  const bensSemResponsavel = bensAtivos.filter(b => !b.responsavel_user_id);
  const bensRuim = bensAtivos.filter(b => b.estado_conservacao === 'Ruim');

  const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AppLayout>
      <PageHeader title="Dashboard Administrativo" description="Visão geral do almoxarifado e patrimônio" />

      <SectionLabel title="KPIs" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard icon={Package} label="Itens no Almoxarifado" value={itensAtivos.length.toString()} />
        <KPICard icon={AlertTriangle} label="Abaixo do Mínimo" value={abaixoMinimo.length.toString()} alert={abaixoMinimo.length > 0} />
        <KPICard icon={Building2} label="Bens Patrimoniais" value={bensAtivos.length.toString()} />
        <KPICard icon={DollarSign} label="Valor Total Patrimônio" value={fmtCurrency(totalValorCompra)} />
        <KPICard icon={TrendingDown} label="Depreciação Acumulada" value={fmtCurrency(totalDepAcumulada)} negative />
        <KPICard icon={DollarSign} label="Valor Patrimonial Atual" value={fmtCurrency(totalValorAtual)} positive />
      </div>

      {(abaixoMinimo.length > 0 || bensSemResponsavel.length > 0 || bensRuim.length > 0) && (
        <>
          <SectionLabel title="Alertas" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {abaixoMinimo.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(0, 84%, 60%)' }} />
                    Estoque Baixo ({abaixoMinimo.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {abaixoMinimo.slice(0, 5).map(i => (
                    <div key={i.id} className="flex items-center justify-between text-sm">
                      <span>{i.nome} <span className="text-muted-foreground">({i.quantidade_atual}/{i.estoque_minimo})</span></span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate('/administrativo/almoxarifado')}>Repor</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {bensSemResponsavel.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(38, 92%, 50%)' }} />
                    Sem Responsável ({bensSemResponsavel.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {bensSemResponsavel.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <span>{b.tombamento} — {b.descricao}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {bensRuim.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(0, 84%, 60%)' }} />
                    Conservação Ruim ({bensRuim.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {bensRuim.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <span>{b.tombamento} — {b.descricao}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

function KPICard({ icon: Icon, label, value, alert, positive, negative }: {
  icon: any; label: string; value: string; alert?: boolean; positive?: boolean; negative?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{
            color: alert ? 'hsl(0, 84%, 60%)' : positive ? 'hsl(142, 71%, 45%)' : negative ? 'hsl(0, 84%, 60%)' : undefined
          }}>{value}</span>
          {alert && <Badge variant="destructive" className="text-xs">!</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
