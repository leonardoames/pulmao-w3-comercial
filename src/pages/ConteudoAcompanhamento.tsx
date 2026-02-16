import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  useContentPostItems,
  useAutoGenerateRequiredItems,
  useCreateContentPostItem,
  useUpdateContentPostItem,
  useDeleteContentPostItem,
  useUpsertContentDailyLog,
  useContentDailyLogs,
} from '@/hooks/useContentTracking';
import { useCanAccessAdminPanel } from '@/hooks/useUserRoles';
import {
  ContentPostItem,
  ContentItemType,
  ContentItemStatus,
  ContentItemPlatform,
  CONTENT_ITEM_TYPE_LABELS,
  CONTENT_ITEM_STATUS_LABELS,
  CONTENT_ITEM_STATUS_COLORS,
  CONTENT_ITEM_PLATFORM_LABELS,
  STATUS_CYCLE,
} from '@/types/content';
import { CalendarIcon, Plus, Trash2, Lock, Save, CheckCircle, Clock, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ConteudoAcompanhamento() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const canEdit = useCanAccessAdminPanel();
  const { data: items = [], isLoading } = useContentPostItems(dateStr);
  const autoGenerate = useAutoGenerateRequiredItems();
  const createItem = useCreateContentPostItem();
  const updateItem = useUpdateContentPostItem();
  const deleteItem = useDeleteContentPostItem();
  const upsertLog = useUpsertContentDailyLog();
  const { data: logs = [] } = useContentDailyLogs(dateStr, dateStr);

  const dayLog = logs[0];

  const [followersGained, setFollowersGained] = useState('0');
  const [notes, setNotes] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<ContentItemType>('reels');
  const [newPlatform, setNewPlatform] = useState<ContentItemPlatform>('instagram');

  useEffect(() => {
    if (dayLog) {
      setFollowersGained(String(dayLog.followers_gained));
      setNotes(dayLog.notes || '');
    } else {
      setFollowersGained('0');
      setNotes('');
    }
  }, [dayLog]);

  // Auto-generate required items for selected date
  useEffect(() => {
    if (canEdit && !isLoading) {
      autoGenerate.mutate({ date: dateStr });
    }
  }, [dateStr, canEdit, isLoading]);

  const requiredItems = useMemo(() => items.filter(i => i.is_required), [items]);
  const additionalItems = useMemo(() => items.filter(i => !i.is_required), [items]);

  const counters = useMemo(() => {
    const feitos = items.filter(i => i.status === 'feito' && i.type !== 'stories');
    const stories = items.filter(i => i.status === 'feito' && i.type === 'stories');
    const youtube = items.filter(i => i.status === 'feito' && i.type === 'youtube');
    const agendados = items.filter(i => i.status === 'agendado');
    return {
      posts: feitos.length,
      stories: stories.length,
      youtube: youtube.length,
      agendados: agendados.length,
    };
  }, [items]);

  const cycleStatus = (item: ContentPostItem) => {
    if (!canEdit) return;
    const idx = STATUS_CYCLE.indexOf(item.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    updateItem.mutate({ id: item.id, status: next });
  };

  const handleSaveLog = () => {
    upsertLog.mutate({
      date: dateStr,
      followers_gained: parseInt(followersGained) || 0,
      posts_published_count: counters.posts,
      posts_scheduled_count: counters.agendados,
      stories_done_count: counters.stories,
      youtube_videos_published_count: counters.youtube,
      notes,
    }, {
      onSuccess: () => toast.success('Registro salvo!'),
      onError: () => toast.error('Erro ao salvar'),
    });
  };

  const handleAddItem = () => {
    if (!newLabel.trim()) return;
    createItem.mutate({
      date: dateStr,
      type: newType,
      label: newLabel,
      platform: newPlatform,
      status: 'pendente',
      is_required: false,
    }, {
      onSuccess: () => {
        setNewLabel('');
        setAddDialogOpen(false);
        toast.success('Item adicionado');
      },
    });
  };

  const statusIcon = (status: ContentItemStatus) => {
    switch (status) {
      case 'feito': return <CheckCircle className="h-4 w-4" />;
      case 'agendado': return <CalendarCheck className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const renderItem = (item: ContentPostItem) => (
    <div key={item.id} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-background/50 border border-border/50 group">
      <Badge variant="outline" className="text-xs shrink-0">
        {CONTENT_ITEM_TYPE_LABELS[item.type]}
      </Badge>
      <span className="flex-1 text-sm">{item.label}</span>
      <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">
        {CONTENT_ITEM_PLATFORM_LABELS[item.platform]}
      </Badge>
      {item.is_required && (
        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <button
        onClick={() => cycleStatus(item)}
        disabled={!canEdit}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
          CONTENT_ITEM_STATUS_COLORS[item.status],
          canEdit && 'cursor-pointer hover:opacity-80',
          !canEdit && 'opacity-60 cursor-not-allowed',
        )}
      >
        {statusIcon(item.status)}
        {CONTENT_ITEM_STATUS_LABELS[item.status]}
      </button>
      {!item.is_required && canEdit && (
        <button
          onClick={() => deleteItem.mutate(item.id)}
          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <PageHeader title="Acompanhamento Diário" description="Registro operacional do conteúdo" />
          <div className="flex items-center gap-3">
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
                  onSelect={(d) => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {canEdit && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Adicionar conteúdo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Descrição</Label>
                      <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Reels sobre bastidores" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select value={newType} onValueChange={v => setNewType(v as ContentItemType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(CONTENT_ITEM_TYPE_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Plataforma</Label>
                        <Select value={newPlatform} onValueChange={v => setNewPlatform(v as ContentItemPlatform)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(CONTENT_ITEM_PLATFORM_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAddItem} className="w-full bg-primary text-primary-foreground">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Posts feitos', value: counters.posts, color: 'text-success' },
            { label: 'Stories feitos', value: counters.stories, color: 'text-warning' },
            { label: 'YouTube', value: counters.youtube, color: 'text-destructive' },
            { label: 'Agendados', value: counters.agendados, color: 'text-primary' },
          ].map(c => (
            <Card key={c.label} className="bg-card border-border">
              <CardContent className="py-4 px-4 text-center">
                <p className={cn("text-2xl font-bold", c.color)}>{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Required Items */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Obrigatórios do dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Carregando...</p>
            ) : requiredItems.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Nenhum item obrigatório</p>
            ) : (
              requiredItems.map(renderItem)
            )}
          </CardContent>
        </Card>

        {/* Additional Items */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Conteúdo adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {additionalItems.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Nenhum item adicional</p>
            ) : (
              additionalItems.map(renderItem)
            )}
          </CardContent>
        </Card>

        {/* Manual Metrics */}
        {canEdit && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Métricas do dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Seguidores ganhos</Label>
                  <Input type="number" value={followersGained} onChange={e => setFollowersGained(e.target.value)} />
                </div>
                <div>
                  <Label>Notas do dia</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
                </div>
              </div>
              <Button onClick={handleSaveLog} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="h-4 w-4" />
                Salvar registro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
