import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Copy, RefreshCw, Loader2, FileText, Video, ClipboardCheck } from 'lucide-react';
import { useAiRequest, useAiOutputs, useGenerateContent, useDuplicateRequest } from '@/hooks/useAiAgents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  done: 'Concluído',
  error: 'Erro',
};

export default function AiAgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading: requestLoading } = useAiRequest(id);
  const { data: outputs, isLoading: outputsLoading } = useAiOutputs(id);
  const generateContent = useGenerateContent();
  const duplicateRequest = useDuplicateRequest();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRegenerate = async () => {
    if (!request) return;
    setIsRegenerating(true);
    try {
      await generateContent.mutateAsync({
        agent_id: request.agent_id,
        request_id: request.id,
        inputs_json: request.inputs_json,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDuplicate = async () => {
    if (!request) return;
    const result = await duplicateRequest.mutateAsync(request.id);
    navigate(`/marketing/ai/${result.id}`);
  };

  const copyToClipboard = (text: string, outputId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(outputId);
    toast.success('Copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseOutput = (text: string) => {
    // Try to extract JSON from markdown code blocks or raw text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // not valid JSON
      }
    }
    return null;
  };

  if (requestLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <PageHeader title="Solicitação não encontrada">
          <Button variant="outline" onClick={() => navigate('/marketing/ai')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </PageHeader>
      </AppLayout>
    );
  }

  const inputs = request.inputs_json || {};

  return (
    <AppLayout>
      <PageHeader
        title={inputs.tema || 'Detalhe da Geração'}
        description={`${request.ai_agents?.name || ''} • ${format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/marketing/ai')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" /> Duplicar
          </Button>
          <Button onClick={handleRegenerate} disabled={isRegenerating}>
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Nova Versão
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Briefing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {request.ai_agents?.type === 'caption' ? <FileText className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              Briefing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant="outline">{statusLabels[request.status]}</Badge>
            {inputs.tema && <p><strong>Tema:</strong> {inputs.tema}</p>}
            {inputs.objetivo && <p><strong>Objetivo:</strong> {inputs.objetivo}</p>}
            {inputs.publico && <p><strong>Público:</strong> {inputs.publico}</p>}
            {inputs.tom && <p><strong>Tom:</strong> {inputs.tom}</p>}
            {inputs.gancho && <p><strong>Gancho:</strong> {inputs.gancho}</p>}
            {inputs.cta && <p><strong>CTA:</strong> {inputs.cta}</p>}
            {inputs.palavras_proibidas && <p><strong>Proibidas:</strong> {inputs.palavras_proibidas}</p>}
            {inputs.duracao && <p><strong>Duração:</strong> {inputs.duracao}</p>}
            {inputs.referencia && <p><strong>Referência:</strong> {inputs.referencia}</p>}
            <p><strong>Plataforma:</strong> {inputs.platform}</p>
          </CardContent>
        </Card>

        {/* Outputs */}
        <div className="lg:col-span-2 space-y-4">
          {outputsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !outputs || outputs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {request.status === 'processing' ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Gerando conteúdo...</p>
                  </div>
                ) : (
                  <p>Nenhum output gerado ainda.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            outputs.map((output) => {
              const parsed = parseOutput(output.output_text);
              const isCopied = copiedId === output.id;

              return (
                <Card key={output.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Versão {output.version}
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(output.created_at), "dd/MM HH:mm")}
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {output.output_text.length} chars
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {parsed && request.ai_agents?.type === 'caption' ? (
                      // Render caption sections
                      <div className="space-y-4">
                        {parsed.curta && (
                          <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Curta</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(parsed.curta, output.id + '-curta')}
                              >
                                {copiedId === output.id + '-curta' ? <ClipboardCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{parsed.curta}</p>
                            <span className="text-xs text-muted-foreground mt-1 block">{parsed.curta.length} chars</span>
                          </div>
                        )}
                        {parsed.media && (
                          <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Média</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(parsed.media, output.id + '-media')}
                              >
                                {copiedId === output.id + '-media' ? <ClipboardCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{parsed.media}</p>
                            <span className="text-xs text-muted-foreground mt-1 block">{parsed.media.length} chars</span>
                          </div>
                        )}
                        {parsed.longa && (
                          <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Longa</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(parsed.longa, output.id + '-longa')}
                              >
                                {copiedId === output.id + '-longa' ? <ClipboardCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{parsed.longa}</p>
                            <span className="text-xs text-muted-foreground mt-1 block">{parsed.longa.length} chars</span>
                          </div>
                        )}
                      </div>
                    ) : parsed && request.ai_agents?.type === 'script' ? (
                      // Render script sections
                      <div className="space-y-3">
                        {parsed.gancho && (
                          <div className="border-l-4 border-primary pl-4 py-2">
                            <h4 className="text-xs font-semibold uppercase text-primary mb-1">🎣 Gancho</h4>
                            <p className="text-sm"><strong>Fala:</strong> {parsed.gancho.fala}</p>
                            {parsed.gancho.overlay && (
                              <p className="text-xs text-muted-foreground mt-1">📱 Overlay: {parsed.gancho.overlay}</p>
                            )}
                          </div>
                        )}
                        {parsed.contexto && (
                          <div className="border-l-4 border-info pl-4 py-2">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">📖 Contexto</h4>
                            <p className="text-sm"><strong>Fala:</strong> {parsed.contexto.fala}</p>
                            {parsed.contexto.overlay && (
                              <p className="text-xs text-muted-foreground mt-1">📱 Overlay: {parsed.contexto.overlay}</p>
                            )}
                          </div>
                        )}
                        {parsed.pontos?.map((p: any, i: number) => (
                          <div key={i} className="border-l-4 border-warning pl-4 py-2">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">📌 Ponto {i + 1}</h4>
                            <p className="text-sm"><strong>Fala:</strong> {p.fala}</p>
                            {p.overlay && (
                              <p className="text-xs text-muted-foreground mt-1">📱 Overlay: {p.overlay}</p>
                            )}
                          </div>
                        ))}
                        {parsed.cta && (
                          <div className="border-l-4 border-success pl-4 py-2">
                            <h4 className="text-xs font-semibold uppercase text-primary mb-1">🎯 CTA</h4>
                            <p className="text-sm"><strong>Fala:</strong> {parsed.cta.fala}</p>
                            {parsed.cta.overlay && (
                              <p className="text-xs text-muted-foreground mt-1">📱 Overlay: {parsed.cta.overlay}</p>
                            )}
                          </div>
                        )}
                        {parsed.duracao_estimada && (
                          <p className="text-xs text-muted-foreground">⏱ Duração estimada: {parsed.duracao_estimada}</p>
                        )}
                      </div>
                    ) : (
                      // Raw text fallback
                      <div className="relative">
                        <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">{output.output_text}</pre>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(output.output_text, output.id)}
                    >
                      {isCopied ? <ClipboardCheck className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copiar tudo
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
