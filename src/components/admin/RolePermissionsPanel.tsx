import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useAllRolePermissions,
  useUpdateRolePermission,
  RESOURCE_DEFINITIONS,
} from '@/hooks/useRolePermissions';
import { useAllUserRoles } from '@/hooks/useUserRoles';
import { AppRole, ALL_ROLES, ROLE_LABELS_NEW, ROLE_COLORS } from '@/types/roles';
import { toast } from 'sonner';
import {
  Eye, Pencil, Save, Crown, Building2, Briefcase,
  Headphones, Target, Share2, FileText, BarChart2,
  ShoppingBag, Settings, AlertTriangle,
} from 'lucide-react';

const ROLE_ICONS: Record<AppRole, React.ComponentType<{ className?: string }>> = {
  MASTER: Crown,
  DIRETORIA: Building2,
  GESTOR_COMERCIAL: Briefcase,
  SDR: Headphones,
  CLOSER: Target,
  SOCIAL_SELLING: Share2,
  ANALISTA_CONTEUDO: FileText,
  GESTOR_TRAFEGO: BarChart2,
  GESTOR_MARKETPLACE: ShoppingBag,
  ADMINISTRATIVO: Settings,
};

type LocalPerms = Record<string, { can_view: boolean; can_edit: boolean }>;

export function RolePermissionsPanel() {
  const { data: allPermissions, isLoading } = useAllRolePermissions();
  const { data: allUserRoles } = useAllUserRoles();
  const updatePermission = useUpdateRolePermission();

  const [selectedRole, setSelectedRole] = useState<AppRole>('DIRETORIA');
  const [localPerms, setLocalPerms] = useState<LocalPerms>({});
  const [isDirty, setIsDirty] = useState(false);
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // User count per role
  const userCountByRole = useMemo(() => {
    if (!allUserRoles) return {} as Record<string, number>;
    return allUserRoles.reduce((acc, ur) => {
      acc[ur.role] = (acc[ur.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allUserRoles]);

  // Group resources by group label
  const groups = useMemo(() =>
    RESOURCE_DEFINITIONS.reduce((acc, res) => {
      if (!acc[res.group]) acc[res.group] = [];
      acc[res.group].push(res);
      return acc;
    }, {} as Record<string, typeof RESOURCE_DEFINITIONS>),
  []);

  // Initialize local perms when role changes or DB data arrives
  useEffect(() => {
    if (!allPermissions) return;
    const map: LocalPerms = {};
    for (const res of RESOURCE_DEFINITIONS) {
      const db = allPermissions.find(p => p.role === selectedRole && p.resource_key === res.key);
      map[res.key] = { can_view: db?.can_view ?? false, can_edit: db?.can_edit ?? false };
    }
    setLocalPerms(map);
    setIsDirty(false);
  }, [selectedRole, allPermissions]);

  // Routes the selected role can view (for preview chips)
  const accessibleRoutes = useMemo(() =>
    RESOURCE_DEFINITIONS.filter(r => r.key.startsWith('route:') && localPerms[r.key]?.can_view),
  [localPerms]);

  const handleToggle = (resourceKey: string, field: 'can_view' | 'can_edit') => {
    if (selectedRole === 'MASTER') {
      toast.error('Permissões do MASTER não podem ser alteradas');
      return;
    }
    setLocalPerms(prev => {
      const current = prev[resourceKey] ?? { can_view: false, can_edit: false };
      let { can_view, can_edit } = current;
      if (field === 'can_view') {
        can_view = !can_view;
        if (!can_view) can_edit = false;
      } else {
        can_edit = !can_edit;
        if (can_edit) can_view = true;
      }
      return { ...prev, [resourceKey]: { can_view, can_edit } };
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        Object.entries(localPerms).map(([resourceKey, { can_view, can_edit }]) =>
          updatePermission.mutateAsync({ role: selectedRole, resourceKey, canView: can_view, canEdit: can_edit })
        )
      );
      toast.success(`Permissões de ${ROLE_LABELS_NEW[selectedRole]} salvas!`);
      setIsDirty(false);
    } catch {
      toast.error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleClick = (role: AppRole) => {
    if (isDirty) { setPendingRole(role); return; }
    setSelectedRole(role);
  };

  const confirmSwitch = () => {
    if (pendingRole) { setSelectedRole(pendingRole); setIsDirty(false); }
    setPendingRole(null);
  };

  const hasDbConfig = (role: AppRole) =>
    role === 'MASTER' || (allPermissions?.some(p => p.role === role) ?? false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedColors = ROLE_COLORS[selectedRole];
  const SelectedIcon = ROLE_ICONS[selectedRole];

  return (
    <>
      <div className="flex gap-6" style={{ minHeight: 600 }}>

        {/* LEFT COLUMN — Role cards */}
        <div className="w-52 shrink-0 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
            Roles
          </p>
          {ALL_ROLES.map(role => {
            const Icon = ROLE_ICONS[role];
            const colors = ROLE_COLORS[role];
            const isSelected = role === selectedRole;
            const count = userCountByRole[role] ?? 0;
            const configured = hasDbConfig(role);

            return (
              <button
                key={role}
                onClick={() => handleRoleClick(role)}
                className="w-full text-left p-3 rounded-xl border transition-all"
                style={{
                  background: isSelected ? colors.bg : 'transparent',
                  borderColor: isSelected ? colors.border : 'hsla(0,0%,100%,0.07)',
                  outline: isSelected ? `2px solid ${colors.text}` : 'none',
                  outlineOffset: '1px',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: isSelected ? colors.text : 'hsl(0,0%,50%)' }}
                  />
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: isSelected ? colors.text : undefined }}
                  >
                    {ROLE_LABELS_NEW[role]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] text-muted-foreground">
                    {count} usuário{count !== 1 ? 's' : ''}
                  </span>
                  {!configured && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'hsla(38,92%,50%,0.15)', color: 'hsl(38,92%,60%)' }}
                    >
                      Sem config
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN — Permissions for selected role */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: selectedColors.bg, border: `1px solid ${selectedColors.border}` }}
              >
                <SelectedIcon className="h-4 w-4" style={{ color: selectedColors.text }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{ROLE_LABELS_NEW[selectedRole]}</h3>
                {selectedRole === 'MASTER' && (
                  <p className="text-xs text-muted-foreground">Acesso total — não editável</p>
                )}
              </div>
            </div>
            {isDirty && (
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                Alterações não salvas
              </span>
            )}
          </div>

          {/* Resource groups */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-1 pb-2">
            {Object.entries(groups).map(([groupLabel, resources]) => (
              <div key={groupLabel}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  {groupLabel}
                </p>
                <div
                  className="rounded-xl divide-y overflow-hidden"
                  style={{
                    border: '1px solid hsla(0,0%,100%,0.07)',
                    divideColor: 'hsla(0,0%,100%,0.05)',
                  }}
                >
                  {resources.map(resource => {
                    const perm = selectedRole === 'MASTER'
                      ? { can_view: true, can_edit: true }
                      : (localPerms[resource.key] ?? { can_view: false, can_edit: false });
                    const disabled = selectedRole === 'MASTER';

                    return (
                      <div
                        key={resource.key}
                        className="flex items-center px-4 py-2.5 gap-3"
                        style={{ borderBottom: '1px solid hsla(0,0%,100%,0.05)' }}
                      >
                        <span className="flex-1 text-sm">{resource.label}</span>

                        {/* Ver button */}
                        <button
                          onClick={() => !disabled && handleToggle(resource.key, 'can_view')}
                          disabled={disabled}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                          style={perm.can_view ? {
                            background: 'hsla(210,80%,50%,0.15)',
                            color: 'hsl(210,80%,70%)',
                            border: '1px solid hsla(210,80%,50%,0.3)',
                            opacity: disabled ? 0.5 : 1,
                          } : {
                            background: 'hsla(0,0%,100%,0.04)',
                            color: 'hsl(0,0%,38%)',
                            border: '1px solid hsla(0,0%,100%,0.07)',
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </button>

                        {/* Editar button */}
                        <button
                          onClick={() => !disabled && handleToggle(resource.key, 'can_edit')}
                          disabled={disabled}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                          style={perm.can_edit ? {
                            background: 'hsla(140,60%,40%,0.15)',
                            color: 'hsl(140,60%,60%)',
                            border: '1px solid hsla(140,60%,40%,0.3)',
                            opacity: disabled ? 0.5 : 1,
                          } : {
                            background: 'hsla(0,0%,100%,0.04)',
                            color: 'hsl(0,0%,38%)',
                            border: '1px solid hsla(0,0%,100%,0.07)',
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Preview de acesso */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                Preview de acesso — rotas liberadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {accessibleRoutes.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Nenhuma rota liberada</span>
                ) : (
                  accessibleRoutes.map(r => (
                    <span
                      key={r.key}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: selectedColors.bg,
                        color: selectedColors.text,
                        border: `1px solid ${selectedColors.border}`,
                      }}
                    >
                      {r.label}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Save button */}
          {selectedRole !== 'MASTER' && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid hsla(0,0%,100%,0.07)' }}>
              <Button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : isDirty ? 'Salvar alterações' : 'Sem alterações pendentes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved changes dialog */}
      <AlertDialog open={!!pendingRole} onOpenChange={(open) => !open && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas em <strong>{ROLE_LABELS_NEW[selectedRole]}</strong>.
              Trocar de role irá descartar essas alterações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar e salvar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch} className="bg-destructive hover:bg-destructive/90">
              Descartar e trocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
