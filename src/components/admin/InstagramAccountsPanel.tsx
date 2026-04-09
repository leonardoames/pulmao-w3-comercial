import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Instagram, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useInstagramSync } from '@/hooks/useInstagram';

interface InstagramAccount {
  id: string;
  username: string;
  instagram_user_id: string;
  account_label: string;
  is_active: boolean;
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

function useCreateInstagramAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (account: Omit<InstagramAccount, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('instagram_accounts')
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-accounts-admin'] });
      toast.success('Conta Instagram cadastrada!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao cadastrar conta'),
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

export function InstagramAccountsPanel() {
  const { data: accounts = [], isLoading } = useInstagramAccounts();
  const createAccount = useCreateInstagramAccount();
  const deleteAccount = useDeleteInstagramAccount();
  const toggleAccount = useToggleInstagramAccount();
  const syncInstagram = useInstagramSync();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', instagram_user_id: '', account_label: '' });

  const handleCreate = async () => {
    if (!form.username.trim() || !form.instagram_user_id.trim() || !form.account_label.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    await createAccount.mutateAsync({ ...form, is_active: true });
    setForm({ username: '', instagram_user_id: '', account_label: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Instagram className="h-4 w-4" />
                Contas Instagram
              </CardTitle>
              <CardDescription className="mt-1">
                Cadastre as contas do Instagram para sincronização automática de métricas.
                O Instagram User ID é obtido via Meta Graph API após criar o System User Token.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncInstagram.mutate()}
                disabled={syncInstagram.isPending || accounts.length === 0}
                className="gap-2"
              >
                <RefreshCw className={syncInstagram.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                {syncInstagram.isPending ? 'Sincronizando...' : 'Sincronizar agora'}
              </Button>
              <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar conta
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : accounts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhuma conta cadastrada ainda. Clique em "Adicionar conta" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Label</TableHead>
                  <TableHead className="text-xs">Username</TableHead>
                  <TableHead className="text-xs">Instagram User ID</TableHead>
                  <TableHead className="text-xs text-center">Ativo</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map(acc => (
                  <TableRow key={acc.id}>
                    <TableCell className="text-sm font-medium">{acc.account_label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">@{acc.username}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{acc.instagram_user_id}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Como obter o Instagram User ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Após criar o System User Token no Meta Business Manager:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Liste suas Facebook Pages:
              <code className="block mt-1 p-2 rounded bg-muted text-xs font-mono break-all">
                GET https://graph.facebook.com/v25.0/me/accounts?access_token=SEU_TOKEN
              </code>
            </li>
            <li>
              Para cada page_id retornado, obtenha a conta Instagram vinculada:
              <code className="block mt-1 p-2 rounded bg-muted text-xs font-mono break-all">
                GET https://graph.facebook.com/v25.0/PAGE_ID?fields=instagram_business_account&access_token=SEU_TOKEN
              </code>
            </li>
            <li>O campo <code className="text-xs">instagram_business_account.id</code> é o Instagram User ID que você deve cadastrar acima.</li>
          </ol>
          <p className="mt-2">
            Após cadastrar as contas, adicione o token em{' '}
            <strong>Supabase → Edge Functions → Secrets</strong>{' '}
            com o nome <code className="text-xs">INSTAGRAM_SYSTEM_USER_TOKEN</code>.
          </p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar conta Instagram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Label (nome de exibição)</Label>
              <Input
                placeholder="Ex: Leo, W3, Marca X"
                value={form.account_label}
                onChange={e => setForm(f => ({ ...f, account_label: e.target.value }))}
              />
            </div>
            <div>
              <Label>Username do Instagram</Label>
              <Input
                placeholder="Ex: leonardo_ames (sem @)"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.replace('@', '') }))}
              />
            </div>
            <div>
              <Label>Instagram User ID</Label>
              <Input
                placeholder="Ex: 17841400008460056"
                value={form.instagram_user_id}
                onChange={e => setForm(f => ({ ...f, instagram_user_id: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obtido via Meta Graph API (veja instruções abaixo)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createAccount.isPending}>
              {createAccount.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
