import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Incident } from '../types/models';
import { PriorityBadge, StatusBadge } from '../components/Badge';
import { exportIncidentsXlsx } from '../services/exportService';
import { formatDate } from '../utils/dateUtils';

export function IncidentsPage({ incidents }: { incidents: Incident[] }) {
  const [sort, setSort] = useState<{ key: keyof Incident; asc: boolean }>({ key: 'fechaCaducidad', asc: true });
  const sorted = useMemo(() => [...incidents].sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? '')) * (sort.asc ? 1 : -1)), [incidents, sort]);
  const th = (key: keyof Incident, label: string) => <th onClick={() => setSort((s) => ({ key, asc: s.key === key ? !s.asc : true }))}>{label} {sort.key === key ? (sort.asc ? <ArrowUpAZ size={12}/> : <ArrowDownAZ size={12}/>) : null}</th>;
  return <div className="page"><div className="page-heading"><div><div className="eyebrow">DATOS</div><h1>Incidencias</h1><p>{sorted.length} registros después de aplicar los filtros globales.</p></div><button className="btn secondary" onClick={() => exportIncidentsXlsx(sorted)}>Exportar filtradas</button></div>
    <div className="table-wrap"><table className="incidents-table"><thead><tr>{th('num','NUM.')}{th('fVisita','F. VISITA')}{th('desdeHora','DESDE HORA')}{th('fechaCaducidad','FECHA CADUCIDAD')}{th('descSede','DESC. SEDE')}{th('referencia','REFERENCIA')}{th('operario','OPERARIO')}{th('estado','ESTADO')}{th('descCliente','DES. CLIENTE')}{th('domicilio','DOMICILIO')}<th>PRIORIDAD</th></tr></thead><tbody>{sorted.map((i) => <tr key={i.id}><td>{i.num}</td><td>{formatDate(i.fVisita)}</td><td>{i.desdeHora || '—'}</td><td>{formatDate(i.fechaCaducidad)}</td><td>{i.descSede}</td><td>{i.referencia}</td><td><strong>{i.operario}</strong></td><td><StatusBadge text={i.estado}/></td><td>{i.descCliente}</td><td>{i.domicilio || '—'}</td><td><PriorityBadge priority={i.prioridad}/>{i.conflictoHorario && <span className="mini-alert">CONFLICTO</span>}</td></tr>)}</tbody></table>{!sorted.length && <div className="empty-state compact"><h3>No hay resultados</h3><p>Ajusta los filtros o carga una nueva planificación.</p></div>}</div>
  </div>;
}
