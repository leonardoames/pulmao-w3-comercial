import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Shield, Users, Lock, KeyRound, Webhook, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUsersWithRoles, useUpdateProfile, useCreateUser } from '@/hooks/useUserManagement';
import { useUpdateUserRole, useCurrentUserRole } from '@/hooks/useUserRoles';
import { useRHSetoresConfig } from '@/hooks/useRH';
import { AppRole, ROLE_LABELS_NEW, ROLE_COLORS, ALL_ROLES, canRoleAccessAdminPanel } from '@/types/roles';

import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RolePermissionsPanel } from '@/components/admin/RolePermissionsPanel';
import { WebhooksPanel } from '@/components/admin/WebhooksPanel';

const PAGE_SIZE = 10;

export default function UserManagement() {
  const { data: userRole, isLoading: roleLoading } = useCurrentUserRole();
  const canManageUsers = userRole?.role === 'MASTER';
  const canAccessAdmin = userRole ? canRoleAccessAdminPanel(userRole.role) : false;
  const { data: users, isLoading } = useUsersWithRoles();
  const { data: setoresConfig = [] } = useRHSetoresConfig();
  const updateProfile = useUpdateProfile();
  const updateUserRole = useUpdateUserRole();
  const createUser = useCreateUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Filters
  const [filterNome, setFilterNome] = useState('');
  const [filterCentroCusto, setFilterCentroCusto] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Create form state
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'CLOSER' as AppRole,
    centro_custo: '',
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    nome: '',
    email: '',
    ativo: true,
    role: 'CLOSER' as AppRole,
    centro_custo: '',
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      if (filterNome && !u.nome.toLowerCase().includes(filterNome.toLowerCase()) && !u.email.toLowerCase().includes(filterNome.toLowerCase())) return false;
      if (filterCentroCusto !== 'all' && u.centro_custo !== filterCentroCusto) return false;
      if (filterRole !== 'all' && (u.user_role?.role || 'CLOSER') !== filterRole) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'ativo' && !u.ativo) return false;
        if (filterStatus === 'inativo' && u.ativo) return false;
      }
      return true;
    });
  }, [users, filterNome, filterCentroCusto, filterRole, filterStatus]);

  const roleCounts = useMemo(() => {
    if (!users) return {} as Record<string, number>;
    return users.reduce((acc, u) => {
      const r = u.user_role?.role || 'CLOSER';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [users]);

  const roleBadgeStyle = (role: AppRole) => {
    const c = ROLE_COLORS[role];
    return { background: c.bg, color: c.text, border: `1px solid ${c.border}` };
  };

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [filterNome, filterCentroCusto, filterRole, filterStatus]);

  if (roleLoading || isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async () => {
    await createUser.mutateAsync(newUser);
    setIsCreateOpen(false);
    setNewUser({ nome: '', email: '', password: '', role: 'CLOSER', centro_custo: '' });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      nome: user.nome,
      email: user.email,
      ativo: user.ativo,
      role: user.user_role?.role || 'CLOSER',
      centro_custo: user.centro_custo || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    await updateProfile.mutateAsync({
      id: editingUser.id,
      nome: editForm.nome,
      email: editForm.email,
      ativo: editForm.ativo,
      centro_custo: editForm.centro_custo || null,
    });
    await updateUserRole.mutateAsync({
      userId: editingUser.id,
      role: editForm.role
    });
    setEditingUser(null);
  };

  const handleResetPassword = async () => {
    if (!resetUser || !tempPassword) return;
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: resetUser.id, tempPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Senha de ${resetUser.nome} resetada!`);
      setResetUser(null);
      setTempPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resetar senha');
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Painel Admin" description="Gerencie usuários e permissões do sistema" />

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="permissions" className="gap-2">
                <Lock className="h-4 w-4" />
                Permissões
              </TabsTrigger>
            )}
            {canManageUsers && (
              <TabsTrigger value="webhooks" className="gap-2">
                <Webhook className="h-4 w-4" />
                Webhooks
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="users" className="mt-6 space-y-4">
            {/* Role counters */}
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.filter(r => roleCounts[r] > 0).map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRole(prev => prev === r ? 'all' : r)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    ...roleBadgeStyle(r as AppRole),
                    opacity: filterRole !== 'all' && filterRole !== r ? 0.4 : 1,
                    outline: filterRole === r ? `2px solid ${ROLE_COLORS[r as AppRole].text}` : 'none',
                    outlineOffset: '1px',
                  }}
                >
                  <Shield className="h-3 w-3" />
                  {ROLE_LABELS_NEW[r as AppRole]}
                  <span className="ml-0.5 opacity-70">{roleCounts[r]}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={filterNome}
                  onChange={(e) => setFilterNome(e.target.value)}
                />
              </div>
              <Select value={filterCentroCusto} onValueChange={setFilterCentroCusto}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Centro de Custo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {setoresConfig.filter(s => s.ativo).map(s => (
                    <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as roles</SelectItem>
                  {ALL_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS_NEW[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>Preencha os dados para criar um novo usuário no sistema.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} placeholder="Nome completo" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Senha inicial" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS_NEW[r]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {setoresConfig.filter(s => s.ativo).length > 0 && (
                      <div className="space-y-2">
                        <Label>Centro de Custo</Label>
                        <Select value={newUser.centro_custo || '__none__'} onValueChange={(v) => setNewUser({ ...newUser, centro_custo: v === '__none__' ? '' : v })}>
                          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
                            {setoresConfig.filter(s => s.ativo).map(s => (
                              <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={createUser.isPending || !newUser.nome || !newUser.email || !newUser.password}>
                      {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users Table */}
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Nenhum usuário encontrado</TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id} className={!user.ativo ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.centro_custo ? (() => {
                            const setor = setoresConfig.find(s => s.nome === user.centro_custo);
                            return (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={setor ? {
                                  background: `${setor.cor}20`,
                                  color: setor.cor,
                                  border: `1px solid ${setor.cor}40`,
                                } : {
                                  background: 'hsla(0,0%,100%,0.06)',
                                  color: 'hsl(0,0%,60%)',
                                  border: '1px solid hsla(0,0%,100%,0.08)',
                                }}
                              >
                                {user.centro_custo}
                              </span>
                            );
                          })() : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={roleBadgeStyle(user.user_role?.role || 'CLOSER')}
                          >
                            <Shield className="h-3 w-3" />
                            {ROLE_LABELS_NEW[user.user_role?.role || 'CLOSER']}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.ativo ? 'default' : 'secondary'}>
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canManageUsers && (
                            <Button variant="ghost" size="sm" onClick={() => { setResetUser(user); setTempPassword(''); }} title="Resetar Senha">
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredUsers.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} • Página {page} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="permissions" className="mt-6">
              <RolePermissionsPanel />
            </TabsContent>
          )}

          {canManageUsers && (
            <TabsContent value="webhooks" className="mt-6">
              <WebhooksPanel />
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Atualize os dados do usuário selecionado.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as AppRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS_NEW[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {setoresConfig.filter(s => s.ativo).length > 0 && (
                <div className="space-y-2">
                  <Label>Centro de Custo</Label>
                  <Select value={editForm.centro_custo} onValueChange={(v) => setEditForm({ ...editForm, centro_custo: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {setoresConfig.filter(s => s.ativo).map(s => (
                        <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch id="ativo" checked={editForm.ativo} onCheckedChange={(checked) => setEditForm({ ...editForm, ativo: checked })} />
                <Label htmlFor="ativo">Usuário Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
              <Button onClick={handleUpdate} disabled={updateProfile.isPending || updateUserRole.isPending}>
                {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Resetar Senha
              </DialogTitle>
              <DialogDescription>
                Defina uma senha temporária para <strong>{resetUser?.nome}</strong>.
                Ao fazer login, o usuário será obrigado a criar uma nova senha.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Senha Temporária</Label>
                <Input type="text" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetUser(null)}>Cancelar</Button>
              <Button onClick={handleResetPassword} disabled={resetting || tempPassword.length < 6} variant="destructive">
                {resetting ? 'Resetando...' : 'Resetar Senha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
