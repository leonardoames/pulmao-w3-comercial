import { useState } from 'react';
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
import { Plus, Pencil, Shield, Users, Lock, KeyRound, Webhook } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUsersWithRoles, useUpdateProfile, useCreateUser } from '@/hooks/useUserManagement';
import { useUpdateUserRole, useCurrentUserRole } from '@/hooks/useUserRoles';
import { AppRole, ROLE_LABELS_NEW, ALL_ROLES, canRoleAccessAdminPanel } from '@/types/roles';
import { AREA_LABELS, UserArea } from '@/types/crm';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RolePermissionsPanel } from '@/components/admin/RolePermissionsPanel';

const AREAS: UserArea[] = ['Comercial', 'CS', 'Financeiro', 'Marketing', 'Diretoria'];

export default function UserManagement() {
  const { data: userRole, isLoading: roleLoading } = useCurrentUserRole();
  const canManageUsers = userRole?.role === 'MASTER';
  const canAccessAdmin = userRole ? canRoleAccessAdminPanel(userRole.role) : false;
  const { data: users, isLoading } = useUsersWithRoles();
  const updateProfile = useUpdateProfile();
  const updateUserRole = useUpdateUserRole();
  const createUser = useCreateUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Create form state
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    area: 'Comercial' as UserArea,
    role: 'CLOSER' as AppRole
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    nome: '',
    email: '',
    area: 'Comercial' as UserArea,
    ativo: true,
    role: 'CLOSER' as AppRole
  });

  // Wait for role to load before deciding
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

  // Redirect if not authorized to access admin panel
  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async () => {
    await createUser.mutateAsync(newUser);
    setIsCreateOpen(false);
    setNewUser({
      nome: '',
      email: '',
      password: '',
      area: 'Comercial',
      role: 'CLOSER'
    });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      nome: user.nome,
      email: user.email,
      area: user.area,
      ativo: user.ativo,
      role: user.user_role?.role || 'CLOSER'
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    await updateProfile.mutateAsync({
      id: editingUser.id,
      nome: editForm.nome,
      email: editForm.email,
      area: editForm.area,
      ativo: editForm.ativo
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
      toast.success(`Senha de ${resetUser.nome} resetada! Ele precisará criar uma nova senha no próximo login.`);
      setResetUser(null);
      setTempPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resetar senha');
    } finally {
      setResetting(false);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'MASTER':
        return 'destructive';
      case 'DIRETORIA':
        return 'default';
      case 'GESTOR_COMERCIAL':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Painel Admin"
          description="Gerencie usuários e permissões do sistema"
        />

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
          </TabsList>

          <TabsContent value="users" className="mt-6 space-y-4">
            <div className="flex justify-end">
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
                    <DialogDescription>
                      Preencha os dados para criar um novo usuário no sistema.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input 
                        value={newUser.nome}
                        onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <Input 
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Senha inicial"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Área</Label>
                        <Select 
                          value={newUser.area} 
                          onValueChange={(v) => setNewUser({ ...newUser, area: v as UserArea })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AREAS.map((area) => (
                              <SelectItem key={area} value={area}>
                                {AREA_LABELS[area]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select 
                          value={newUser.role} 
                          onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {ROLE_LABELS_NEW[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreate}
                      disabled={createUser.isPending || !newUser.nome || !newUser.email || !newUser.password}
                    >
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
                    <TableHead>Área</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{AREA_LABELS[user.area]}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.user_role?.role || 'CLOSER')}>
                            <Shield className="h-3 w-3 mr-1" />
                            {ROLE_LABELS_NEW[user.user_role?.role || 'CLOSER']}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.ativo ? 'default' : 'secondary'}>
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canManageUsers && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setResetUser(user); setTempPassword(''); }}
                              title="Resetar Senha"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="permissions" className="mt-6">
              <RolePermissionsPanel />
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize os dados do usuário selecionado.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área</Label>
                  <Select 
                    value={editForm.area} 
                    onValueChange={(v) => setEditForm({ ...editForm, area: v as UserArea })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {AREA_LABELS[area]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={editForm.role} 
                    onValueChange={(v) => setEditForm({ ...editForm, role: v as AppRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS_NEW[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={editForm.ativo}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, ativo: checked })}
                />
                <Label htmlFor="ativo">Usuário Ativo</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={updateProfile.isPending || updateUserRole.isPending}
              >
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
                <Input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetUser(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={resetting || tempPassword.length < 6}
                variant="destructive"
              >
                {resetting ? 'Resetando...' : 'Resetar Senha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
