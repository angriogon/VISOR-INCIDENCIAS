import type { Priority } from '../types/models';

export function getPriority(days: number | null): Priority {
  if (days === null) return 'sin-fecha';
  if (days < 0) return 'vencida';
  if (days === 0) return 'hoy';
  if (days <= 2) return '48h';
  if (days <= 5) return '5dias';
  return 'normal';
}

export const priorityLabel: Record<Priority, string> = {
  vencida: 'VENCIDA',
  hoy: 'CADUCA HOY',
  '48h': '≤ 48 H',
  '5dias': '≤ 5 DÍAS',
  normal: 'NORMAL',
  'sin-fecha': 'SIN FECHA'
};
