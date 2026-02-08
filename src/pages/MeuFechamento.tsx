import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMeuFechamento, useFechamentos, useUpsertFechamento } from '@/hooks/useFechamentos';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, Save, Phone, PhoneOff, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function MeuFechamentoPage() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: fechamento, isLoading } = useMeuFechamento(profile?.id || '', dateStr);
  const { data: meusFechamentos } = useFechamentos({ 
    closer_id: profile?.id,
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const upsertFechamento = useUpsertFechamento();

  const [callsRealizadas, setCallsRealizadas] = useState<number>(0);
  const [noShow, setNoShow] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');

  // Atualizar form quando fechamento carregar
  useState(() => {
    if (fechamento) {
      setCallsRealizadas(fechamento.calls_realizadas);
      setNoShow(fechamento.no_show);
      setObservacoes(fechamento.observacoes || '');
    } else {
      setCallsRealizadas(0);
      setNoShow(0);
      setObservacoes('');
    }
  });

  // Update form when date changes or data loads
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  // Reset form when fechamento data loads
  if (fechamento && callsRealizadas === 0 && noShow === 0 && !observacoes) {
    setCallsRealizadas(fechamento.calls_realizadas);
    setNoShow(fechamento.no_show);
    setObservacoes(fechamento.observacoes || '');
  }

  const handleSave = async () => {
    if (!profile) return;
    
    await upsertFechamento.mutateAsync({
      data: dateStr,
      closer_user_id: profile.id,
      calls_realizadas: callsRealizadas,
      no_show: noShow,
      observacoes: observacoes || undefined,
    });
  };

  const callsAgendadas = callsRealizadas + noShow;

  // Stats dos últimos 30 dias
  const stats = meusFechamentos?.reduce((acc, f) => ({
    callsRealizadas: acc.callsRealizadas + f.calls_realizadas,
    noShow: acc.noShow + f.no_show,
  }), { callsRealizadas: 0, noShow: 0 });

  const totalAgendadas = (stats?.callsRealizadas || 0) + (stats?.noShow || 0);
  const percentNoShow = totalAgendadas > 0 ? ((stats?.noShow || 0) / totalAgendadas) * 100 : 0;

  return (
    <AppLayout>
      <PageHeader
        title="Meu Fechamento"
        description="Registre suas calls diárias"
      />

      {/* Stats últimos 30 dias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calls Realizadas (30d)</p>
                <p className="text-2xl font-bold">{stats?.callsRealizadas || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <Phone className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No-Shows (30d)</p>
                <p className="text-2xl font-bold">{stats?.noShow || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <PhoneOff className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">% No-Show (30d)</p>
                <p className="text-2xl font-bold">{percentNoShow.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fechamento do Dia</span>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calls_realizadas">Calls Realizadas</Label>
                    <Input
                      id="calls_realizadas"
                      type="number"
                      min="0"
                      value={callsRealizadas}
                      onChange={(e) => setCallsRealizadas(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="no_show">No-Shows</Label>
                    <Input
                      id="no_show"
                      type="number"
                      min="0"
                      value={noShow}
                      onChange={(e) => setNoShow(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Calls Agendadas (calculado)</p>
                  <p className="text-2xl font-bold">{callsAgendadas}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    placeholder="Alguma observação sobre o dia..."
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full gap-2"
                  disabled={upsertFechamento.isPending}
                >
                  <Save className="h-4 w-4" />
                  Salvar Fechamento
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Realizadas</TableHead>
                  <TableHead className="text-center">No-Show</TableHead>
                  <TableHead className="text-center">Agendadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meusFechamentos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum fechamento registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  meusFechamentos?.map(f => (
                    <TableRow 
                      key={f.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        f.data === dateStr && "bg-primary/10"
                      )}
                      onClick={() => setSelectedDate(new Date(f.data + 'T12:00:00'))}
                    >
                      <TableCell className="font-medium">
                        {format(new Date(f.data + 'T12:00:00'), 'dd/MM')}
                      </TableCell>
                      <TableCell className="text-center">{f.calls_realizadas}</TableCell>
                      <TableCell className="text-center text-destructive">{f.no_show}</TableCell>
                      <TableCell className="text-center font-medium">{f.calls_agendadas}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
