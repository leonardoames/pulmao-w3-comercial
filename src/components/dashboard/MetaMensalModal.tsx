import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMetaMensal, useUpsertMetaMensal } from '@/hooks/useMetaFaturamento';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetaMensalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMonthRef: string;
}

function generateMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const date = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i);
    options.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
    });
  }
  return options;
}

function formatCurrencyInput(digits: string): string {
  const number = parseInt(digits || '0', 10) / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
}

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export function MetaMensalModal({ open, onOpenChange, defaultMonthRef }: MetaMensalModalProps) {
  const [monthRef, setMonthRef] = useState(defaultMonthRef);
  const [inputValue, setInputValue] = useState('');

  const { data: currentMeta } = useMetaMensal(monthRef);
  const upsert = useUpsertMetaMensal();

  // Preenche o input com o valor atual quando o mês muda
  useEffect(() => {
    if (currentMeta != null) {
      setInputValue(
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentMeta)
      );
    } else {
      setInputValue('');
    }
  }, [currentMeta, monthRef]);

  // Sincroniza mês ao abrir
  useEffect(() => {
    if (open) setMonthRef(defaultMonthRef);
  }, [open, defaultMonthRef]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setInputValue(formatCurrencyInput(digits));
  };

  const handleSave = async () => {
    const valor = parseCurrency(inputValue);
    if (valor <= 0) return;
    await upsert.mutateAsync({ monthRef, valor });
    onOpenChange(false);
  };

  const monthOptions = generateMonthOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Meta de Faturamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mês</Label>
            <Select value={monthRef} onValueChange={setMonthRef}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Meta (R$)</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={inputValue}
              onChange={handleInput}
              autoFocus
            />
          </div>

          {currentMeta != null && (
            <p className="text-xs text-muted-foreground">
              Valor atual:{' '}
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentMeta)}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!inputValue || upsert.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
