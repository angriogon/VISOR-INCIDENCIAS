export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toIsoDate(value);
  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return toIsoDate(date);
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const direct = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (direct) return `${direct[1]}-${direct[2].padStart(2, '0')}-${direct[3].padStart(2, '0')}`;
  const eu = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (eu) return `${eu[3]}-${eu[2].padStart(2, '0')}-${eu[1].padStart(2, '0')}`;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return toIsoDate(parsed);
  return null;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeTime(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && value >= 0 && value < 1) {
    const mins = Math.round(value * 24 * 60);
    return minutesToTime(mins);
  }
  const raw = String(value).trim().replace('.', ':');
  const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function timeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function daysUntil(date: string | null, now = new Date()): number | null {
  if (!date) return null;
  const target = new Date(`${date}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  target.setHours(23, 59, 59, 999);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES').format(d);
}

export function formatDateTime(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}
