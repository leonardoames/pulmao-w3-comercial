import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClosers } from '@/hooks/useProfiles';
import { useCreateOteGoal, useUpdateOteGoal, useOteGoal } from '@/hooks/useOteGoals';
import { useAuth } from '@/hooks/useAuth';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OteGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoalId?: string;
  defaultMonth?: string;
  defaultCloserId?: string;
}

export function OteGoalModal({ 
  open, 
  onOpenChange, 
  editingGoalId,
  defaultMonth,
  defaultCloserId,
}: OteGoalModalProps) {
  const { user } = useAuth();
  const { data: closers } = useClosers();
  const createGoal = useCreateOteGoal();
  const updateGoal = useUpdateOteGoal();

  const [monthRef, setMonthRef] = useState(defaultMonth || format(new Date(), 'yyyy-MM'));
  const [closerId, setCloserId] = useState(defaultCloserId || '');
  const [targetValue, setTargetValue] = useState('');

  const { data: existingGoal } = useOteGoal(monthRef, closerId);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setMonthRef(defaultMonth || format(new Date(), 'yyyy-MM'));
      setCloserId(defaultCloserId || '');
      setTargetValue('');
    }
  }, [open, defaultMonth, defaultCloserId]);

  // Load existing goal value when closer/month changes
  useEffect(() => {
    if (existingGoal) {
      setTargetValue(existingGoal.ote_target_value.toString());
    } else {
      setTargetValue('');
    }
  }, [existingGoal]);

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // 3 months back and 6 months forward
    for (let i = -3; i <= 6; i++) {
      const date = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    
    return options;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!closerId || !targetValue || !user) return;

    const value = parseCurrencyToNumber(targetValue);
    if (isNaN(value) || value <= 0) {
      return;
    }

    if (existingGoal) {
      await updateGoal.mutateAsync({
        id: existingGoal.id,
        ote_target_value: value,
      });
    } else {
      await createGoal.mutateAsync({
        month_ref: monthRef,
        closer_user_id: closerId,
        ote_target_value: value,
        created_by_user_id: user.id,
      });
    }

    onOpenChange(false);
  };

  const formatCurrencyInput = (value: string) => {
    // Remove tudo exceto dígitos
    const numericValue = value.replace(/[^\d]/g, '');
    const number = parseInt(numericValue, 10) / 100;
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(number);
  };

  const parseCurrencyToNumber = (value: string): number => {
    // Remove símbolos de moeda e espaços
    let cleaned = value.replace(/[R$\s]/g, '');
    // Formato brasileiro: 142.400,00 -> pontos são milhares, vírgula é decimal
    // Remove pontos de milhar
    cleaned = cleaned.replace(/\./g, '');
    // Substitui vírgula decimal por ponto
    cleaned = cleaned.replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setTargetValue(formatCurrencyInput(raw));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingGoal ? 'Editar Meta OTE' : 'Cadastrar Meta OTE'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mês de Referência</Label>
            <Select value={monthRef} onValueChange={setMonthRef}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Closer</Label>
            <Select value={closerId} onValueChange={setCloserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o closer" />
              </SelectTrigger>
              <SelectContent>
                {closers?.map((closer) => (
                  <SelectItem key={closer.id} value={closer.id}>
                    {closer.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Meta OTE (R$)</Label>
            <Input
              type="text"
              value={targetValue}
              onChange={handleValueChange}
              placeholder="R$ 0,00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!closerId || !targetValue || createGoal.isPending || updateGoal.isPending}
            >
              {existingGoal ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
