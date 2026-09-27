import { AlertTriangle, ClockAlert, MapPinOff, MoveUpRight, Siren, TimerOff, UsersRound } from 'lucide-react';
import type { Incident, ReviewItem, TechnicianSummary } from '../types/models';
import { PriorityBadge } from '../components/Badge';

function reviewItems(incidents: Incident[], summaries: TechnicianSummary[]): ReviewItem[] {
  const items: ReviewItem[] = [];
  incidents.filter((i) => i.conflictoHorario).forEach((i) => items.push({ type: 'conflict', technician: i.operario, incident: i, title: 'CONFLICTO HORARIO', detail: `${i.desdeHora || 'Sin hora'} · margen ${i.margenHorario ?? '—'} min` }));
  incidents.filter((i) => i.prioridad === 'vencida' || i.prioridad === 'hoy').forEach((i) => items.push({ type: i.prioridad === 'vencida' ? 'expired' : 'soon', technician: i.operario, incident: i, title: i.prioridad === 'vencida' ? 'VENCIDA' : 'CADUCA HOY', detail: `${i.referencia || i.num} · ${i.descCliente}` }));
  incidents.filter((i) => i.prioridad === '48h').forEach((i) => items.push({ type: 'soon', technician: i.operario, incident: i, title: 'CADUCIDAD PRÓXIMA', detail: `${i.referencia || i.num} · ≤ 48 h` }));
  incidents.filter((i) => i.distanciaDesdeAnterior !== null && i.distanciaDesdeAnterior >= 80).forEach((i) => items.push({ type: 'distance', technician: i.operario, incident: i, title: 'DESPLAZAMIENTO ELEVADO', detail: `${i.distanciaDesdeAnterior?.toFixed(0)} km desde el tramo anterior` }));
  incidents.filter((i) => i.domicilio && (i.latitud === null || i.longitud === null)).forEach((i) => items.push({ type: 'unlocated', technician: i.operario, incident: i, title: 'DIRECCIÓN NO LOCALIZADA', detail: i.domicilio }));
  summaries.filter((s) => s.loadLevel === 'alta').forEach((s) => items.push({ type: 'load', technician: s.operario, title: 'CARGA ELEVADA', detail: `${s.incidentCount} incidencias · ${s.criticalCount} críticas` }));
  incidents.filter((i) => i.horaInicioMinutos === null).forEach((i) => items.push({ type: 'no-time', technician: i.operario, incident: i, title: 'INCIDENCIA SIN HORA', detail: `${i.referencia || i.num} · requiere revisión manual` }));
  return items;
}

const icons = { conflict: AlertTriangle, expired: Siren, soon: ClockAlert, distance: MoveUpRight, unlocated: MapPinOff, load: UsersRound, 'no-time': TimerOff };

export function ReviewPage({ incidents, summaries }: { incidents: Incident[]; summaries: TechnicianSummary[] }) {
  const items = reviewItems(incidents, summaries);
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">CONTROL</div><h1>Revisar</h1><p>{items.length} puntos requieren atención o revisión manual.</p></div></div>{items.length ? <div className="review-grid">{items.map((item, idx) => { const Icon = icons[item.type]; return <article className={`review-card review-${item.type}`} key={`${item.type}-${item.incident?.id ?? item.technician ?? idx}`}><div className="review-icon"><Icon size={18}/></div><div className="review-body"><div className="review-head"><strong>{item.title}</strong>{item.incident && <PriorityBadge priority={item.incident.prioridad}/>}</div><div className="review-tech">{item.technician}</div><div className="review-detail">{item.incident?.descCliente || item.detail}</div>{item.incident && <div className="muted">{item.incident.descSede || item.incident.referencia} · {item.incident.domicilio || 'Dirección no disponible'}</div>}</div></article>; })}</div> : <div className="empty-state"><h3>No hay alertas de revisión</h3><p>La planificación actual no presenta incidencias en las reglas de revisión.</p></div>}</div>;
}
