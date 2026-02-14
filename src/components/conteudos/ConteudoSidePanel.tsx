import { useState } from 'react';
import { ConteudoMarketing, ConteudoStatus, CONTEUDO_STATUS_LABELS, CONTEUDO_STATUS_LIST, TIPO_CONTEUDO_OPTIONS, ONDE_POSTAR_OPTIONS } from '@/types/conteudo';
import { Profile } from '@/types/crm';
import { useConteudoComentarios, useAddComentario, useDeleteConteudo } from '@/hooks/useConteudos';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Send, Trash2, ExternalLink, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConteudoSidePanelProps {
  conteudo: ConteudoMarketing;
  profiles: Profile[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ConteudoMarketing>) => void;
  onDelete?: (id: string) => void;
}

export function ConteudoSidePanel({ conteudo, profiles, onClose, onUpdate, onDelete }: ConteudoSidePanelProps) {
  const { user } = useAuth();
  const { data: comentarios } = useConteudoComentarios(conteudo.id);
  const addComentario = useAddComentario();
  const deleteConteudo = useDeleteConteudo();
  const [novoComentario, setNovoComentario] = useState('');

  const handleField = (field: keyof ConteudoMarketing, value: any) => {
    onUpdate(conteudo.id, { [field]: value });
  };

  const toggleArrayItem = (field: 'onde_postar' | 'tipo_conteudo', item: string) => {
    const arr = conteudo[field] || [];
    const newArr = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
    handleField(field, newArr);
  };

  const handleSubmitComentario = () => {
    if (!novoComentario.trim() || !user) return;
    addComentario.mutate(
      { conteudo_id: conteudo.id, user_id: user.id, texto: novoComentario.trim() },
      { onSuccess: () => setNovoComentario('') }
    );
  };

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return;
    deleteConteudo.mutate(conteudo.id, {
      onSuccess: () => {
        toast.success('Conteúdo excluído');
        onClose();
      },
      onError: (err: any) => toast.error(err.message || 'Erro ao excluir'),
    });
  };

  const responsavel = profiles.find((p) => p.id === conteudo.responsavel_user_id);

  return (
    <div className="fixed right-0 top-0 z-50 h-screen w-[440px] bg-card border-l border-border shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Detalhes do Conteúdo</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <Label className="text-xs">Título</Label>
            <Input
              value={conteudo.titulo}
              onChange={(e) => handleField('titulo', e.target.value)}
              onBlur={() => {}}
              placeholder="Título do conteúdo"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={conteudo.status} onValueChange={(v) => handleField('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEUDO_STATUS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>{CONTEUDO_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <Label className="text-xs">Responsável</Label>
            <Select
              value={conteudo.responsavel_user_id || 'none'}
              onValueChange={(v) => handleField('responsavel_user_id', v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de publicação */}
          <div className="space-y-1.5">
            <Label className="text-xs">Data de publicação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !conteudo.data_publicacao && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {conteudo.data_publicacao
                    ? format(new Date(conteudo.data_publicacao + 'T12:00:00'), 'dd/MM/yyyy')
                    : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={conteudo.data_publicacao ? new Date(conteudo.data_publicacao + 'T12:00:00') : undefined}
                  onSelect={(date) => handleField('data_publicacao', date ? format(date, 'yyyy-MM-dd') : null)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tipo de conteúdo */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de conteúdo</Label>
            <div className="flex flex-wrap gap-2">
              {TIPO_CONTEUDO_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox
                    checked={conteudo.tipo_conteudo.includes(t)}
                    onCheckedChange={() => toggleArrayItem('tipo_conteudo', t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* Onde postar */}
          <div className="space-y-1.5">
            <Label className="text-xs">Onde postar</Label>
            <div className="flex flex-wrap gap-2">
              {ONDE_POSTAR_OPTIONS.map((o) => (
                <label key={o} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox
                    checked={conteudo.onde_postar.includes(o)}
                    onCheckedChange={() => toggleArrayItem('onde_postar', o)}
                  />
                  {o}
                </label>
              ))}
            </div>
          </div>

          {/* Roteiro */}
          <div className="space-y-1.5">
            <Label className="text-xs">Roteiro</Label>
            <Textarea
              value={conteudo.roteiro || ''}
              onChange={(e) => handleField('roteiro', e.target.value)}
              rows={3}
              placeholder="Roteiro do conteúdo..."
            />
          </div>

          {/* Legenda */}
          <div className="space-y-1.5">
            <Label className="text-xs">Legenda</Label>
            <Textarea
              value={conteudo.legenda || ''}
              onChange={(e) => handleField('legenda', e.target.value)}
              rows={3}
              placeholder="Legenda para publicação..."
            />
          </div>

          {/* Link do Drive */}
          <div className="space-y-1.5">
            <Label className="text-xs">Link do Drive</Label>
            <div className="flex gap-2">
              <Input
                value={conteudo.link_drive || ''}
                onChange={(e) => handleField('link_drive', e.target.value)}
                placeholder="https://drive.google.com/..."
              />
              {conteudo.link_drive && (
                <Button variant="outline" size="icon" asChild>
                  <a href={conteudo.link_drive} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Comentários */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Comentários</Label>

            {comentarios && comentarios.length > 0 ? (
              <div className="space-y-3">
                {comentarios.map((c) => {
                  const author = profiles.find((p) => p.id === c.user_id);
                  return (
                    <div key={c.id} className="flex gap-2">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[10px] bg-muted">
                          {author?.nome?.slice(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium">{author?.nome || 'Usuário'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(c.criado_em), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.texto}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
            )}

            <div className="flex gap-2">
              <Input
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Escreva um comentário..."
                className="text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComentario()}
              />
              <Button
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={handleSubmitComentario}
                disabled={!novoComentario.trim() || addComentario.isPending}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
