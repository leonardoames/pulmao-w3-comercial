export interface CloserNivel {
  nivel: string;
  label: string;
  taxa_conversao: number;
  salario_fixo: number;
  ordem: number;
}

export const RAMPAGEM_MULTIPLIERS = { none: 1, ramp1: 0.5, ramp2: 0.75 } as const;
export const RAMPAGEM_LABELS = { none: 'Sem rampagem', ramp1: 'Rampagem 1 (50%)', ramp2: 'Rampagem 2 (75%)' } as const;

export interface OteGoal {
  id: string;
  month_ref: string; // YYYY-MM
  closer_user_id: string;
  ote_target_value: number;
  created_by_user_id: string;
  criado_em: string;
  atualizado_em: string;
  // Relations
  closer?: {
    id: string;
    nome: string;
  };
}

export interface OteRealized {
  closerId: string;
  closerNome: string;
  pixSum: number;
  cardSum: number;
  boletoSum: number;
  oteRealized: number; // PIX*1.2 + CARD*1.0 + BOLETO*0.5
  oteTarget: number;
  percentAchieved: number;
  remaining: number;
  badge: '50%' | '70%' | '100%' | '120%' | null;
  nivelKey?: string | null;
  nivelLabel?: string | null;
  rampagemKey?: string | null;
  salarioFixo?: number;
}

export const OTE_MULTIPLIERS = {
  pix: 1.2,
  card: 1.0,
  boleto: 0.5,
} as const;

export const OTE_THRESHOLDS = [50, 70, 100, 120] as const;

export function calculateOteRealized(pixSum: number, cardSum: number, boletoSum: number): number {
  return (pixSum * OTE_MULTIPLIERS.pix) + (cardSum * OTE_MULTIPLIERS.card) + (boletoSum * OTE_MULTIPLIERS.boleto);
}

export function getOteBadge(percentAchieved: number): OteRealized['badge'] {
  if (percentAchieved >= 120) return '120%';
  if (percentAchieved >= 100) return '100%';
  if (percentAchieved >= 70) return '70%';
  if (percentAchieved >= 50) return '50%';
  return null;
}
