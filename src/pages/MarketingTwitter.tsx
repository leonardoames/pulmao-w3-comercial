import { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Download, Plus, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import TwitterProfileEditor from '@/components/twitter/TwitterProfileEditor';
import TwitterFrame from '@/components/twitter/TwitterFrame';
import { useTwitterProfile } from '@/components/twitter/useTwitterProfile';
import { TweetSlide, TweetTheme, FrameFormat } from '@/components/twitter/types';

// Load Twemoji from CDN
const loadTwemoji = () => {
  if (typeof (window as any).twemoji !== 'undefined') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js';
    s.onload = () => resolve();
    s.onerror = () => resolve(); // graceful fallback
    document.head.appendChild(s);
  });
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function MarketingTwitter() {
  const { profile, setProfile } = useTwitterProfile();
  const [theme, setTheme] = useState<TweetTheme>('light');
  const [format, setFormat] = useState<FrameFormat>('1:1');
  const [scale, setScale] = useState(1);
  const [slides, setSlides] = useState<TweetSlide[]>([{ id: generateId(), text: '' }]);
  const [activeIndex, setActiveIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const [twemojiReady, setTwemojiReady] = useState(false);

  useEffect(() => {
    loadTwemoji().then(() => setTwemojiReady(true));
  }, []);

  const activeSlide = slides[activeIndex] || slides[0];

  const updateSlideText = (text: string) => {
    setSlides(s => s.map((sl, i) => i === activeIndex ? { ...sl, text } : sl));
  };

  const addSlide = () => {
    const ns = { id: generateId(), text: '' };
    setSlides(s => [...s, ns]);
    setActiveIndex(slides.length);
  };

  const duplicateSlide = () => {
    const dup = { ...activeSlide, id: generateId() };
    const newSlides = [...slides];
    newSlides.splice(activeIndex + 1, 0, dup);
    setSlides(newSlides);
    setActiveIndex(activeIndex + 1);
  };

  const removeSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== activeIndex);
    setSlides(newSlides);
    setActiveIndex(Math.min(activeIndex, newSlides.length - 1));
  };

  const captureFrame = useCallback(async (): Promise<string> => {
    if (!frameRef.current) throw new Error('No frame');
    await document.fonts.ready;
    // Small delay for twemoji rendering
    await new Promise(r => setTimeout(r, 100));
    const dims = { '1:1': { w: 1080, h: 1080 }, '4:5': { w: 1080, h: 1350 }, '9:16': { w: 1080, h: 1920 } };
    const d = dims[format];
    return toPng(frameRef.current, {
      width: d.w,
      height: d.h,
      pixelRatio: 2,
      style: { transform: 'none', transformOrigin: 'top left', overflow: 'hidden' },
    });
  }, [format]);

  const downloadPng = async () => {
    try {
      const dataUrl = await captureFrame();
      const link = document.createElement('a');
      link.download = `tweet-${activeIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const downloadCarousel = async () => {
    const zip = new JSZip();
    const originalIndex = activeIndex;
    for (let i = 0; i < slides.length; i++) {
      setActiveIndex(i);
      // wait for re-render
      await new Promise(r => setTimeout(r, 300));
      try {
        const dataUrl = await captureFrame();
        const base64 = dataUrl.split(',')[1];
        zip.file(`slide-${i + 1}.png`, base64, { base64: true });
      } catch (e) {
        console.error(`Failed slide ${i + 1}`, e);
      }
    }
    setActiveIndex(originalIndex);
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = 'carrossel-twitter.zip';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <AppLayout>
      <PageHeader title="Gerador Twitter" description="Crie posts no estilo Twitter/X e exporte em alta qualidade" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Perfil</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {profile.avatarUrl && <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.handle}</p>
              </div>
            </div>
            <TwitterProfileEditor profile={profile} onChange={setProfile} />
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Configurações</h3>
            <div>
              <Label className="text-xs">Tema do tweet</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as TweetTheme)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as FrameFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                  <SelectItem value="4:5">4:5</SelectItem>
                  <SelectItem value="9:16">9:16 (Story)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Escala do tweet ({Math.round(scale * 100)}%)</Label>
              <Slider
                min={0.8}
                max={1.4}
                step={0.05}
                value={[scale]}
                onValueChange={([v]) => setScale(v)}
              />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Carrossel ({slides.length} slide{slides.length > 1 ? 's' : ''})</h3>
            <div className="flex gap-2 flex-wrap">
              {slides.map((sl, i) => (
                <button
                  key={sl.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-8 h-8 rounded text-xs font-medium border transition-colors ${
                    i === activeIndex
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addSlide} className="flex-1">
                <Plus className="h-3 w-3 mr-1" /> Novo
              </Button>
              <Button variant="outline" size="sm" onClick={duplicateSlide} className="flex-1">
                <Copy className="h-3 w-3 mr-1" /> Duplicar
              </Button>
              <Button variant="outline" size="sm" onClick={removeSlide} disabled={slides.length <= 1}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Center Preview */}
        <div className="lg:col-span-5">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" disabled={activeIndex === 0} onClick={() => setActiveIndex(activeIndex - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Slide {activeIndex + 1}/{slides.length}</span>
                <Button variant="ghost" size="icon" disabled={activeIndex === slides.length - 1} onClick={() => setActiveIndex(activeIndex + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center p-4">
              <TwitterFrame
                ref={frameRef}
                profile={profile}
                text={activeSlide.text}
                theme={theme}
                format={format}
                scale={scale}
              />
            </div>
          </Card>
        </div>

        {/* Right Editor */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Texto do Tweet (Slide {activeIndex + 1})</h3>
              <span className="text-xs text-muted-foreground">{activeSlide.text.length} caracteres</span>
            </div>
            <Textarea
              value={activeSlide.text}
              onChange={e => updateSlideText(e.target.value)}
              placeholder="Digite o texto do tweet aqui..."
              className="min-h-[200px] font-sans"
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </Card>

          <div className="flex gap-3">
            <Button onClick={downloadPng} className="flex-1">
              <Download className="h-4 w-4 mr-2" /> Baixar PNG
            </Button>
            {slides.length > 1 && (
              <Button onClick={downloadCarousel} variant="secondary" className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Baixar ZIP
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
