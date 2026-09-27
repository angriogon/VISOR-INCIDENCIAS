import type { Priority } from '../types/models';
import { priorityLabel } from '../utils/priorityUtils';

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge badge-${priority}`}>{priorityLabel[priority]}</span>;
}

export function StatusBadge({ text }: { text: string }) {
  return <span className="status-badge">{text || 'SIN ESTADO'}</span>;
}
