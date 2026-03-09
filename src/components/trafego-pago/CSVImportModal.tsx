import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// DB columns we support mapping
const DB_COLUMNS = [
  'nome_ecommerce', 'site', 'nicho', 'faturamento_ao_entrar',
  'data_entrada', 'dia_cobranca', 'gestor_user_id', 'plataformas',
  'status', 'tabela_precos', 'observacoes', 'valor_mrr',
] as const;

const COLUMN_LABELS: Record<string, string> = {
  nome_ecommerce: 'Nome E-commerce',
  site: 'Site',
  nicho: 'Nicho',
  faturamento_ao_entrar: 'Faturamento ao Entrar',
  data_entrada: 'Data Entrada',
  dia_cobranca: 'Dia Cobrança',
  gestor_user_id: 'ID Gestor',
  plataformas: 'Plataformas',
  status: 'Status',
  tabela_precos: 'Tabela de Preços',
  observacoes: 'Observações',
  valor_mrr: 'Valor MRR',
};

const VALID_STATUSES = ['Ativo', 'Pausado', 'Cancelado', 'Trial'];

interface ParsedRow {
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function generateModelCSV(): string {
  const headers = DB_COLUMNS.join(';');
  const example = 'Loja Exemplo;https://exemplo.com;Moda;50000;2025-01-15;10;;Meta Ads,Google Ads;Ativo;R$1.500 fixo;Cliente novo;2500';
  return `${headers}\n${example}`;
}

function downloadCSV(content: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportModal({ open, onOpenChange }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappedColumns, setMappedColumns] = useState<string[]>([]);
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const resetState = () => {
    setStep('upload');
    setParsedRows([]);
    setCsvHeaders([]);
    setMappedColumns([]);
    setUnmappedColumns([]);
    setImporting(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Apenas arquivos .csv são aceitos');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        toast.error('Arquivo CSV vazio ou inválido');
        return;
      }

      // Map headers
      const dbSet = new Set<string>(DB_COLUMNS);
      const mapped: string[] = [];
      const unmapped: string[] = [];
      headers.forEach(h => {
        const normalized = h.trim().toLowerCase();
        const found = DB_COLUMNS.find(col => col.toLowerCase() === normalized);
        if (found) mapped.push(found);
        else unmapped.push(h);
      });

      setCsvHeaders(headers);
      setMappedColumns(mapped);
      setUnmappedColumns(unmapped);

      // Parse rows
      const parsed: ParsedRow[] = rows.map(row => {
        const data: Record<string, string> = {};
        const errors: string[] = [];

        headers.forEach((h, i) => {
          const normalized = h.trim().toLowerCase();
          const dbCol = DB_COLUMNS.find(col => col.toLowerCase() === normalized);
          if (dbCol) {
            data[dbCol] = row[i] || '';
          }
        });

        // Validate required field
        if (!data.nome_ecommerce?.trim()) {
          errors.push('nome_ecommerce é obrigatório');
        }

        // Validate status if provided
        if (data.status && !VALID_STATUSES.includes(data.status)) {
          errors.push(`Status inválido: "${data.status}". Use: ${VALID_STATUSES.join(', ')}`);
        }

        // Validate numeric fields
        ['faturamento_ao_entrar', 'valor_mrr', 'dia_cobranca'].forEach(field => {
          if (data[field] && isNaN(parseFloat(data[field].replace(/\./g, '').replace(',', '.')))) {
            errors.push(`${COLUMN_LABELS[field]} deve ser numérico`);
          }
        });

        return { data, errors, isValid: errors.length === 0 };
      });

      setParsedRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const validRows = parsedRows.filter(r => r.isValid);
  const errorRows = parsedRows.filter(r => !r.isValid);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);

    try {
      const inserts = validRows.map(r => {
        const d = r.data;
        return {
          nome_ecommerce: d.nome_ecommerce.trim(),
          site: d.site || null,
          nicho: d.nicho || null,
          faturamento_ao_entrar: d.faturamento_ao_entrar ? parseFloat(d.faturamento_ao_entrar.replace(/\./g, '').replace(',', '.')) : null,
          data_entrada: d.data_entrada || null,
          dia_cobranca: d.dia_cobranca ? parseInt(d.dia_cobranca) : null,
          gestor_user_id: d.gestor_user_id || null,
          plataformas: d.plataformas ? d.plataformas.split(',').map(s => s.trim()).filter(Boolean) : [],
          status: (VALID_STATUSES.includes(d.status) ? d.status : 'Ativo') as any,
          tabela_precos: d.tabela_precos || null,
          observacoes: d.observacoes || null,
          valor_mrr: d.valor_mrr ? parseFloat(d.valor_mrr.replace(/\./g, '').replace(',', '.')) : null,
          criado_por: user?.id || '',
        };
      });

      const { error } = await supabase.from('trafego_pago_clientes').insert(inserts as any);
      if (error) throw error;

      toast.success(`${inserts.length} clientes importados com sucesso`);
      queryClient.invalidateQueries({ queryKey: ['trafego-pago-clientes'] });
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" style={{ color: '#F97316' }} />
            Importar Clientes via CSV
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Drag and drop area */}
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer',
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-12 w-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <p className="text-sm font-medium mb-1">Arraste um arquivo CSV aqui</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>ou clique para selecionar</p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Download model */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => downloadCSV(generateModelCSV(), 'modelo_clientes_trafego_pago.csv')}
            >
              <Download className="h-4 w-4" />
              Baixar modelo CSV
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1.5 px-3 py-1" style={{ borderColor: '#22C55E', color: '#22C55E' }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {validRows.length} válidos
              </Badge>
              {errorRows.length > 0 && (
                <Badge variant="outline" className="gap-1.5 px-3 py-1" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorRows.length} com erro
                </Badge>
              )}
              {unmappedColumns.length > 0 && (
                <Badge variant="outline" className="gap-1.5 px-3 py-1" style={{ borderColor: '#FBBF24', color: '#FBBF24' }}>
                  {unmappedColumns.length} coluna(s) não mapeada(s): {unmappedColumns.join(', ')}
                </Badge>
              )}
            </div>

            {/* Preview table */}
            <div className="border rounded-xl overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    {mappedColumns.map(col => (
                      <TableHead key={col} style={{ fontSize: '12px' }}>{COLUMN_LABELS[col] || col}</TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} style={{ background: !row.isValid ? 'rgba(239,68,68,0.06)' : undefined }}>
                      <TableCell style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{i + 1}</TableCell>
                      {mappedColumns.map(col => (
                        <TableCell key={col} style={{ fontSize: '12px' }}>
                          {row.data[col] || <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                        </TableCell>
                      ))}
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4" style={{ color: '#22C55E' }} />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: '#EF4444' }} />
                            <span style={{ fontSize: '11px', color: '#EF4444' }}>{row.errors[0]}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { resetState(); }}>Voltar</Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Importando...' : `Importar ${validRows.length} clientes`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
