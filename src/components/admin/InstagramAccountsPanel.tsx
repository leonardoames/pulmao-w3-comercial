import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Instagram, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useInstagramSync } from '@/hooks/useInstagram';
import { format, differenceInDays } from 'date-fns';

const INSTAGRAM_APP_ID = import.meta.env.VITE_INSTAGRAM_APP_ID ?? '';
const SCOPES = 'instagram_business_basic,instagram_business_manage_insights';

interface InstagramAccount {
  id: string;
  username: string;
  instagram_user_id: string;
  account_label: string;
  is_active: boolean;
  access_token: string | null;
  token_expires_at: string | null;
  created_at: string;
}

function useInstagramAccounts() {
  return useQuery({
    queryKey: ['instagram-accounts-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data as InstagramAccount[];
    },
  });
}

function useDeleteInstagramAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('instagram_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-accounts-admin'] });
      toast.success('Conta removida.');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao remover conta'),
  });
}

function useToggleInstagramAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('instagram_accounts')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-accounts-admin'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao atualizar conta'),
  });
}

function getTokenStatus(expiresAt: string | null) {
  if (!expiresAt) return null;
  const days = differenceInDays(new Date(expiresAt), new Date());
  if (days <= 0) return { label: 'Expirado', variant: 'destructive' as const };
  if (days <= 7) return { label: `Expira em ${days}d`, variant: 'destructive' as const };
  if (days <= 30) return { label: `Expira em ${days}d`, variant: 'secondary' as const };
  return { label: `Válido (${days}d)`, variant: 'outline' as const };
}

export function InstagramAccountsPanel() {
  const { data: accounts = [], isLoading } = useInstagramAccounts();
  const deleteAccount = useDeleteInstagramAccount();
  const toggleAccount = useToggleInstagramAccount();
  const syncInstagram = useInstagramSync();

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');

  const handleConnect = () => {
    if (!label.trim()) {
      toast.error('Digite um nome para identificar a conta');
      return;
    }
    if (!INSTAGRAM_APP_ID) {
      toast.error('VITE_INSTAGRAM_APP_ID não configurado. Adicione nas variáveis de ambiente do Lovable.');
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/instagram/callback`);
    const oauthUrl = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${SCOPES}&state=${encodeURIComponent(label)}`;
    window.location.href = oauthUrl;
  };

  const connectedAccounts = accounts.filter(a => a.access_token);
  const hasAppId = !!INSTAGRAM_APP_ID;

  return (
    <div className="space-y-6">
      {!hasAppId && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-500">Configuração pendente</p>
            <p className="text-muted-foreground mt-1">
              Adicione a variável de ambiente <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_INSTAGRAM_APP_ID</code> nas configurações do Lovable com o ID do seu Meta App.
              Também adicione <code className="text-xs bg-muted px-1 py-0.5 rounded">INSTAGRAM_APP_ID</code> e <code className="text-xs bg-muted px-1 py-0.5 rounded">INSTAGRAM_APP_SECRET</code> nos secrets das Edge Functions.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Instagram className="h-4 w-4" />
                Contas Instagram conectadas
              </CardTitle>
              <CardDescription className="mt-1">
                Clique em "Conectar conta" para autorizar uma conta Instagram Business ou Creator.
                O token é renovado automaticamente a cada sincronização.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncInstagram.mutate()}
                disabled={syncInstagram.isPending || connectedAccounts.length === 0}
                className="gap-2"
              >
                <RefreshCw className={syncInstagram.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                {syncInstagram.isPending ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Conectar conta
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : accounts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhuma conta conectada ainda. Clique em "Conectar conta" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Conta</TableHead>
                  <TableHead className="text-xs">Username</TableHead>
                  <TableHead className="text-xs">Token</TableHead>
                  <TableHead className="text-xs text-center">Ativo</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map(acc => {
                  const tokenStatus = getTokenStatus(acc.token_expires_at);
                  return (
                    <TableRow key={acc.id}>
                      <TableCell className="text-sm font-medium">{acc.account_label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">@{acc.username}</TableCell>
                      <TableCell>
                        {acc.access_token ? (
                          tokenStatus && (
                            <Badge variant={tokenStatus.variant} className="text-xs">
                              {tokenStatus.label}
                            </Badge>
                          )
                        ) : (
                          <Badge variant="destructive" className="text-xs">Não conectado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={acc.is_active}
                          onCheckedChange={(val) => toggleAccount.mutate({ id: acc.id, is_active: val })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAccount.mutate(acc.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pré-requisitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Para que a conexão funcione você precisa:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Criar um app em <strong>developers.facebook.com/apps</strong> (tipo Empresa) e adicionar o produto <strong>Instagram Graph API</strong></li>
            <li>Adicionar <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_INSTAGRAM_APP_ID</code> nas variáveis de ambiente do Lovable (Settings → Environment Variables)</li>
            <li>Adicionar <code className="text-xs bg-muted px-1 py-0.5 rounded">INSTAGRAM_APP_ID</code> e <code className="text-xs bg-muted px-1 py-0.5 rounded">INSTAGRAM_APP_SECRET</code> nos secrets das Edge Functions</li>
            <li>Configurar a URL de callback no Meta App: <code className="text-xs bg-muted px-1 py-0.5 rounded">{window.location.origin}/instagram/callback</code></li>
            <li>As contas Instagram precisam ser <strong>Business ou Creator</strong></li>
          </ol>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar conta Instagram</DialogTitle>
            <DialogDescription>
              Você será redirecionado para o Instagram para autorizar o acesso.
              Use um nome curto para identificar a conta dentro do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome da conta (label)</Label>
              <Input
                placeholder="Ex: Leo, W3, Marca X"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este nome aparecerá nos dashboards para identificar a conta.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleConnect} className="gap-2">
              <Instagram className="h-4 w-4" />
              Ir para o Instagram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
