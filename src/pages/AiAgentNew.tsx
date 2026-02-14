import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useAiAgents, useCreateAiRequest, useGenerateContent } from '@/hooks/useAiAgents';
import { toast } from 'sonner';

export default function AiAgentNew() {
  const navigate = useNavigate();
  const { data: agents, isLoading: agentsLoading } = useAiAgents();
  const createRequest = useCreateAiRequest();
  const generateContent = useGenerateContent();

  const [tipo, setTipo] = useState<'caption' | 'script'>('caption');
  const [platform, setPlatform] = useState('instagram');
  const [tema, setTema] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [publico, setPublico] = useState('');
  const [tom, setTom] = useState('');
  const [gancho, setGancho] = useState('');
  const [cta, setCta] = useState('');
  const [palavrasProibidas, setPalavrasProibidas] = useState('');
  const [referencia, setReferencia] = useState('');
  const [duracao, setDuracao] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedAgent = agents?.find((a) => a.type === tipo);

  const handleGenerate = async () => {
    if (!selectedAgent) {
      toast.error('Agente não encontrado');
      return;
    }
    if (!tema.trim()) {
      toast.error('Informe o tema/assunto');
      return;
    }

    setIsGenerating(true);
    try {
      const inputsJson = {
        tipo,
        platform,
        tema,
        objetivo,
        publico,
        tom,
        gancho,
        cta,
        palavras_proibidas: palavrasProibidas,
        referencia,
        duracao,
      };

      const request = await createRequest.mutateAsync({
        agent_id: selectedAgent.id,
        platform,
        inputs_json: inputsJson,
      });

      await generateContent.mutateAsync({
        agent_id: selectedAgent.id,
        request_id: request.id,
        inputs_json: inputsJson,
      });

      navigate(`/marketing/ai/${request.id}`);
    } catch {
      // errors handled in hook
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Nova Geração IA" description="Preencha o briefing para gerar conteúdo">
        <Button variant="outline" onClick={() => navigate('/marketing/ai')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </PageHeader>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipo e Plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de conteúdo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as 'caption' | 'script')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caption">Legenda</SelectItem>
                    <SelectItem value="script">Roteiro de Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube Shorts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Briefing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tema / Assunto *</Label>
              <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: Como fechar mais vendas em 2025" />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Select value={objetivo} onValueChange={setObjetivo}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vender">Vender</SelectItem>
                  <SelectItem value="engajar">Engajar</SelectItem>
                  <SelectItem value="educar">Educar</SelectItem>
                  <SelectItem value="prova_social">Prova Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Público-alvo</Label>
              <Input value={publico} onChange={(e) => setPublico(e.target.value)} placeholder="Ex: Empreendedores digitais" />
            </div>
            <div>
              <Label>Tom de voz</Label>
              <Input value={tom} onChange={(e) => setTom(e.target.value)} placeholder="Ex: Direto, provocativo, estilo empreendedor" />
            </div>
            <div>
              <Label>Gancho (opcional)</Label>
              <Input value={gancho} onChange={(e) => setGancho(e.target.value)} placeholder="Ex: Você está perdendo dinheiro sem saber..." />
            </div>
            <div>
              <Label>CTA (Call to Action)</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Ex: Salve esse post agora!" />
            </div>
            <div>
              <Label>Palavras proibidas</Label>
              <Input value={palavrasProibidas} onChange={(e) => setPalavrasProibidas(e.target.value)} placeholder="Ex: grátis, barato, desconto" />
            </div>
            <div>
              <Label>Referência (link/texto) (opcional)</Label>
              <Textarea value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Cole um link ou texto de referência" className="min-h-[80px]" />
            </div>
            {tipo === 'script' && (
              <div>
                <Label>Duração do vídeo</Label>
                <Input value={duracao} onChange={(e) => setDuracao(e.target.value)} placeholder="Ex: 30–45 segundos" />
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !tema.trim()}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" /> Gerar Conteúdo
            </>
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
