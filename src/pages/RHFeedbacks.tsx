import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { useRHFeedbacks, useCreateFeedback, useRHColaboradores } from '@/hooks/useRH';
import { useProfiles } from '@/hooks/useProfiles';
import { TIPO_FEEDBACK_LABELS, TIPO_FEEDBACK_COLORS, type TipoFeedback } from '@/types/rh';
import { format } from 'date-fns';

export default function RHFeedbacks() {
  const { data: feedbacks = [] } = useRHFeedbacks();
  const { data: colaboradores = [] } = useRHColaboradores();
  const { data: profiles = [] } = useProfiles();
  const createFeedback = useCreateFeedback();

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    colaborador_id: '',
    tipo: 'neutro' as TipoFeedback,
    titulo: '',
    conteudo: '',
    visibilidade: 'gestor' as 'gestor' | 'admin_only',
  });

  const colabMap = useMemo(() => new Map(colaboradores.map(c => [c.id, c])), [colaboradores]);
  const profileMap = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(fb => {
      if (filterTipo !== 'all' && fb.tipo !== filterTipo) return false;
      if (search) {
        const colab = colabMap.get(fb.colaborador_id);
        if (!colab?.nome.toLowerCase().includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [feedbacks, filterTipo, search, colabMap]);

  const handleCreate = () => {
    if (!form.colaborador_id || !form.titulo || form.conteudo.length < 20) return;
    createFeedback.mutate({
      colaborador_id: form.colaborador_id,
      tipo: form.tipo,
      titulo: form.titulo,
      conteudo: form.conteudo,
      visibilidade: form.visibilidade,
    }, {
      onSuccess: () => {
        setShowNew(false);
        setForm({ colaborador_id: '', tipo: 'neutro', titulo: '', conteudo: '', visibilidade: 'gestor' });
      },
    });
  };

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Feedbacks" description="Registro de feedbacks dos colaboradores">
          <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Novo Feedback</Button>
        </PageHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por colaborador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(TIPO_FEEDBACK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {filteredFeedbacks.map(fb => {
            const colab = colabMap.get(fb.colaborador_id);
            const autor = profileMap.get(fb.autor_id);
            const isExpanded = expanded.has(fb.id);
            return (
              <div key={fb.id} className="rounded-xl p-4" style={{ borderLeft: `4px solid ${TIPO_FEEDBACK_COLORS[fb.tipo as keyof typeof TIPO_FEEDBACK_COLORS]}`, background: 'hsl(0, 0%, 9%)', border: '1px solid hsla(0, 0%, 100%, 0.07)', borderLeftWidth: '4px', borderLeftColor: TIPO_FEEDBACK_COLORS[fb.tipo as keyof typeof TIPO_FEEDBACK_COLORS] }}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{colab?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{colab?.nome || 'Colaborador'}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: TIPO_FEEDBACK_COLORS[fb.tipo as keyof typeof TIPO_FEEDBACK_COLORS], color: TIPO_FEEDBACK_COLORS[fb.tipo as keyof typeof TIPO_FEEDBACK_COLORS] }}>{TIPO_FEEDBACK_LABELS[fb.tipo as keyof typeof TIPO_FEEDBACK_LABELS]}</Badge>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(fb.created_at), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold mt-1">{fb.titulo}</p>
                    <p className="text-[13px] mt-1" style={{ color: 'hsla(0, 0%, 100%, 0.7)', display: '-webkit-box', WebkitLineClamp: isExpanded ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: isExpanded ? 'visible' : 'hidden' } as any}>{fb.conteudo}</p>
                    {fb.conteudo.length > 200 && <button onClick={() => toggleExpand(fb.id)} className="text-xs text-primary mt-1">{isExpanded ? 'Ver menos' : 'Ver mais'}</button>}
                    <p className="text-[11px] text-muted-foreground mt-2">Registrado por {autor?.nome || 'Desconhecido'}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredFeedbacks.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum feedback encontrado.</div>}
        </div>
      </div>

      {/* New Feedback Sheet */}
      <Sheet open={showNew} onOpenChange={setShowNew}>
        <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto">
          <SheetHeader><SheetTitle>Novo Feedback</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.colaborador_id} onValueChange={v => setForm(f => ({ ...f, colaborador_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo *</Label>
              <RadioGroup value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as TipoFeedback }))} className="flex gap-3 mt-2">
                {(Object.entries(TIPO_FEEDBACK_LABELS) as [TipoFeedback, string][]).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value={k} />
                    <div className="w-2 h-2 rounded-full" style={{ background: TIPO_FEEDBACK_COLORS[k] }} />
                    <span className="text-sm">{v}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
            <div>
              <Label>Conteúdo * <span className="text-muted-foreground text-xs">(mín. 20 caracteres)</span></Label>
              <Textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} rows={5} />
            </div>
            <div className="flex items-center gap-3">
              <Label>Visibilidade:</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Gestor e Admin</span>
                <Switch checked={form.visibilidade === 'admin_only'} onCheckedChange={c => setForm(f => ({ ...f, visibilidade: c ? 'admin_only' : 'gestor' }))} />
                <span className="text-sm text-muted-foreground">Somente Admin</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowNew(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} disabled={!form.colaborador_id || !form.titulo || form.conteudo.length < 20 || createFeedback.isPending} className="flex-1 bg-primary hover:bg-primary/90">Salvar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
