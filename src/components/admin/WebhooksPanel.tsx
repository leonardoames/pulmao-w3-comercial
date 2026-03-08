import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Pencil, Webhook, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, Webhook as WebhookType } from '@/hooks/useWebhooks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WebhooksPanel() {
  const { profile } = useAuth();
  const { data: webhooks, isLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookType | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    url: '',
    ambiente: 'teste' as string,
    evento: 'nova_venda',
  });

  const resetForm = () => {
    setForm({ nome: '', url: '', ambiente: 'teste', evento: 'nova_venda' });
  };

  const handleCreate = async () => {
    if (!profile) return;
    await createWebhook.mutateAsync({
      ...form,
      criado_por: profile.id,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (webhook: WebhookType) => {
    setEditingWebhook(webhook);
    setForm({
      nome: webhook.nome,
      url: webhook.url,
      ambiente: webhook.ambiente,
      evento: webhook.evento,
    });
  };

  const handleUpdate = async () => {
    if (!editingWebhook) return;
    await updateWebhook.mutateAsync({
      id: editingWebhook.id,
      nome: form.nome,
      url: form.url,
      ambiente: form.ambiente,
    });
    setEditingWebhook(null);
    resetForm();
  };

  const handleToggle = async (webhook: WebhookType) => {
    await updateWebhook.mutateAsync({
      id: webhook.id,
      ativo: !webhook.ativo,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteWebhook.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleTest = async (webhook: WebhookType) => {
    setTestingId(webhook.id);
    try {
      const { data, error } = await supabase.functions.invoke('test-webhook', {
        body: { webhook_url: webhook.url },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Teste enviado com sucesso! Venda usada: ${data.venda_usada?.nome_lead} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.venda_usada?.valor_total)})`);
      } else {
        toast.error(`Webhook retornou status ${data?.status}: ${data?.response?.substring(0, 100) || 'sem resposta'}`);
      }
    } catch (err: any) {
      toast.error('Erro ao enviar teste: ' + (err.message || 'erro desconhecido'));
    } finally {
      setTestingId(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando webhooks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Configure URLs de webhook para notificações de vendas (N8N, Make, Zapier, etc.)
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      {(!webhooks || webhooks.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Webhook className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum webhook configurado</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione um webhook para receber notificações de novas vendas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{webhook.nome || 'Sem nome'}</span>
                    <Badge variant={webhook.ambiente === 'producao' ? 'default' : 'secondary'}>
                      {webhook.ambiente === 'producao' ? 'Produção' : 'Teste'}
                    </Badge>
                    {!webhook.ativo && (
                      <Badge variant="outline" className="opacity-50">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate font-mono">{webhook.url}</p>
                  <p className="text-xs text-muted-foreground mt-1">Evento: {webhook.evento}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={testingId === webhook.id}
                        onClick={() => handleTest(webhook)}
                      >
                        {testingId === webhook.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Enviar Teste
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Envia a última venda registrada para este webhook</TooltipContent>
                  </Tooltip>
                  <Switch
                    checked={webhook.ativo}
                    onCheckedChange={() => handleToggle(webhook)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(webhook)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(webhook)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingWebhook}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingWebhook(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: N8N Produção, Make Teste"
              />
            </div>

            <div className="space-y-2">
              <Label>URL do Webhook *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://hook.n8n.io/..."
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select value={form.ambiente} onValueChange={(v) => setForm({ ...form, ambiente: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teste">Teste</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Evento</Label>
                <Select value={form.evento} onValueChange={(v) => setForm({ ...form, evento: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nova_venda">Nova Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingWebhook(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={editingWebhook ? handleUpdate : handleCreate}
              disabled={!form.url || createWebhook.isPending || updateWebhook.isPending}
            >
              {editingWebhook ? 'Salvar' : 'Criar Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir webhook?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O webhook <strong>{deleteTarget?.nome || deleteTarget?.url}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteWebhook.isPending}
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
