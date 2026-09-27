import { MapPin, Navigation, Route } from 'lucide-react';
import type { TechnicianConfig, TechnicianSummary } from '../types/models';
import { formatKm, formatMin } from '../utils/formatUtils';

export function TechniciansPage({ summaries, configs, onEdit }: { summaries: TechnicianSummary[]; configs: TechnicianConfig[]; onEdit: (tech: TechnicianConfig) => void }) {
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">CONFIGURACIÓN OPERATIVA</div><h1>Técnicos</h1><p>Los 19 operarios autorizados permanecen disponibles aunque no tengan carga.</p></div></div>
    <div className="table-wrap"><table><thead><tr><th>OPERARIO</th><th>CARGA</th><th>RUTA</th><th>INICIO</th><th>COORDENADAS</th><th></th></tr></thead><tbody>{configs.map((config) => { const s = summaries.find((x) => x.operario === config.operario); return <tr key={config.operario}><td><strong>{config.operario}</strong></td><td>{s ? <><span className={`dot-level ${s.loadLevel}`} /> {s.incidentCount} · {s.criticalCount} críticas</> : 'Sin carga'}</td><td>{s ? `${formatKm(s.distanceKm)} · ${formatMin(s.travelMin)}` : '—'}</td><td>{config.puntoInicio || 'Inicio no configurado'}</td><td>{config.latitud !== null && config.longitud !== null ? `${config.latitud.toFixed(5)}, ${config.longitud.toFixed(5)}` : 'No configuradas'}</td><td><button className="table-action" onClick={() => onEdit(config)}><Navigation size={15}/> Configurar</button></td></tr>; })}</tbody></table></div>
    <div className="info-strip"><MapPin size={16}/><span>La ruta solo se considera calculada cuando existen coordenadas y el proveedor de routing devuelve distancia y duración. No se estiman tiempos manualmente.</span><Route size={16}/><span><strong>Nota:</strong> las incidencias críticas se calculan exclusivamente según fecha de caducidad.</span></div>
  </div>;
}
