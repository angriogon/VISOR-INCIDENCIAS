import * as XLSX from 'xlsx';
import type { Incident, TechnicianSummary } from '../types/models';
import { formatDate } from '../utils/dateUtils';
import { priorityLabel } from '../utils/priorityUtils';

const exportRows = (incidents: Incident[]) => incidents.map((i) => ({
  'NUM.': i.num,
  'F. VISITA': formatDate(i.fVisita),
  'DESDE HORA': i.desdeHora,
  'FECHA CADUCIDAD': formatDate(i.fechaCaducidad),
  'DESC. SEDE': i.descSede,
  'REFERENCIA': i.referencia,
  'OPERARIO': i.operario,
  'ESTADO': i.estado,
  'DES. CLIENTE': i.descCliente,
  'DOMICILIO': i.domicilio,
  'PRIORIDAD': priorityLabel[i.prioridad],
  'CONFLICTO': i.conflictoHorario ? 'SÍ' : 'NO',
  'KM TRAMO': i.distanciaDesdeAnterior ?? '',
  'MIN TRAMO': i.tiempoDesdeAnterior ?? ''
}));

function download(workbook: ReturnType<typeof XLSX.utils.book_new>, name: string) {
  XLSX.writeFile(workbook, name);
}

export function exportIncidentsXlsx(incidents: Incident[], name = 'incidencias-filtradas.xlsx') {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportRows(incidents)), 'Incidencias');
  download(wb, name);
}

export function exportSummaryXlsx(summaries: TechnicianSummary[], name = 'resumen-carga.xlsx') {
  const wb = XLSX.utils.book_new();
  const rows = summaries.map((s) => ({ Técnico: s.operario, Incidencias: s.incidentCount, Críticas: s.criticalCount, '≤48H': s.caducity48Count, Conflictos: s.conflictCount, 'KM estimados': Math.round(s.distanceKm), 'Min desplazamiento': Math.round(s.travelMin), Carga: s.loadLevel }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Resumen');
  download(wb, name);
}
