import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Sparkles, FileText, Video, Eye } from 'lucide-react';
import { useAiRequests } from '@/hooks/useAiAgents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  done: 'Concluído',
  error: 'Erro',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  processing: 'secondary',
  done: 'default',
  error: 'destructive',
};

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export default function AiAgentsList() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useAiRequests();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const filtered = (requests || []).filter((r) => {
    if (filterType !== 'all' && r.ai_agents?.type !== filterType) return false;
    if (filterPlatform !== 'all' && r.platform !== filterPlatform) return false;
    return true;
  });

  return (
    <AppLayout>
      <PageHeader title="Agentes IA" description="Gere legendas e roteiros com inteligência artificial">
        <Button onClick={() => navigate('/conteudo/ai/novo')}>
          <Plus className="h-4 w-4 mr-2" /> Novo
        </Button>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="caption">Legenda</SelectItem>
            <SelectItem value="script">Roteiro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação ainda</h3>
            <p className="text-muted-foreground mb-4">Crie sua primeira legenda ou roteiro com IA</p>
            <Button onClick={() => navigate('/conteudo/ai/novo')}>
              <Plus className="h-4 w-4 mr-2" /> Criar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card
              key={r.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/conteudo/ai/${r.id}`)}
            >
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    {r.ai_agents?.type === 'caption' ? (
                      <FileText className="h-5 w-5 text-accent-foreground" />
                    ) : (
                      <Video className="h-5 w-5 text-accent-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {r.inputs_json?.tema || r.ai_agents?.name || 'Sem título'}
                      </p>
                      <Badge variant={statusVariants[r.status]}>
                        {statusLabels[r.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {r.ai_agents?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {platformLabels[r.platform] || r.platform}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
