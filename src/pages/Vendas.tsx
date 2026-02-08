import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useVendas } from '@/hooks/useVendas';
import { useClosers } from '@/hooks/useProfiles';
import { VendaStatus, VENDA_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from '@/types/crm';
import { DollarSign, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function VendasPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closerFilter, setCloserFilter] = useState<string>('all');
  
  const { data: vendas, isLoading } = useVendas();
  const { data: closers } = useClosers();

  const filteredVendas = vendas?.filter(venda => {
    const matchesStatus = statusFilter === 'all' || venda.status === statusFilter;
    const matchesCloser = closerFilter === 'all' || venda.closer_user_id === closerFilter;
    return matchesStatus && matchesCloser;
  });

  const totalFaturamento = filteredVendas?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;
  const totalVendas = filteredVendas?.length || 0;
  const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AppLayout>
      <PageHeader title="Vendas" description="Contratos e faturamento" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl font-bold">{totalVendas}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalFaturamento)}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(ticketMedio)}</p>
              </div>
              <div className="p-3 rounded-lg bg-info/10">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(VENDA_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={closerFilter} onValueChange={setCloserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os closers</SelectItem>
            {closers?.map(closer => (
              <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Closer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredVendas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendas?.map(venda => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{(venda.lead as any)?.nome_pessoa}</p>
                        <p className="text-sm text-muted-foreground">{(venda.lead as any)?.nome_empresa}</p>
                      </div>
                    </TableCell>
                    <TableCell>{venda.plano_nome}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-success">{formatCurrency(venda.valor_total)}</p>
                        {venda.entrada_valor > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Entrada: {formatCurrency(venda.entrada_valor)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{FORMA_PAGAMENTO_LABELS[venda.forma_pagamento]}</p>
                        {venda.detalhes_pagamento && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {venda.detalhes_pagamento}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(venda.data_inicio), 'dd/MM/yy')} - {format(new Date(venda.data_fim), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>{(venda.closer as any)?.nome}</TableCell>
                    <TableCell>
                      <StatusBadge status={venda.status} type="venda" />
                    </TableCell>
                    <TableCell>
                      <Link to={`/leads/${venda.lead_id}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
