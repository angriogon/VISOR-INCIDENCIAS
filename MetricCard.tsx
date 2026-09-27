import type { LucideIcon } from 'lucide-react';

export function MetricCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: LucideIcon; hint?: string }) {
  return <div className="metric-card">
    <div className="metric-icon"><Icon size={18} /></div>
    <div><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{hint && <div className="metric-hint">{hint}</div>}</div>
  </div>;
}
