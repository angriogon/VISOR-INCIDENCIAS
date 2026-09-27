import { AlertTriangle, ClipboardList, Cog, LayoutDashboard, Map, Route, Users } from 'lucide-react';
import type { PageKey } from '../types/models';

const items: Array<{ key: PageKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { key: 'revisar', label: 'REVISAR', icon: AlertTriangle },
  { key: 'tecnicos', label: 'TÉCNICOS', icon: Users },
  { key: 'incidencias', label: 'INCIDENCIAS', icon: ClipboardList },
  { key: 'rutas', label: 'RUTAS', icon: Route },
  { key: 'mapa', label: 'MAPA', icon: Map },
  { key: 'configuracion', label: 'CONFIGURACIÓN', icon: Cog }
];

export function Sidebar({ page, setPage, count }: { page: PageKey; setPage: (page: PageKey) => void; count: number }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark">VI</div><div><strong>VISOR</strong><span>INCIDENCIAS</span></div></div>
    <nav>{items.map(({ key, label, icon: Icon }) => <button key={key} className={page === key ? 'nav-item active' : 'nav-item'} onClick={() => setPage(key)}><Icon size={18} /><span>{label}</span>{key === 'revisar' && count > 0 && <em>{count}</em>}</button>)}</nav>
    <div className="sidebar-foot">Datos locales · IndexedDB</div>
  </aside>;
}
