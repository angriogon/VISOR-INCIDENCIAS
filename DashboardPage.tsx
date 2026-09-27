import { AlertTriangle, Clock3, Gauge, Route, Siren, Users } from 'lucide-react';
import type { DashboardSummary, TechnicianSummary } from '../types/models';
import { MetricCard } from '../components/MetricCard';
import { TechnicianCard } from '../components/TechnicianCard';
import { formatKm, formatMin } from '../utils/formatUtils';

export function DashboardPage({ summary, technicians, onTech }: { summary: DashboardSummary; technicians: TechnicianSummary[]; onTech: (tech: string) => void }) {
  return <div className="page">
    <div className="page-heading"><div><div className="eyebrow">OPERACIÓN</div><h1>Carga de técnicos</h1><p>Lectura rápida del estado de la planificación cargada.</p></div></div>
    <div className="metrics-grid">
      <MetricCard label="Incidencias totales" value={summary.total} icon={Gauge}/>
      <MetricCard label="Técnicos con carga" value={summary.techniciansWithLoad} icon={Users}/>
      <MetricCard label="Incidencias críticas" value={summary.critical} icon={Siren}/>
      <MetricCard label="Caducan en 48 h" value={summary.expiring48} icon={Clock3}/>
      <MetricCard label="Conflictos horarios" value={summary.conflicts} icon={AlertTriangle}/>
      <MetricCard label="Kilómetros estimados" value={formatKm(summary.kmEstimated)} icon={Route} hint={formatMin(summary.travelMin) + ' de desplazamiento'}/>
    </div>
    <div className="section-title"><span>Técnicos</span><small>{technicians.length} con carga</small></div>
    {technicians.length ? <div className="tech-grid">{technicians.map((s) => <TechnicianCard key={s.operario} summary={s} onClick={() => onTech(s.operario)} />)}</div> : <div className="empty-state"><h3>No hay incidencias cargadas</h3><p>Carga un Excel o utiliza los datos de ejemplo para empezar.</p></div>}
  </div>;
}
