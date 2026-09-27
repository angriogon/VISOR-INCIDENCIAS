import { AlertTriangle, Clock3, MapPin, Route, Siren } from 'lucide-react';
import type { TechnicianSummary } from '../types/models';
import { formatKm, formatMin } from '../utils/formatUtils';

export function TechnicianCard({ summary, onClick }: { summary: TechnicianSummary; onClick: () => void }) {
  return <button className={`tech-card level-${summary.loadLevel}`} onClick={onClick}>
    <div className="tech-card-header"><div><div className="tech-code">{summary.operario}</div><div className="muted">{summary.loadLevel === 'alta' ? 'Carga alta' : summary.loadLevel === 'media' ? 'Carga media' : 'Carga baja'}</div></div><span className="load-pill">{summary.incidentCount} incidencias</span></div>
    <div className="tech-card-main"><strong>{summary.activityLabel}</strong></div>
    <div className="tech-card-stats">
      <span><Route size={15} /> {formatKm(summary.distanceKm)}</span>
      <span><Clock3 size={15} /> {formatMin(summary.travelMin)}</span>
      <span><MapPin size={15} /> {summary.geocodedCount}/{summary.incidentCount}</span>
      {summary.criticalCount > 0 && <span className="danger-text"><Siren size={15} /> {summary.criticalCount} críticas</span>}
      {summary.conflictCount > 0 && <span className="danger-text"><AlertTriangle size={15} /> {summary.conflictCount} conflictos</span>}
    </div>
  </button>;
}
