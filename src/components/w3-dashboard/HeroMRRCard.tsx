import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, Pencil, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface HeroMRRCardProps {
  mrrTotal: number;
  mrrMeta: number;
  onMetaChange: (v: number) => void;
  variacao: number | null;
  mrrLiquido: number;
  nrr: number | null;
  diaDoMes: number;
  diasNoMes: number;
}

export function HeroMRRCard({
  mrrTotal, mrrMeta, onMetaChange, variacao, mrrLiquido, nrr, diaDoMes, diasNoMes,
}: HeroMRRCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [tempMeta, setTempMeta] = useState(String(mrrMeta));

  const pctMeta = mrrMeta > 0 ? (mrrTotal / mrrMeta) * 100 : 0;
  const pctEsperado = diasNoMes > 0 ? (diaDoMes / diasNoMes) * 100 : 0;

  const progressColor = pctMeta >= pctEsperado ? '#22C55E' : pctMeta >= pctEsperado * 0.8 ? '#FBBF24' : '#EF4444';
  const nrrColor = nrr === null ? 'rgba(255,255,255,0.4)' : nrr > 100 ? '#22C55E' : nrr >= 90 ? '#FBBF24' : '#EF4444';

  const handleSaveMeta = () => {
    const val = parseFloat(tempMeta.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(val) && val >= 0) onMetaChange(val);
    setEditOpen(false);
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex">
        {/* LEFT COLUMN — 60% */}
        <div className="flex-[3] p-6">
          {/* Label */}
          <div className="flex items-center gap-2 mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="uppercase font-normal flex items-center gap-1.5 cursor-help" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>
                    Receita Mensal Recorrente
                    <Info className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>Soma de tudo que seus clientes pagam por mês</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {nrr !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help ml-auto" style={{ fontSize: '13px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Retenção:</span>
                      <span className="font-bold" style={{ color: nrrColor }}>{nrr.toFixed(1)}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Se seus clientes estão pagando mais, igual ou menos que no mês passado. Acima de 100% significa crescimento</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Main value */}
          <span className="tracking-tight block" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#F97316' }}>
            {formatCurrency(mrrTotal)}
          </span>

          {/* Bottom: Crescimento Real */}
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 cursor-help" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                    Crescimento Real:
                    <Info className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>Receita nova menos o que foi perdido no mês</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-bold" style={{ fontSize: '16px', color: mrrLiquido >= 0 ? '#22C55E' : '#EF4444' }}>
              {formatCurrency(mrrLiquido)}
            </span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-px self-stretch" style={{ background: '#222' }} />

        {/* RIGHT COLUMN — 40% */}
        <div className="flex-[2] p-6 flex flex-col justify-center gap-4">
          {/* Meta progress */}
          {mrrMeta > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }} className="uppercase font-normal">Meta do mês</span>
                  <button onClick={() => { setTempMeta(String(mrrMeta)); setEditOpen(true); }} className="p-0.5 rounded hover:bg-white/10 transition-colors">
                    <Pencil className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  </button>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                  {formatCurrency(mrrTotal)}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                  / {formatCurrency(mrrMeta)}
                </span>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="absolute top-0 bottom-0 w-px" style={{ left: `${Math.min(pctEsperado, 100)}%`, background: 'rgba(255,255,255,0.25)', zIndex: 2 }} />
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pctMeta, 100)}%`, background: progressColor }} />
              </div>
              <span style={{ fontSize: '12px', color: progressColor, fontWeight: 600 }}>
                {pctMeta.toFixed(0)}% atingido ({pctEsperado.toFixed(0)}% esperado)
              </span>
            </div>
          ) : (
            <button
              onClick={() => { setTempMeta('0'); setEditOpen(true); }}
              className="text-sm rounded-md px-3 py-2 border border-dashed transition-colors hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
            >
              + Definir meta do mês
            </button>
          )}

          {/* Variação */}
          {variacao !== null && (
            <div className={cn('flex items-center gap-1.5', variacao >= 0 ? 'text-green-400' : 'text-red-400')} style={{ fontSize: '14px', fontWeight: 600 }}>
              {variacao >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}% vs mês anterior
            </div>
          )}
        </div>
      </div>

      {/* Meta edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editar Meta MRR</DialogTitle></DialogHeader>
          <Input
            type="number"
            value={tempMeta}
            onChange={(e) => setTempMeta(e.target.value)}
            placeholder="Ex: 50000"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMeta}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
