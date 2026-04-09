import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ContentDailyLog,
  ContentPostItem,
  ContentItemStatus,
  DAILY_REQUIRED_TEMPLATE,
  CONTENT_ITEM_STATUS_LABELS,
  RESPONSIBLE_OPTIONS,
} from '@/types/content';
import {
  useUpsertContentDailyLog,
  useReplaceContentPostItems,
  useContentPostItems,
} from '@/hooks/useContentTracking';
import { supabase } from '@/integrations/supabase/client';
import { useLatestFollowersCount } from '@/hooks/useInstagram';

interface AdditionalPost {
  platform: 'instagram' | 'youtube';
  status: ContentItemStatus;
  title: string;
  description: string;
}

interface DailyLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLog?: ContentDailyLog | null;
}

const STATUS_OPTIONS: { value: ContentItemStatus; label: string; className: string }[] = [
  { value: 'pendente', label: 'Não fez', className: 'bg-muted text-muted-foreground' },
  { value: 'feito', label: 'Publicado', className: 'bg-success/15 text-success' },
  { value: 'agendado', label: 'Agendado', className: 'bg-warning/15 text-warning' },
];

export function DailyLogModal({ open, onOpenChange, editLog }: DailyLogModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [responsibleName, setResponsibleName] = useState('Otto');
  const [requiredStatuses, setRequiredStatuses] = useState<ContentItemStatus[]>(
    DAILY_REQUIRED_TEMPLATE.map(() => 'pendente')
  );
  const [additionalPosts, setAdditionalPosts] = useState<AdditionalPost[]>([]);
  const [storiesCount, setStoriesCount] = useState('0');
  const [youtubeCount, setYoutubeCount] = useState('0');
  const [followersLeo, setFollowersLeo] = useState('0');
  const [followersW3, setFollowersW3] = useState('0');
  const [notes, setNotes] = useState('');

  const dateStr = format(date, 'yyyy-MM-dd');
  const { data: existingItems = [] } = useContentPostItems(editLog ? editLog.date : undefined);
  const upsertLog = useUpsertContentDailyLog();
  const replaceItems = useReplaceContentPostItems();
  const { data: latestFollowers } = useLatestFollowersCount();

  // Populate form when editing
  useEffect(() => {
    if (editLog && open) {
      setDate(new Date(editLog.date + 'T12:00:00'));
      setResponsibleName(editLog.responsible_name || 'Otto');
      setStoriesCount(String(editLog.stories_done_count));
      setYoutubeCount(String(editLog.youtube_videos_published_count));
      setFollowersLeo(String(editLog.followers_leo));
      setFollowersW3(String(editLog.followers_w3));
      setNotes(editLog.notes || '');
    } else if (open) {
      resetForm(latestFollowers);
    }
  }, [editLog, open, latestFollowers]);

  // Populate required statuses and additional posts from existing items
  useEffect(() => {
    if (editLog && existingItems.length > 0) {
      const reqItems = existingItems.filter(i => i.is_required);
      const addItems = existingItems.filter(i => !i.is_required);

      const statuses = DAILY_REQUIRED_TEMPLATE.map((tmpl, idx) => {
        const match = reqItems[idx];
        return match ? match.status : 'pendente' as ContentItemStatus;
      });
      setRequiredStatuses(statuses);

      setAdditionalPosts(addItems.map(i => ({
        platform: (i.platform === 'youtube' ? 'youtube' : 'instagram') as 'instagram' | 'youtube',
        status: i.status,
        title: i.label,
        description: '',
      })));
    }
  }, [editLog, existingItems]);

  const resetForm = (followers?: { leo: number; w3: number }) => {
    setDate(new Date());
    setResponsibleName('Otto');
    setRequiredStatuses(DAILY_REQUIRED_TEMPLATE.map(() => 'pendente'));
    setAdditionalPosts([]);
    setStoriesCount('0');
    setYoutubeCount('0');
    setFollowersLeo(String(followers?.leo ?? 0));
    setFollowersW3(String(followers?.w3 ?? 0));
    setNotes('');
  };

  const cycleStatus = (index: number) => {
    setRequiredStatuses(prev => {
      const next = [...prev];
      const cycle: ContentItemStatus[] = ['pendente', 'feito', 'agendado'];
      const idx = cycle.indexOf(next[index]);
      next[index] = cycle[(idx + 1) % cycle.length];
      return next;
    });
  };

  const cycleAdditionalStatus = (index: number) => {
    setAdditionalPosts(prev => {
      const next = [...prev];
      const cycle: ContentItemStatus[] = ['pendente', 'feito', 'agendado'];
      const idx = cycle.indexOf(next[index].status);
      next[index] = { ...next[index], status: cycle[(idx + 1) % cycle.length] };
      return next;
    });
  };

  const addPost = () => {
    setAdditionalPosts(prev => [...prev, { platform: 'instagram', status: 'pendente', title: '', description: '' }]);
  };

  const removePost = (index: number) => {
    setAdditionalPosts(prev => prev.filter((_, i) => i !== index));
  };

  const updatePost = (index: number, field: keyof AdditionalPost, value: string) => {
    setAdditionalPosts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const allStatuses = [...requiredStatuses, ...additionalPosts.map(p => p.status)];
    const publishedCount = allStatuses.filter(s => s === 'feito').length;
    const scheduledCount = allStatuses.filter(s => s === 'agendado').length;
    const saveDateStr = format(date, 'yyyy-MM-dd');

    try {
      await upsertLog.mutateAsync({
        date: saveDateStr,
        responsible_name: responsibleName,
        followers_leo: parseInt(followersLeo) || 0,
        followers_w3: parseInt(followersW3) || 0,
        followers_gained: (parseInt(followersLeo) || 0) + (parseInt(followersW3) || 0),
        posts_published_count: publishedCount,
        posts_scheduled_count: scheduledCount,
        stories_done_count: parseInt(storiesCount) || 0,
        youtube_videos_published_count: parseInt(youtubeCount) || 0,
        notes,
      });

      const postItems = [
        ...DAILY_REQUIRED_TEMPLATE.map((tmpl, idx) => ({
          date: saveDateStr,
          type: tmpl.type,
          label: tmpl.label,
          platform: tmpl.platform,
          status: requiredStatuses[idx],
          is_required: true,
          created_by: userData.user!.id,
        })),
        ...additionalPosts.map(p => ({
          date: saveDateStr,
          type: 'other' as const,
          label: p.title || 'Post adicional',
          platform: p.platform as any,
          status: p.status,
          is_required: false,
          created_by: userData.user!.id,
        })),
      ];

      await replaceItems.mutateAsync({ date: saveDateStr, items: postItems });
      toast.success('Registro salvo!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar registro');
    }
  };

  const getStatusButton = (status: ContentItemStatus) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status)!;
    return (
      <span className={cn('px-3 py-1 rounded-full text-xs font-medium cursor-pointer select-none', opt.className)}>
        {opt.label}
      </span>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{editLog ? 'Editar registro' : 'Novo registro do dia'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Bloco A: Data + Responsável */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(date, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { if (d) { setDate(d); setCalendarOpen(false); } }}
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={responsibleName} onValueChange={setResponsibleName}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_OPTIONS.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bloco B: Posts obrigatórios */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Posts obrigatórios</Label>
            <div className="space-y-2">
              {DAILY_REQUIRED_TEMPLATE.map((tmpl, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background/50 border border-border/50">
                  <span className="flex-1 text-sm">{tmpl.label}</span>
                  <button onClick={() => cycleStatus(idx)}>
                    {getStatusButton(requiredStatuses[idx])}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bloco C: Posts adicionais */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Posts adicionais</Label>
              <Button variant="outline" size="sm" onClick={addPost} className="gap-1">
                <Plus className="h-3 w-3" /> Adicionar post
              </Button>
            </div>
            {additionalPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">Nenhum post adicional</p>
            ) : (
              <div className="space-y-3">
                {additionalPosts.map((post, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Select value={post.platform} onValueChange={v => updatePost(idx, 'platform', v)}>
                        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                      <button onClick={() => cycleAdditionalStatus(idx)}>
                        {getStatusButton(post.status)}
                      </button>
                      <button onClick={() => removePost(idx)} className="ml-auto text-destructive hover:text-destructive/80">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      placeholder="Título do post"
                      value={post.title}
                      onChange={e => updatePost(idx, 'title', e.target.value)}
                    />
                    <Textarea
                      placeholder="Descrição (opcional)"
                      value={post.description}
                      onChange={e => updatePost(idx, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloco D + E: Stories + YouTube */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantidade de stories do dia</Label>
              <Input type="number" min="0" value={storiesCount} onChange={e => setStoriesCount(e.target.value)} />
            </div>
            <div>
              <Label>YouTube publicados</Label>
              <Input type="number" min="0" value={youtubeCount} onChange={e => setYoutubeCount(e.target.value)} />
            </div>
          </div>

          {/* Bloco F: Seguidores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Seguidores @leo</Label>
              <Input type="number" min="0" value={followersLeo} onChange={e => setFollowersLeo(e.target.value)} />
            </div>
            <div>
              <Label>Seguidores @w3</Label>
              <Input type="number" min="0" value={followersW3} onChange={e => setFollowersW3(e.target.value)} />
            </div>
          </div>

          {/* Bloco G: Observação */}
          <div>
            <Label>Observação do dia</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Anotações sobre o dia..." />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={upsertLog.isPending || replaceItems.isPending}
            >
              Salvar registro
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
