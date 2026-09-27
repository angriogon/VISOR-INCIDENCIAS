import { FileUp, RefreshCcw, Download, Database, Circle } from 'lucide-react';

export function Topbar({ status, onImport, onDemo, onRecalculate, onExport }: { status: string; onImport: () => void; onDemo: () => void; onRecalculate: () => void; onExport: () => void }) {
  return <header className="topbar">
    <div className="status-line"><Circle size={9} fill="currentColor" /> {status}</div>
    <div className="top-actions">
      <button className="btn secondary" onClick={onDemo}><Database size={16} /> Datos de ejemplo</button>
      <button className="btn secondary" onClick={onRecalculate}><RefreshCcw size={16} /> Recalcular</button>
      <button className="btn secondary" onClick={onExport}><Download size={16} /> Exportar</button>
      <button className="btn primary" onClick={onImport}><FileUp size={16} /> Cargar Excel</button>
    </div>
  </header>;
}
