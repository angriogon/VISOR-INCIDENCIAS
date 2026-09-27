import type { Filters, Incident, TechnicianSummary } from '../types/models';

export function filterIncidents(incidents: Incident[], filters: Filters): Incident[] {
  return incidents.filter((i) => {
    const text = `${i.num} ${i.descSede} ${i.referencia} ${i.descCliente} ${i.domicilio} ${i.operario}`.toLowerCase();
    return (!filters.search || text.includes(filters.search.toLowerCase()))
      && (filters.tecnico === 'todos' || i.operario === filters.tecnico)
      && (!filters.fechaVisita || i.fVisita === filters.fechaVisita)
      && (!filters.fechaCaducidad || i.fechaCaducidad === filters.fechaCaducidad)
      && (filters.prioridad === 'todos' || i.prioridad === filters.prioridad)
      && (filters.estado === 'todos' || i.estado === filters.estado)
      && (filters.conHora === 'todos' || (filters.conHora === 'si' ? i.horaInicioMinutos !== null : i.horaInicioMinutos === null))
      && (filters.conConflicto === 'todos' || (filters.conConflicto === 'si' ? i.conflictoHorario : !i.conflictoHorario))
      && (filters.conRuta === 'todos' || (filters.conRuta === 'si' ? i.rutaCalculada : !i.rutaCalculada))
      && (filters.geolocalizado === 'todos' || (filters.geolocalizado === 'si' ? i.latitud !== null : i.latitud === null));
  });
}

export function adaptSummaries(summaries: TechnicianSummary[], incidents: Incident[]): TechnicianSummary[] {
  return summaries.map((summary) => {
    const list = incidents.filter((i) => i.operario === summary.operario);
    return {
      ...summary,
      incidents: list,
      incidentCount: list.length,
      criticalCount: list.filter((i) => i.prioridad === 'vencida' || i.prioridad === 'hoy').length,
      caducity48Count: list.filter((i) => ['vencida', 'hoy', '48h'].includes(i.prioridad)).length,
      conflictCount: list.filter((i) => i.conflictoHorario).length,
      routeRiskCount: list.filter((i) => i.riesgoRuta).length,
      distanceKm: list.reduce((sum, i) => sum + (i.distanciaDesdeAnterior ?? 0), 0),
      travelMin: list.reduce((sum, i) => sum + (i.tiempoDesdeAnterior ?? 0), 0),
      geocodedCount: list.filter((i) => i.latitud !== null && i.longitud !== null).length,
      loadLevel: (list.length >= 7 || list.filter((i) => i.prioridad === 'vencida' || i.prioridad === 'hoy').length >= 2 ? 'alta' : list.length >= 4 ? 'media' : 'baja') as TechnicianSummary['loadLevel']
    };
  }).filter((summary) => summary.incidentCount > 0);
}
