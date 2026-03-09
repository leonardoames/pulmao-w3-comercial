import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, ArrowLeft } from 'lucide-react';
import { usePatrimonioAmbientes, useCreateAmbiente, useUpdateAmbiente, PatrimonioAmbiente } from '@/hooks/usePatrimonio';
import { useNavigate } from 'react-router-dom';

export default function PatrimonioAmbientes() {
  const { data: ambientes = [], isLoading } = usePatrimonioAmbientes();
  const createAmb = useCreateAmbiente();
  const updateAmb = useUpdateAmbiente();

  const [showNew, setShowNew] = useState(false);
  const [editAmb, setEditAmb] = useState<PatrimonioAmbiente | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '' });

  const handleCreate = () => {
    createAmb.mutate(form, {
      onSuccess: () => { setShowNew(false); setForm({ nome: '', descricao: '' }); },
    });
  };

  const handleUpdate = () => {
    if (!editAmb) return;
    updateAmb.mutate({ id: editAmb.id, nome: editAmb.nome, descricao: editAmb.descricao, ativo: editAmb.ativo }, {
      onSuccess: () => setEditAmb(null),
    });
  };

  return (
    <AppLayout>
      <PageHeader title="Gestão de Ambientes" description="Ambientes e localizações para patrimônio">
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Novo Ambiente</Button>
      </PageHeader>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : ambientes.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum ambiente</TableCell></TableRow>
            ) : ambientes.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.nome}</TableCell>
                <TableCell className="text-muted-foreground">{a.descricao || '—'}</TableCell>
                <TableCell>
                  <Badge style={a.ativo
                    ? { background: 'hsla(142, 71%, 45%, 0.15)', color: 'hsl(142, 71%, 45%)' }
                    : { background: 'hsla(0, 0%, 50%, 0.15)', color: 'hsl(0, 0%, 50%)' }
                  }>{a.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditAmb(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Novo Ambiente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.nome || createAmb.isPending}>
              {createAmb.isPending ? 'Salvando...' : 'Criar Ambiente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editAmb} onOpenChange={() => setEditAmb(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar Ambiente</DialogTitle></DialogHeader>
          {editAmb && (
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={editAmb.nome} onChange={e => setEditAmb({ ...editAmb, nome: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={editAmb.descricao} onChange={e => setEditAmb({ ...editAmb, descricao: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <Label>Ativo</Label>
                <input type="checkbox" checked={editAmb.ativo} onChange={e => setEditAmb({ ...editAmb, ativo: e.target.checked })} />
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={updateAmb.isPending}>
                {updateAmb.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
