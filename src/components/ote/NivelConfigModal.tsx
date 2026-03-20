import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCloserNiveis, useUpdateCloserNivel } from '@/hooks/useCloserNiveis';
import { CloserNivel } from '@/types/ote';
import { Loader2 } from 'lucide-react';

interface NivelConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NivelConfigModal({ open, onOpenChange }: NivelConfigModalProps) {
  const { data: niveis, isLoading } = useCloserNiveis();
  const updateNivel = useUpdateCloserNivel();

  // Local editable state
  const [rows, setRows] = useState<CloserNivel[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (niveis) setRows(niveis);
  }, [niveis]);

  const handleChange = (nivel: string, field: 'taxa_conversao' | 'salario_fixo', raw: string) => {
    const value = parseFloat(raw.replace(',', '.')) || 0;
    setRows(prev =>
      prev.map(r => (r.nivel === nivel ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async (row: CloserNivel) => {
    setSaving(row.nivel);
    try {
      await updateNivel.mutateAsync({
        nivel: row.nivel,
        taxa_conversao: row.taxa_conversao,
        salario_fixo: row.salario_fixo,
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Níveis de Closer</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nível</TableHead>
                <TableHead className="text-right">Taxa Conv. (%)</TableHead>
                <TableHead className="text-right">Salário Fixo (R$)</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.nivel}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      className="text-right w-24 ml-auto"
                      value={row.taxa_conversao}
                      onChange={(e) => handleChange(row.nivel, 'taxa_conversao', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="100"
                      min="0"
                      className="text-right w-32 ml-auto"
                      value={row.salario_fixo}
                      onChange={(e) => handleChange(row.nivel, 'salario_fixo', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleSave(row)}
                      disabled={saving === row.nivel}
                    >
                      {saving === row.nivel ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Taxa de conversão: valor entre 0 e 1 (ex: 0.25 = 25%). Salário fixo em R$.
        </p>
      </DialogContent>
    </Dialog>
  );
}
