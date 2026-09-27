import { useMemo, useState } from 'react';
import { MapPinOff } from 'lucide-react';
import type { Incident, TechnicianConfig } from '../types/models';
import { MapView } from '../components/MapView';

export function MapPage({ incidents, technicians }: { incidents: Incident[]; technicians: TechnicianConfig[] }) {
  const loadedTechs = useMemo(() => [...new Set(incidents.map((i) => i.operario))], [incidents]);
  const [selected, setSelected] = useState<string>(loadedTechs[0] ?? '');
  const tech = technicians.find((t) => t.operario === selected);
  const list = incidents.filter((i) => i.operario === selected);
  const missing = list.filter((i) => i.latitud === null || i.longitud === null);
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">VISUALIZACIÓN</div><h1>Mapa</h1><p>Inicio y puntos geolocalizados del técnico seleccionado.</p></div><select className="tech-select" value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Selecciona técnico</option>{loadedTechs.map((t) => <option key={t}>{t}</option>)}</select></div>
    {selected ? <><MapView incidents={list} technician={tech}/>{missing.length > 0 && <div className="unlocated-list"><div className="section-title"><span><MapPinOff size={16}/> Direcciones no localizadas</span><small>{missing.length}</small></div>{missing.map((i) => <div key={i.id} className="unlocated-row"><strong>{i.num} · {i.operario}</strong><span>{i.descCliente}</span><span>{i.domicilio || 'Dirección vacía'}</span><em>No se ha podido localizar la dirección.</em></div>)}</div>}</> : <div className="empty-state"><h3>Selecciona un técnico</h3><p>El mapa usa exclusivamente coordenadas disponibles.</p></div>}
  </div>;
}
