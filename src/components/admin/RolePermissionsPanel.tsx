import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  useAllRolePermissions, 
  useUpdateRolePermission, 
  RESOURCE_DEFINITIONS, 
  RolePermission 
} from '@/hooks/useRolePermissions';
import { AppRole, ALL_ROLES, ROLE_LABELS_NEW } from '@/types/roles';
import { toast } from 'sonner';
import { Shield, Eye, Pencil } from 'lucide-react';

export function RolePermissionsPanel() {
  const { data: permissions, isLoading } = useAllRolePermissions();
  const updatePermission = useUpdateRolePermission();

  // Group resources by group label
  const groups = RESOURCE_DEFINITIONS.reduce((acc, res) => {
    if (!acc[res.group]) acc[res.group] = [];
    acc[res.group].push(res);
    return acc;
  }, {} as Record<string, typeof RESOURCE_DEFINITIONS>);

  const getPerm = (role: AppRole, resourceKey: string): RolePermission | undefined => {
    return permissions?.find(p => p.role === role && p.resource_key === resourceKey);
  };

  const handleToggle = async (role: AppRole, resourceKey: string, field: 'can_view' | 'can_edit') => {
    // MASTER permissions cannot be changed
    if (role === 'MASTER') {
      toast.error('Permissões do MASTER não podem ser alteradas');
      return;
    }

    const current = getPerm(role, resourceKey);
    const currentView = current?.can_view ?? false;
    const currentEdit = current?.can_edit ?? false;

    let newView = currentView;
    let newEdit = currentEdit;

    if (field === 'can_view') {
      newView = !currentView;
      // If disabling view, also disable edit
      if (!newView) newEdit = false;
    } else {
      newEdit = !currentEdit;
      // If enabling edit, also enable view
      if (newEdit) newView = true;
    }

    await updatePermission.mutateAsync({
      role,
      resourceKey,
      canView: newView,
      canEdit: newEdit,
    });
  };

  // Roles to display (exclude MASTER from editing but show it)
  const editableRoles = ALL_ROLES.filter(r => r !== 'MASTER');
  const displayRoles = ALL_ROLES;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões por Role
          </CardTitle>
          <CardDescription>
            Configure quais painéis e seções cada role pode visualizar e editar. 
            MASTER tem acesso total e não pode ser alterado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 min-w-[200px] sticky left-0 bg-card z-10">Recurso</th>
                  {displayRoles.map(role => (
                    <th key={role} className="text-center px-1 py-3" colSpan={2}>
                      <Badge variant={role === 'MASTER' ? 'destructive' : 'outline'} className="text-xs">
                        {ROLE_LABELS_NEW[role]}
                      </Badge>
                    </th>
                  ))}
                </tr>
                <tr className="border-b bg-muted/30">
                  <th className="sticky left-0 bg-muted/30 z-10"></th>
                  {displayRoles.map(role => (
                    <th key={role} className="text-center" colSpan={1}>
                      <span className="flex items-center justify-center gap-0.5 text-xs text-muted-foreground py-1">
                        <Eye className="h-3 w-3" /> Ver
                      </span>
                    </th>
                  ))}
                  {/* second pass for Edit headers - we need a different approach */}
                </tr>
              </thead>
            </table>

            {/* Better layout: one table per group */}
            {Object.entries(groups).map(([groupLabel, resources]) => (
              <div key={groupLabel} className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                  {groupLabel}
                </h3>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2 px-3 min-w-[180px]">Recurso</th>
                        {displayRoles.map(role => (
                          <th key={role} className="text-center px-1 py-2 min-w-[90px]" colSpan={2}>
                            <span className="text-xs font-medium">{ROLE_LABELS_NEW[role]}</span>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b bg-muted/20">
                        <th></th>
                        {displayRoles.map(role => (
                          <>
                            <th key={`${role}-v`} className="text-center py-1">
                              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                <Eye className="h-2.5 w-2.5" />
                              </span>
                            </th>
                            <th key={`${role}-e`} className="text-center py-1">
                              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                <Pencil className="h-2.5 w-2.5" />
                              </span>
                            </th>
                          </>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map(resource => (
                        <tr key={resource.key} className="border-b last:border-b-0 hover:bg-muted/20">
                          <td className="py-2 px-3 font-medium">{resource.label}</td>
                          {displayRoles.map(role => {
                            const perm = getPerm(role, resource.key);
                            const isMaster = role === 'MASTER';
                            return (
                              <>
                                <td key={`${role}-${resource.key}-v`} className="text-center py-2">
                                  <Checkbox
                                    checked={perm?.can_view ?? false}
                                    onCheckedChange={() => handleToggle(role, resource.key, 'can_view')}
                                    disabled={isMaster || updatePermission.isPending}
                                    className={isMaster ? 'opacity-50' : ''}
                                  />
                                </td>
                                <td key={`${role}-${resource.key}-e`} className="text-center py-2">
                                  <Checkbox
                                    checked={perm?.can_edit ?? false}
                                    onCheckedChange={() => handleToggle(role, resource.key, 'can_edit')}
                                    disabled={isMaster || updatePermission.isPending}
                                    className={isMaster ? 'opacity-50' : ''}
                                  />
                                </td>
                              </>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
