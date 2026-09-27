import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings, DashboardSummary, Incident, TechnicianSummary } from '../types/models';
import { defaultSettings } from '../data/technicians';
import { loadIncidents, loadSettings, saveIncidents, saveSettings } from '../storage/db';
import { analyzeRoutes, buildIncidents, enrichGeocoding, summarizeWithoutRoutes } from '../services/planningService';
import type { RawIncidentRow } from '../types/models';

export function useAppData() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Listo');
  const [importStats, setImportStats] = useState({ imported: 0, techs: 0, discarded: 0, pendingGeo: 0 });
  const [dataMode, setDataMode] = useState<'none' | 'real' | 'demo'>('none');

  useEffect(() => {
    void Promise.all([loadSettings(defaultSettings), loadIncidents()]).then(([storedSettings, storedIncidents]) => {
      setSettings(storedSettings);
      setIncidents(storedIncidents);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const summaries = useMemo<TechnicianSummary[]>(() => summarizeWithoutRoutes(incidents, settings.technicians), [incidents, settings.technicians]);

  const dashboard = useMemo<DashboardSummary>(() => ({
    total: incidents.length,
    techniciansWithLoad: summaries.length,
    critical: incidents.filter((i) => i.prioridad === 'vencida' || i.prioridad === 'hoy').length,
    expiring48: incidents.filter((i) => ['vencida','hoy','48h'].includes(i.prioridad)).length,
    conflicts: incidents.filter((i) => i.conflictoHorario).length,
    kmEstimated: incidents.reduce((sum, i) => sum + (i.distanciaDesdeAnterior ?? 0), 0),
    travelMin: incidents.reduce((sum, i) => sum + (i.tiempoDesdeAnterior ?? 0), 0)
  }), [incidents, summaries]);

  const persistSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await saveSettings(next);
  }, []);

  const importRows = useCallback(async (rows: RawIncidentRow[], discardedByOperator: number) => {
    setLoading(true);
    setStatus('Procesando…');
    let next = buildIncidents(rows);
    const foundTechs = new Set(next.map((i) => i.operario)).size;
    setStatus('Geolocalizando…');
    next = await enrichGeocoding(next, settings.geocoding, (done, total) => setStatus(`Geolocalizando ${done}/${total}…`));
    setStatus('Calculando rutas…');
    if (settings.routing.enabled) {
      const analyzed = await analyzeRoutes(next, settings.technicians, settings.routing);
      next = analyzed.incidents;
    }
    await saveIncidents(next);
    setIncidents(next);
    setImportStats({ imported: next.length, techs: foundTechs, discarded: discardedByOperator, pendingGeo: next.filter((i) => i.domicilio && i.latitud === null).length });
    setDataMode('real');
    setStatus('Listo');
    setLoading(false);
  }, [settings]);

  const recalculate = useCallback(async () => {
    setLoading(true);
    setStatus('Recalculando…');
    let next = [...incidents];
    if (settings.geocoding.enabled) next = await enrichGeocoding(next, settings.geocoding);
    const analyzed = settings.routing.enabled ? await analyzeRoutes(next, settings.technicians, settings.routing) : { incidents: next, summaries: summarizeWithoutRoutes(next, settings.technicians) };
    setIncidents(analyzed.incidents);
    await saveIncidents(analyzed.incidents);
    setStatus('Listo');
    setLoading(false);
  }, [incidents, settings]);

  const loadDemo = useCallback(async () => {
    setLoading(true);
    setStatus('Cargando datos demo…');
    const { buildDemoIncidents } = await import('../data/demoData');
    const next = buildDemoIncidents();
    await saveIncidents(next);
    setIncidents(next);
    setImportStats({ imported: next.length, techs: new Set(next.map((i) => i.operario)).size, discarded: 0, pendingGeo: next.filter((i) => i.domicilio && i.latitud === null).length });
    setDataMode('demo');
    setStatus('Modo demostración');
    setLoading(false);
  }, []);

  return { settings, incidents, summaries, dashboard, loading, status, importStats, dataMode, persistSettings, importRows, recalculate, loadDemo };
}
