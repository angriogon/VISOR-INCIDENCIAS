export function formatKm(value: number): string { return `${value.toFixed(0)} km`; }
export function formatMin(value: number): string {
  const rounded = Math.round(value);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m} min`;
}
export function formatMaybe(value: number | null, suffix = ''): string { return value === null ? '—' : `${Math.round(value)}${suffix}`; }
