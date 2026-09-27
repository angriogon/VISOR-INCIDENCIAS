import { useMemo, useState } from 'react';
import type { Filters, PageKey, ParseResult } from './types/models';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ExcelImporter } from './components/ExcelImporter';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { TechniciansPage } from './pages/TechniciansPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { RoutesPage } from './pages/RoutesPage';
import { MapPage } from './pages/MapPage';
import { ConfigPage } from './pages/ConfigPage';
import { useAppData } from './hooks/useAppData';
import { exportIncidentsXlsx, exportSummaryXlsx } from './services/exportService';
import { EmptyState } from './components/EmptyState';
import { FiltersBar, emptyFilters } from './components/FiltersBar';
import { adaptSummaries, filterIncidents } from './utils/filterUtils';

export default function App() {
  const data = useAppData();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [showImporter, setShowImporter] = useState(false);
  const [configTech, setConfigTech] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const filteredIncidents = useMemo(() => filterIncidents(data.incidents, filters), [data.incidents, filters]);
  const filteredSummaries = useMemo(() => adaptSummaries(data.summaries, filteredIncidents), [data.summaries, filteredIncidents]);
  const reviewingCount = useMemo(() => filteredIncidents.filter((i) => i.conflictoHorario || i.prioridad === 'vencida' || i.prioridad === 'hoy' || i.prioridad === '48h' || (i.domicilio && i.latitud === null) || i.horaInicioMinutos === null).length, [filteredIncidents]);

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };
  const importParsed = async (result: ParseResult) => {
    if (result.missingColumns.length) { showToast(`Faltan columnas: ${result.missingColumns.join(', ')}`); return; }
    await data.importRows(result.rows, result.discardedByOperator);
    showToast(`Excel cargado correctamente · ${result.rows.length} incidencias`);
    setShowImporter(false);
  };

  const handleHeaderExport = () => {
    if (!data.incidents.length) { showToast('No hay datos para exportar.'); return; }
    if (page === 'dashboard' || page === 'tecnicos') { exportSummaryXlsx(filteredSummaries); } else { exportIncidentsXlsx(filteredIncidents); }
    showToast('Exportación preparada.');
  };

  const content = (() => {
    switch (page) {
      case 'dashboard': return <DashboardPage summary={{ total: filteredIncidents.length, techniciansWithLoad: filteredSummaries.length, critical: filteredIncidents.filter((i) => i.prioridad === 'vencida' || i.prioridad === 'hoy').length, expiring48: filteredIncidents.filter((i) => ['vencida','hoy','48h'].includes(i.prioridad)).length, conflicts: filteredIncidents.filter((i) => i.conflictoHorario).length, kmEstimated: filteredIncidents.reduce((sum, i) => sum + (i.distanciaDesdeAnterior ?? 0), 0), travelMin: filteredIncidents.reduce((sum, i) => sum + (i.tiempoDesdeAnterior ?? 0), 0) }} technicians={filteredSummaries} onTech={(tech) => { setPage('rutas'); setConfigTech(tech); }} />;
      case 'revisar': return <ReviewPage incidents={filteredIncidents} summaries={filteredSummaries} />;
      case 'tecnicos': return <TechniciansPage summaries={filteredSummaries} configs={data.settings.technicians} onEdit={(tech) => { setConfigTech(tech.operario); setPage('configuracion'); }} />;
      case 'incidencias': return <IncidentsPage incidents={filteredIncidents} />;
      case 'rutas': return <RoutesPage summaries={filteredSummaries} initialTech={configTech} />;
      case 'mapa': return <MapPage incidents={filteredIncidents} technicians={data.settings.technicians} />;
      case 'configuracion': return <ConfigPage settings={data.settings} initialTech={configTech} onSave={async (next) => { await data.persistSettings(next); showToast('Configuración guardada.'); }} />;
    }
  })();

  if (data.loading && !data.incidents.length) return <div className="loading-screen"><div className="brand-mark">VI</div><strong>Cargando Visor Incidencias…</strong></div>;

  return <div className="app-shell"><Sidebar page={page} setPage={setPage} count={reviewingCount} /><main className="main"><Topbar status={data.status} onImport={() => setShowImporter(true)} onDemo={() => { void data.loadDemo().then(() => showToast('Datos de ejemplo cargados.')); }} onRecalculate={() => { void data.recalculate().then(() => showToast('Planificación recalculada.')); }} onExport={handleHeaderExport}/>{data.incidents.length && page !== 'configuracion' ? <FiltersBar filters={filters} setFilters={setFilters} technicians={data.settings.technicians.map((t) => t.operario)} states={[...new Set(data.incidents.map((i) => i.estado).filter(Boolean))].sort()} /> : null}{data.dataMode === 'demo' ? <div className="import-summary demo-banner"><strong>DATOS DE DEMOSTRACIÓN:</strong> métricas de ruta sintéticas solo para probar alertas y visualizaciones. No se mezclan con una importación real.</div> : null}{data.importStats.imported > 0 ? <div className="import-summary"><strong>Última carga:</strong> {data.importStats.imported} incidencias · {data.importStats.techs} técnicos encontrados · {data.importStats.discarded} registros descartados por operario · {data.importStats.pendingGeo} direcciones pendientes de geolocalización.</div> : null}{data.incidents.length ? content : <div className="empty-page"><EmptyState title="Crea tu primera planificación" text="Carga un Excel con las 10 columnas requeridas o utiliza los datos de ejemplo."/><div><button className="btn primary" onClick={() => setShowImporter(true)}>Cargar Excel</button><button className="btn secondary" onClick={() => void data.loadDemo().then(() => showToast('Datos de ejemplo cargados.'))}>Cargar datos de ejemplo</button></div></div>}{showImporter && <ExcelImporter onParsed={(r) => void importParsed(r)} onClose={() => setShowImporter(false)}/>} {toast && <div className="toast">{toast}</div>}</main></div>;
}
