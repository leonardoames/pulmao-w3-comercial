import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeProps,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRHColaboradores, useUpdateColaborador } from '@/hooks/useRH';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, ExternalLink, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RHColaborador, SetorRH } from '@/types/rh';
import { SETOR_LABELS, STATUS_COLABORADOR_COLORS } from '@/types/rh';
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

// ── Constants ──
const SETOR_COLORS: Record<string, string> = {
  comercial: '#F97316',
  conteudo: '#3B82F6',
  marketing: '#8B5CF6',
  operacoes: '#22C55E',
  financeiro: '#EAB308',
  tecnologia: '#06B6D4',
  outro: '#6B7280',
};

const AVATAR_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308', '#EF4444'];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── Dagre Layout ──
function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 90 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 45,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ── Custom Node ──
interface EmployeeNodeData {
  colaborador: RHColaborador;
  showCargo: boolean;
  showSetor: boolean;
  showFoto: boolean;
  showSalario: boolean;
  isAdmin: boolean;
  isEditMode: boolean;
  isCurrentUser: boolean;
  isDirectReport: boolean;
  isGestor: boolean;
  onNodeClick: (colab: RHColaborador) => void;
}

function EmployeeNodeComponent({ data }: NodeProps) {
  const { colaborador: c, showCargo, showSetor, showSalario, isAdmin, isEditMode, isCurrentUser, isDirectReport, isGestor, onNodeClick } = data;
  const avatarColor = AVATAR_COLORS[hashName(c.nome) % AVATAR_COLORS.length];
  const statusColor = STATUS_COLABORADOR_COLORS[c.status] || 'rgba(255,255,255,0.2)';
  const setorColor = SETOR_COLORS[c.setor] || '#6B7280';

  const dimmed = isGestor && !isDirectReport && !isCurrentUser;

  return (
    <div
      onClick={() => onNodeClick(c)}
      className="group cursor-pointer transition-all duration-200"
      style={{
        width: 200,
        minHeight: 80,
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        boxShadow: isCurrentUser
          ? '0 0 12px rgba(249,115,22,0.3), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.4)',
        padding: '14px 16px',
        opacity: dimmed ? 0.5 : 1,
        animation: isCurrentUser ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : undefined,
      }}
    >
      {isEditMode && (
        <>
          <Handle type="target" position={Position.Top} style={{ background: '#F97316', width: 8, height: 8 }} />
          <Handle type="source" position={Position.Bottom} style={{ background: '#F97316', width: 8, height: 8 }} />
        </>
      )}
      {!isEditMode && (
        <>
          <Handle type="target" position={Position.Top} style={{ background: 'transparent', width: 1, height: 1, border: 'none' }} />
          <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', width: 1, height: 1, border: 'none' }} />
        </>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden"
          style={{ width: 40, height: 40, background: c.foto_url ? 'transparent' : avatarColor, fontSize: 13 }}
        >
          {c.foto_url ? (
            <img src={c.foto_url} alt={c.nome} className="w-full h-full object-cover" />
          ) : (
            getInitials(c.nome)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-white truncate block">{c.nome}</span>
            <div className="shrink-0 rounded-full" style={{ width: 8, height: 8, background: statusColor }} />
          </div>

          {showCargo && c.cargo && (
            <span className="text-[11px] block truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.cargo}</span>
          )}

          {showSetor && c.setor && (
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: `${setorColor}20`, color: setorColor }}
            >
              {SETOR_LABELS[c.setor] || c.setor}
            </span>
          )}

          {showSalario && isAdmin && c.salario != null && (
            <span className="text-[11px] block mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              R$ {c.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  employee: EmployeeNodeComponent as any,
};

// ── Side Panel ──
function ProfilePanel({ colaborador, onClose, allColaboradores }: { colaborador: RHColaborador | null; onClose: () => void; allColaboradores: RHColaborador[] }) {
  const navigate = useNavigate();
  if (!colaborador) return null;

  const responsavel = colaborador.responsavel_id
    ? allColaboradores.find(c => c.id === colaborador.responsavel_id)
    : null;

  const avatarColor = AVATAR_COLORS[hashName(colaborador.nome) % AVATAR_COLORS.length];

  return (
    <div
      className="fixed right-0 top-0 h-screen z-50 animate-slide-in-right"
      style={{ width: 280, background: '#111111', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-sm font-semibold text-foreground">Perfil</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div
            className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
            style={{ width: 64, height: 64, background: colaborador.foto_url ? 'transparent' : avatarColor, fontSize: 20 }}
          >
            {colaborador.foto_url ? (
              <img src={colaborador.foto_url} alt={colaborador.nome} className="w-full h-full object-cover" />
            ) : (
              getInitials(colaborador.nome)
            )}
          </div>
          <span className="text-base font-semibold text-foreground">{colaborador.nome}</span>
        </div>

        <div className="space-y-2 text-sm">
          {colaborador.cargo && <InfoRow label="Cargo" value={colaborador.cargo} />}
          {colaborador.setor && <InfoRow label="Setor" value={SETOR_LABELS[colaborador.setor] || colaborador.setor} />}
          {colaborador.data_entrada && <InfoRow label="Entrada" value={new Date(colaborador.data_entrada).toLocaleDateString('pt-BR')} />}
          {colaborador.tipo_contrato && <InfoRow label="Contrato" value={colaborador.tipo_contrato.toUpperCase()} />}
          {responsavel && <InfoRow label="Responsável" value={responsavel.nome} />}
        </div>

        <button
          onClick={() => navigate(`/rh/colaboradores/${colaborador.id}`)}
          className="flex items-center gap-2 text-sm font-medium mt-4 transition-colors"
          style={{ color: '#F97316' }}
        >
          Ver perfil completo <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

// ── Unassigned Panel ──
function UnassignedPanel({
  colaboradores,
  isOpen,
  onToggle,
}: {
  colaboradores: RHColaborador[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="absolute left-0 top-0 h-full z-40 transition-all duration-200 flex"
      style={{ width: isOpen ? 220 : 32 }}
    >
      {isOpen && (
        <div className="w-[220px] h-full overflow-y-auto" style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Sem Setor</span>
              {colaboradores.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.2)', color: '#F97316' }}>
                  {colaboradores.length}
                </span>
              )}
            </div>
            <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {colaboradores.map(c => {
              const avatarColor = AVATAR_COLORS[hashName(c.nome) % AVATAR_COLORS.length];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{ fontSize: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ width: 32, height: 32, background: avatarColor, fontSize: 10 }}
                  >
                    {getInitials(c.nome)}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-foreground truncate font-medium">{c.nome}</span>
                    {c.cargo && <span className="block truncate" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{c.cargo}</span>}
                  </div>
                </div>
              );
            })}
            {colaboradores.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Todos possuem setor
              </p>
            )}
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={onToggle}
          className="w-8 h-full flex items-center justify-center transition-colors"
          style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// ── Toolbar Chip ──
function ToolbarChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
      style={
        active
          ? { background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }
          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
      }
    >
      {label}
    </button>
  );
}

// ── Main Page ──
export default function RHOrganograma() {
  const { data: colaboradores = [], isLoading } = useRHColaboradores();
  const { data: userRole } = useCurrentUserRole();
  const { user } = useAuth();
  const updateColaborador = useUpdateColaborador();

  const isAdmin = userRole?.role === 'MASTER' || userRole?.role === 'DIRETORIA';
  const isGestorRole = userRole?.role === 'GESTOR_COMERCIAL';

  const [viewMode, setViewMode] = useState<'hierarquia' | 'setor'>('hierarquia');
  const [showCargo, setShowCargo] = useState(true);
  const [showSetor, setShowSetor] = useState(true);
  const [showFoto, setShowFoto] = useState(true);
  const [showSalario, setShowSalario] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedColab, setSelectedColab] = useState<RHColaborador | null>(null);
  const [unassignedOpen, setUnassignedOpen] = useState(true);
  const [hasPositionChanges, setHasPositionChanges] = useState(false);
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Connection confirmation dialog
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
  const [pendingDeleteEdge, setPendingDeleteEdge] = useState<Edge | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const unassigned = useMemo(
    () => colaboradores.filter(c => (!c.setor || c.setor === 'outro') && !c.responsavel_id),
    [colaboradores]
  );

  // Find current user's colaborador record
  const currentUserColab = useMemo(
    () => colaboradores.find(c => c.closer_id === user?.id),
    [colaboradores, user?.id]
  );

  // Find gestor's direct reports
  const gestorColabId = useMemo(() => {
    if (!isGestorRole || !user?.id) return null;
    const gestorColab = colaboradores.find(c => c.closer_id === user.id);
    return gestorColab?.id || null;
  }, [isGestorRole, user?.id, colaboradores]);

  const directReportIds = useMemo(() => {
    if (!gestorColabId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(gestorColabId);
    function addReports(parentId: string) {
      colaboradores.forEach(c => {
        if (c.responsavel_id === parentId) {
          ids.add(c.id);
          addReports(c.id);
        }
      });
    }
    addReports(gestorColabId);
    return ids;
  }, [gestorColabId, colaboradores]);

  // Load saved positions
  useEffect(() => {
    async function loadPositions() {
      const { data } = await supabase
        .from('rh_organograma_positions')
        .select('*')
        .eq('layout_mode', viewMode);
      if (data) {
        const posMap: Record<string, { x: number; y: number }> = {};
        data.forEach((p: any) => {
          posMap[p.colaborador_id] = { x: Number(p.node_position_x), y: Number(p.node_position_y) };
        });
        setSavedPositions(posMap);
      }
    }
    loadPositions();
  }, [viewMode]);

  // Build nodes & edges
  useEffect(() => {
    if (isLoading || colaboradores.length === 0) return;

    const filteredColabs = colaboradores.filter(c => c.setor && c.setor !== 'outro' || c.responsavel_id);

    const newEdges: Edge[] = filteredColabs
      .filter(c => c.responsavel_id)
      .map(c => ({
        id: `e-${c.responsavel_id}-${c.id}`,
        source: c.responsavel_id!,
        target: c.id,
        type: 'smoothstep',
        style: { stroke: 'rgba(249,115,22,0.4)', strokeWidth: 2 },
        animated: false,
      }));

    const newNodes: Node[] = filteredColabs.map(c => ({
      id: c.id,
      type: 'employee',
      position: savedPositions[c.id] || { x: 0, y: 0 },
      draggable: editMode && isAdmin,
      data: {
        colaborador: c,
        showCargo,
        showSetor,
        showFoto,
        showSalario,
        isAdmin,
        isEditMode: editMode,
        isCurrentUser: c.id === currentUserColab?.id,
        isDirectReport: directReportIds.has(c.id),
        isGestor: isGestorRole,
        onNodeClick: (colab: RHColaborador) => setSelectedColab(colab),
      },
    }));

    // Apply dagre if no saved positions
    const hasSaved = Object.keys(savedPositions).length > 0;
    if (!hasSaved || viewMode === 'hierarquia') {
      const nodesNeedLayout = newNodes.filter(n => !savedPositions[n.id]);
      if (nodesNeedLayout.length > 0 || !hasSaved) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
        // Merge: use saved positions where available, dagre for rest
        const mergedNodes = layoutedNodes.map(n => ({
          ...n,
          position: savedPositions[n.id] || n.position,
        }));
        setNodes(mergedNodes);
        setEdges(layoutedEdges);
        return;
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [colaboradores, isLoading, savedPositions, viewMode, showCargo, showSetor, showFoto, showSalario, editMode, isAdmin, currentUserColab?.id, directReportIds, isGestorRole]);

  // Handle node drag
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    setHasPositionChanges(true);
  }, []);

  // Handle new connection
  const onConnect = useCallback((connection: Connection) => {
    if (!isAdmin || !editMode) return;
    setPendingConnection({ source: connection.source!, target: connection.target! });
  }, [isAdmin, editMode]);

  const confirmConnection = useCallback(async () => {
    if (!pendingConnection) return;
    const { source, target } = pendingConnection;

    // Update responsavel_id
    const { error } = await supabase
      .from('rh_colaboradores')
      .update({ responsavel_id: source } as any)
      .eq('id', target);

    if (error) {
      toast.error('Erro ao criar vínculo');
    } else {
      setEdges(eds => addEdge({
        id: `e-${source}-${target}`,
        source,
        target,
        type: 'smoothstep',
        style: { stroke: 'rgba(249,115,22,0.4)', strokeWidth: 2 },
      }, eds));
      toast.success('Vínculo criado!');
    }
    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  // Handle edge delete
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    if (!isAdmin || !editMode) return;
    if (deletedEdges.length > 0) {
      setPendingDeleteEdge(deletedEdges[0]);
    }
  }, [isAdmin, editMode]);

  const confirmDeleteEdge = useCallback(async () => {
    if (!pendingDeleteEdge) return;
    const targetId = pendingDeleteEdge.target;

    const { error } = await supabase
      .from('rh_colaboradores')
      .update({ responsavel_id: null } as any)
      .eq('id', targetId);

    if (error) {
      toast.error('Erro ao remover vínculo');
    } else {
      setEdges(eds => eds.filter(e => e.id !== pendingDeleteEdge.id));
      toast.success('Vínculo removido');
    }
    setPendingDeleteEdge(null);
  }, [pendingDeleteEdge, setEdges]);

  // Save layout
  const saveLayout = useCallback(async () => {
    const upserts = nodes.map(n => ({
      colaborador_id: n.id,
      node_position_x: n.position.x,
      node_position_y: n.position.y,
      layout_mode: viewMode,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('rh_organograma_positions')
      .upsert(upserts as any, { onConflict: 'colaborador_id,layout_mode' });

    if (error) {
      toast.error('Erro ao salvar layout');
    } else {
      toast.success('Layout salvo!');
      setHasPositionChanges(false);
    }
  }, [nodes, viewMode]);

  // Auto-organize
  const autoOrganize = useCallback(() => {
    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layouted);
    setEdges(layoutedEdges);
    setHasPositionChanges(true);
  }, [nodes, edges, setNodes, setEdges]);

  const sourceName = pendingConnection ? colaboradores.find(c => c.id === pendingConnection.source)?.nome : '';
  const targetName = pendingConnection ? colaboradores.find(c => c.id === pendingConnection.target)?.nome : '';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Floating Toolbar */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-xl"
          style={{ background: 'rgba(17,17,17,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 pr-3" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm font-semibold text-foreground">Organograma</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              {colaboradores.length}
            </span>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-1 pr-3" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            {(['hierarquia', 'setor'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={
                  viewMode === mode
                    ? { background: '#F97316', color: '#fff' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }
                }
              >
                {mode === 'hierarquia' ? 'Hierarquia' : 'Por Setor'}
              </button>
            ))}
          </div>

          {/* Display Chips */}
          <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[10px] mr-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Exibir:</span>
            <ToolbarChip label="Cargo" active={showCargo} onClick={() => setShowCargo(!showCargo)} />
            <ToolbarChip label="Setor" active={showSetor} onClick={() => setShowSetor(!showSetor)} />
            <ToolbarChip label="Foto" active={showFoto} onClick={() => setShowFoto(!showFoto)} />
            {isAdmin && <ToolbarChip label="Salário" active={showSalario} onClick={() => setShowSalario(!showSalario)} />}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={autoOrganize}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Auto-organizar
              </button>

              <button
                onClick={() => setEditMode(!editMode)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                style={
                  editMode
                    ? { background: 'rgba(249,115,22,0.2)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
                }
              >
                {editMode ? '✏️ Editando' : 'Modo Edição'}
              </button>

              {editMode && hasPositionChanges && (
                <button
                  onClick={saveLayout}
                  className="px-3 py-1 rounded-md text-[11px] font-semibold text-white"
                  style={{ background: '#F97316' }}
                >
                  Salvar layout
                </button>
              )}
            </div>
          )}
        </div>

        {/* Editing badge */}
        {editMode && (
          <div
            className="absolute top-16 left-4 z-30 px-3 py-1 rounded-md text-[11px] font-semibold"
            style={{ background: 'rgba(249,115,22,0.2)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}
          >
            ✏️ Editando
          </div>
        )}

        {/* Unassigned Panel */}
        <UnassignedPanel
          colaboradores={unassigned}
          isOpen={unassignedOpen}
          onToggle={() => setUnassignedOpen(!unassignedOpen)}
        />

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={isAdmin && editMode ? onNodesChange : undefined}
          onEdgesChange={isAdmin && editMode ? onEdgesChange : undefined}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={isAdmin && editMode ? 'Delete' : null}
          nodesDraggable={isAdmin && editMode}
          nodesConnectable={isAdmin && editMode}
          elementsSelectable={isAdmin && editMode}
          style={{ background: '#0a0a0a' }}
        >
          <Background color="rgba(255,255,255,0.03)" gap={20} />
          <Controls
            position="bottom-left"
            style={{ marginLeft: unassignedOpen ? 230 : 42 }}
            showInteractive={false}
          />
          <MiniMap
            position="bottom-right"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}
            nodeColor={(node) => {
              const setor = (node.data as any)?.colaborador?.setor;
              return SETOR_COLORS[setor] || '#F97316';
            }}
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>

        {/* Profile Panel */}
        {selectedColab && (
          <ProfilePanel
            colaborador={selectedColab}
            onClose={() => setSelectedColab(null)}
            allColaboradores={colaboradores}
          />
        )}

        {/* Connection Confirmation */}
        <AlertDialog open={!!pendingConnection} onOpenChange={() => setPendingConnection(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Criar vínculo de responsabilidade?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{sourceName}</strong> será responsável por <strong>{targetName}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmConnection} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edge Delete Confirmation */}
        <AlertDialog open={!!pendingDeleteEdge} onOpenChange={() => setPendingDeleteEdge(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover vínculo de responsabilidade?</AlertDialogTitle>
              <AlertDialogDescription>
                O vínculo de responsabilidade será removido. Esta ação pode ser refeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteEdge} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
