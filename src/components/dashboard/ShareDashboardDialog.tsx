import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, Copy, Trash2, Link, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const EXPIRATION_OPTIONS = [
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'never', label: 'Sem expiração' },
];

function getExpirationDate(option: string): string | null {
  const now = new Date();
  switch (option) {
    case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return null;
  }
}

export function ShareDashboardDialog() {
  const [open, setOpen] = useState(false);
  const [expiration, setExpiration] = useState('7d');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: links, isLoading } = useQuery({
    queryKey: ['shared-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_links' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: open,
  });

  const createLink = useMutation({
    mutationFn: async () => {
      const expiresAt = getExpirationDate(expiration);
      const { data, error } = await supabase
        .from('shared_links' as any)
        .insert({
          created_by: user?.id,
          expires_at: expiresAt,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links'] });
      toast.success('Link criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar link'),
  });

  const deactivateLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shared_links' as any)
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links'] });
      toast.success('Link desativado');
    },
  });

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`;
  };

  const copyLink = async (token: string, id: string) => {
    await navigator.clipboard.writeText(getShareUrl(token));
    setCopiedId(id);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Compartilhar Dashboard
          </DialogTitle>
          <DialogDescription>
            Gere um link público para visualização do dashboard (somente leitura).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new link */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Expiração</label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => createLink.mutate()} disabled={createLink.isPending}>
              Gerar Link
            </Button>
          </div>

          {/* Active links */}
          {links && links.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Links ativos</p>
              {links.map((link: any) => {
                const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                return (
                  <div key={link.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                    <div className="flex-1 min-w-0">
                      <Input
                        readOnly
                        value={getShareUrl(link.token)}
                        className="text-xs h-8 bg-background"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Criado em {format(new Date(link.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        {link.expires_at ? (
                          <Badge variant={isExpired ? "destructive" : "secondary"} className="text-xs">
                            {isExpired ? 'Expirado' : `Expira ${format(new Date(link.expires_at), "dd/MM/yyyy", { locale: ptBR })}`}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Sem expiração</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyLink(link.token, link.id)}
                    >
                      {copiedId === link.id ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deactivateLink.mutate(link.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>}
          {!isLoading && (!links || links.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum link ativo</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
