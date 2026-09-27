import type { Incident, RawIncidentRow, TechnicianConfig, TechnicianSummary, RouteLeg, RoutingConfig } from '../types/models';
import { daysUntil, normalizeDate, normalizeTime, timeToMinutes } from '../utils/dateUtils';
import { getPriority } from '../utils/priorityUtils';
import { geocodeAddress } from './geocodingService';
import { routeBetween } from './routingService';

export function buildIncidents(rows: RawIncidentRow[]): Incident[] {
  return rows.map((row, index) => {
    const date = normalizeDate(row.fVisita);
    const expiry = normalizeDate(row.fechaCaducidad);
    const time = normalizeTime(row.desdeHora);
    const days = daysUntil(expiry);
    return {
      id: `${row.num || 'row'}-${index}`,
      num: row.num || `SIN-${index + 1}`,
      fVisita: date ?? '',
      desdeHora: time ?? '',
      fechaCaducidad: expiry ?? '',
      descSede: row.descSede,
      referencia: row.referencia,
      operario: row.operario as Incident['operario'],
      estado: row.estado,
      descCliente: row.descCliente,
      domicilio: row.domicilio,
      prioridad: getPriority(days),
      diasParaCaducidad: days,
      fechaNormalizada: date,
      horaInicioMinutos: timeToMinutes(time),
      direccionNormalizada: row.domicilio.trim().replace(/\s+/g, ' '),
      latitud: null,
      longitud: null,
      tiempoDesdeAnterior: null,
      distanciaDesdeAnterior: null,
      horaLlegadaEstimada: null,
      margenHorario: null,
      conflictoHorario: false,
      riesgoRuta: false,
      rutaCalculada: false,
      ordenActual: index + 1,
      ordenOptimizado: null
    };
  });
}

export async function enrichGeocoding(
  incidents: Incident[],
  config: import('../types/models').GeocodingConfig,
  onProgress?: (done: number, total: number) => void
): Promise<Incident[]> {
  if (!config.enabled) return incidents;
  const output = [...incidents];
  const unique = [...new Set(output.map((i) => i.direccionNormalizada).filter(Boolean))];
  let done = 0;
  for (const address of unique) {
    const coords = await geocodeAddress(address, config);
    output.forEach((incident, idx) => {
      if (incident.direccionNormalizada === address && coords) output[idx] = { ...incident, latitud: coords.lat, longitud: coords.lon };
    });
    done += 1;
    onProgress?.(done, unique.length);
  }
  return output;
}

export async function analyzeRoutes(incidents: Incident[], technicians: TechnicianConfig[], routing: RoutingConfig): Promise<{ incidents: Incident[]; summaries: TechnicianSummary[] }> {
  const updated = [...incidents];
  const summaries: TechnicianSummary[] = [];
  for (const tech of technicians) {
    const techIncidents = updated.filter((i) => i.operario === tech.operario).sort((a, b) => {
      const at = a.horaInicioMinutos ?? Number.MAX_SAFE_INTEGER;
      const bt = b.horaInicioMinutos ?? Number.MAX_SAFE_INTEGER;
      return at - bt || a.num.localeCompare(b.num);
    });
    if (!techIncidents.length) continue;

    techIncidents.forEach((incident, index) => {
      const idx = updated.findIndex((item) => item.id === incident.id);
      updated[idx] = { ...updated[idx], ordenActual: index + 1, ordenOptimizado: null, conflictoHorario: false, riesgoRuta: false, tiempoDesdeAnterior: null, distanciaDesdeAnterior: null, margenHorario: null, horaLlegadaEstimada: null, rutaCalculada: false };
    });

    let currentPoint = tech.latitud !== null && tech.longitud !== null ? { lat: tech.latitud, lon: tech.longitud } : null;
    let previousTimedIncident: Incident | null = null;
    const legs: RouteLeg[] = [];
    let totalDistance = 0;
    let totalTravel = 0;
    let conflicts = 0;
    let risks = 0;
    let routeKnown = Boolean(currentPoint);

    for (const incident of techIncidents) {
      const point = incident.latitud !== null && incident.longitud !== null ? { lat: incident.latitud, lon: incident.longitud } : null;
      const fromLabel = currentPoint ? (legs.length ? legs[legs.length - 1].toLabel : `Inicio ${tech.operario}`) : `Anterior ${tech.operario}`;
      const toLabel = incident.descSede || incident.referencia || incident.num;
      let distanceKm: number | null = null;
      let durationMin: number | null = null;
      let marginMin: number | null = null;
      let status: RouteLeg['status'] = 'unknown';

      if (currentPoint && point) {
        const route = await routeBetween(currentPoint, point, routing);
        if (route) {
          distanceKm = route.distanceM / 1000;
          durationMin = route.durationS / 60;
          totalDistance += distanceKm;
          totalTravel += durationMin;
          routeKnown = true;

          if (previousTimedIncident?.horaInicioMinutos !== null && previousTimedIncident?.horaInicioMinutos !== undefined && incident.horaInicioMinutos !== null) {
            const gapMin = incident.horaInicioMinutos - previousTimedIncident.horaInicioMinutos;
            marginMin = gapMin - durationMin;
            if (marginMin < 0) conflicts += 1;
            if (marginMin >= 0 && marginMin <= 20) risks += 1;
            status = marginMin < 0 ? 'conflict' : 'viable';
          }

          const idx = updated.findIndex((item) => item.id === incident.id);
          updated[idx] = {
            ...updated[idx],
            tiempoDesdeAnterior: durationMin,
            distanciaDesdeAnterior: distanceKm,
            horaLlegadaEstimada: null,
            margenHorario: marginMin,
            conflictoHorario: marginMin !== null && marginMin < 0,
            riesgoRuta: marginMin !== null && marginMin >= 0 && marginMin <= 20,
            rutaCalculada: true
          };
          currentPoint = point;
          legs.push({ fromLabel, toLabel, distanceKm, durationMin, marginMin, status });
        } else {
          routeKnown = false;
          legs.push({ fromLabel, toLabel, distanceKm: null, durationMin: null, marginMin: null, status: 'unknown' });
          currentPoint = point;
        }
      } else {
        routeKnown = false;
        legs.push({ fromLabel, toLabel, distanceKm: null, durationMin: null, marginMin: null, status: 'unknown' });
        currentPoint = point;
      }

      if (incident.horaInicioMinutos !== null) previousTimedIncident = incident;
    }

    summaries.push(makeSummary(tech.operario, techIncidents.map((i) => updated.find((u) => u.id === i.id) ?? i), totalDistance, totalTravel, conflicts, risks, routeKnown, legs));
  }
  return { incidents: updated, summaries };
}

export function summarizeWithoutRoutes(incidents: Incident[], technicians: TechnicianConfig[]): TechnicianSummary[] {
  return technicians.flatMap((tech) => {
    const list = incidents.filter((i) => i.operario === tech.operario);
    if (!list.length) return [];
    return [makeSummary(tech.operario, list, 0, 0, list.filter((i) => i.conflictoHorario).length, list.filter((i) => i.riesgoRuta).length, false, [])];
  });
}

function makeSummary(
  operario: Incident['operario'], incidents: Incident[], distanceKm: number, travelMin: number, conflicts: number, risks: number, routeKnown: boolean, legs: RouteLeg[]
): TechnicianSummary {
  const count = incidents.length;
  const critical = incidents.filter((i) => i.prioridad === 'vencida' || i.prioridad === 'hoy').length;
  const caducity48 = incidents.filter((i) => ['vencida','hoy','48h'].includes(i.prioridad)).length;
  const loadLevel = count >= 7 || critical >= 2 ? 'alta' : count >= 4 ? 'media' : 'baja';
  return {
    operario,
    incidentCount: count,
    criticalCount: critical,
    caducity48Count: caducity48,
    conflictCount: conflicts,
    routeRiskCount: risks,
    distanceKm,
    travelMin,
    activityLabel: 'Duración de intervención no disponible',
    loadLevel,
    geocodedCount: incidents.filter((i) => i.latitud !== null && i.longitud !== null).length,
    routeKnown,
    incidents,
    legs
  };
}
