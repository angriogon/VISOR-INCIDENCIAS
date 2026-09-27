import type { Filters } from '../types/models';

export const emptyFilters: Filters = { tecnico: 'todos', fechaVisita: '', fechaCaducidad: '', prioridad: 'todos', estado: 'todos', conHora: 'todos', conConflicto: 'todos', conRuta: 'todos', geolocalizado: 'todos', search: '' };

export function FiltersBar({ filters, setFilters, technicians, states }: { filters: Filters; setFilters: (next: Filters) => void; technicians: string[]; states: string[] }) {
  const update = (key: keyof Filters, value: string) => setFilters({ ...filters, [key]: value });
  return <div className="filters-bar">
    <input value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Buscar sede, cliente, referencia…" />
    <select value={filters.tecnico} onChange={(e) => update('tecnico', e.target.value)}><option value="todos">Todos los técnicos</option>{technicians.map((t) => <option key={t}>{t}</option>)}</select>
    <label className="sr-filter">VISITA<input type="date" value={filters.fechaVisita} onChange={(e) => update('fechaVisita', e.target.value)} /></label>
    <label className="sr-filter">CADUCIDAD<input type="date" value={filters.fechaCaducidad} onChange={(e) => update('fechaCaducidad', e.target.value)} /></label>
    <select value={filters.prioridad} onChange={(e) => update('prioridad', e.target.value)}><option value="todos">Todas las prioridades</option><option value="vencida">VENCIDA</option><option value="hoy">CADUCA HOY</option><option value="48h">≤ 48 H</option><option value="5dias">≤ 5 DÍAS</option><option value="normal">NORMAL</option><option value="sin-fecha">SIN FECHA</option></select>
    <select value={filters.estado} onChange={(e) => update('estado', e.target.value)}><option value="todos">Todos los estados</option>{states.map((s) => <option key={s}>{s}</option>)}</select>
    <select value={filters.conHora} onChange={(e) => update('conHora', e.target.value)}><option value="todos">Hora: todos</option><option value="si">Con hora</option><option value="no">Sin hora</option></select>
    <select value={filters.conConflicto} onChange={(e) => update('conConflicto', e.target.value)}><option value="todos">Conflicto: todos</option><option value="si">Con conflicto</option><option value="no">Sin conflicto</option></select>
    <select value={filters.conRuta} onChange={(e) => update('conRuta', e.target.value)}><option value="todos">Ruta: todos</option><option value="si">Con ruta</option><option value="no">Sin ruta</option></select>
    <select value={filters.geolocalizado} onChange={(e) => update('geolocalizado', e.target.value)}><option value="todos">Geolocalización: todos</option><option value="si">Localizado</option><option value="no">No localizado</option></select>
  </div>;
}
