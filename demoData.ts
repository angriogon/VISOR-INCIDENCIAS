import type { RawIncidentRow } from '../types/models';

const isoDate = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const demoRows: RawIncidentRow[] = [
  { num: 'D-1001', fVisita: isoDate(0), desdeHora: '09:00', fechaCaducidad: isoDate(0), descSede: 'Sede Sevilla Centro', referencia: 'INC-1001', operario: 'ACAB', estado: 'Pendiente', descCliente: 'Cliente Demo Norte', domicilio: 'Sevilla, España' },
  { num: 'D-1002', fVisita: isoDate(0), desdeHora: '10:00', fechaCaducidad: isoDate(2), descSede: 'Sede Dos Hermanas', referencia: 'INC-1002', operario: 'ACAB', estado: 'Pendiente', descCliente: 'Cliente Demo Sur', domicilio: 'Dos Hermanas, Sevilla, España' },
  { num: 'D-1003', fVisita: isoDate(0), desdeHora: '12:30', fechaCaducidad: isoDate(6), descSede: 'Sede Alcalá', referencia: 'INC-1003', operario: 'ACAB', estado: 'En curso', descCliente: 'Cliente Demo Este', domicilio: 'Alcalá de Guadaíra, Sevilla, España' },
  { num: 'D-1023', fVisita: isoDate(0), desdeHora: '13:30', fechaCaducidad: isoDate(7), descSede: 'Sede Sevilla 4', referencia: 'INC-1023', operario: 'ACAB', estado: 'Pendiente', descCliente: 'Cliente Demo 23', domicilio: 'Sevilla, España' },
  { num: 'D-1024', fVisita: isoDate(0), desdeHora: '15:00', fechaCaducidad: isoDate(8), descSede: 'Sede Sevilla 5', referencia: 'INC-1024', operario: 'ACAB', estado: 'Pendiente', descCliente: 'Cliente Demo 24', domicilio: 'Tomares, Sevilla, España' },
  { num: 'D-1025', fVisita: isoDate(0), desdeHora: '', fechaCaducidad: isoDate(9), descSede: 'Sede Sevilla 6', referencia: 'INC-1025', operario: 'ACAB', estado: 'Pendiente', descCliente: 'Cliente Demo 25', domicilio: 'La Rinconada, Sevilla, España' },
  { num: 'D-1026', fVisita: isoDate(0), desdeHora: '', fechaCaducidad: isoDate(10), descSede: 'Sede Sevilla 7', referencia: 'INC-1026', operario: 'ACAB', estado: 'Pendiente', descCliente: 'Cliente Demo 26', domicilio: 'Dos Hermanas, Sevilla, España' },
  { num: 'D-1004', fVisita: isoDate(0), desdeHora: '09:30', fechaCaducidad: isoDate(1), descSede: 'Sede Sevilla Este', referencia: 'INC-1004', operario: 'DSG', estado: 'Pendiente', descCliente: 'Cliente Demo 4', domicilio: 'Sevilla, España' },
  { num: 'D-1005', fVisita: isoDate(0), desdeHora: '10:00', fechaCaducidad: isoDate(0), descSede: 'Sede Utrera', referencia: 'INC-1005', operario: 'DSG', estado: 'Pendiente', descCliente: 'Cliente Demo 5', domicilio: 'Utrera, Sevilla, España' },
  { num: 'D-1006', fVisita: isoDate(0), desdeHora: '', fechaCaducidad: isoDate(4), descSede: 'Sede Córdoba', referencia: 'INC-1006', operario: 'JMOG', estado: 'Pendiente', descCliente: 'Cliente Demo 6', domicilio: 'Córdoba, España' },
  { num: 'D-1007', fVisita: isoDate(1), desdeHora: '09:00', fechaCaducidad: isoDate(-1), descSede: 'Sede Córdoba Norte', referencia: 'INC-1007', operario: 'JCGM', estado: 'Pendiente', descCliente: 'Cliente Demo 7', domicilio: 'Córdoba, España' },
  { num: 'D-1008', fVisita: isoDate(1), desdeHora: '11:00', fechaCaducidad: isoDate(3), descSede: 'Sede Granada', referencia: 'INC-1008', operario: 'ADJC', estado: 'Pendiente', descCliente: 'Cliente Demo 8', domicilio: 'Granada, España' },
  { num: 'D-1009', fVisita: isoDate(0), desdeHora: '09:00', fechaCaducidad: isoDate(7), descSede: 'Sede Málaga', referencia: 'INC-1009', operario: 'IFF', estado: 'En curso', descCliente: 'Cliente Demo 9', domicilio: 'Málaga, España' },
  { num: 'D-1010', fVisita: isoDate(0), desdeHora: '14:00', fechaCaducidad: isoDate(2), descSede: 'Sede Marbella', referencia: 'INC-1010', operario: 'JVR', estado: 'Pendiente', descCliente: 'Cliente Demo 10', domicilio: 'Marbella, Málaga, España' },
  { num: 'D-1011', fVisita: isoDate(0), desdeHora: '', fechaCaducidad: '', descSede: 'Sede Cádiz', referencia: 'INC-1011', operario: 'AAR', estado: 'Pendiente', descCliente: 'Cliente Demo 11', domicilio: 'Cádiz, España' },
  { num: 'D-1012', fVisita: isoDate(0), desdeHora: '16:00', fechaCaducidad: isoDate(5), descSede: 'Sede Jerez', referencia: 'INC-1012', operario: 'JRHG', estado: 'Pendiente', descCliente: 'Cliente Demo 12', domicilio: 'Jerez de la Frontera, Cádiz, España' },
  { num: 'D-1013', fVisita: isoDate(0), desdeHora: '10:30', fechaCaducidad: isoDate(2), descSede: 'Sede Málaga Centro', referencia: 'INC-1013', operario: 'FMNT', estado: 'Pendiente', descCliente: 'Cliente Demo 13', domicilio: '' },
  { num: 'D-1014', fVisita: isoDate(0), desdeHora: '12:00', fechaCaducidad: isoDate(9), descSede: 'Sede Málaga 2', referencia: 'INC-1014', operario: 'ILG', estado: 'Pendiente', descCliente: 'Cliente Demo 14', domicilio: 'Málaga, España' },
  { num: 'D-1015', fVisita: isoDate(0), desdeHora: '09:00', fechaCaducidad: isoDate(0), descSede: 'Sede Jaén', referencia: 'INC-1015', operario: 'CLH', estado: 'Pendiente', descCliente: 'Cliente Demo 15', domicilio: 'Jaén, España' },
  { num: 'D-1016', fVisita: isoDate(2), desdeHora: '09:30', fechaCaducidad: isoDate(2), descSede: 'Sede Huelva', referencia: 'INC-1016', operario: 'LGV', estado: 'Pendiente', descCliente: 'Cliente Demo 16', domicilio: 'Huelva, España' },
  { num: 'D-1017', fVisita: isoDate(0), desdeHora: '11:00', fechaCaducidad: isoDate(1), descSede: 'Sede Sevilla Oeste', referencia: 'INC-1017', operario: 'LEOC', estado: 'Pendiente', descCliente: 'Cliente Demo 17', domicilio: 'Tomares, Sevilla, España' },
  { num: 'D-1018', fVisita: isoDate(0), desdeHora: '13:00', fechaCaducidad: isoDate(4), descSede: 'Sede Sevilla Norte', referencia: 'INC-1018', operario: 'MMHG', estado: 'Pendiente', descCliente: 'Cliente Demo 18', domicilio: 'La Rinconada, Sevilla, España' },
  { num: 'D-1019', fVisita: isoDate(0), desdeHora: '09:00', fechaCaducidad: isoDate(-2), descSede: 'Sede Sevilla Sur', referencia: 'INC-1019', operario: 'EACL', estado: 'Pendiente', descCliente: 'Cliente Demo 19', domicilio: 'Dos Hermanas, Sevilla, España' },
  { num: 'D-1020', fVisita: isoDate(0), desdeHora: '', fechaCaducidad: isoDate(10), descSede: 'Sede Almería', referencia: 'INC-1020', operario: 'PHEP', estado: 'Pendiente', descCliente: 'Cliente Demo 20', domicilio: 'Almería, España' },
  { num: 'D-1021', fVisita: isoDate(0), desdeHora: '17:00', fechaCaducidad: isoDate(8), descSede: 'Sede Almería 2', referencia: 'INC-1021', operario: 'JIFC', estado: 'Pendiente', descCliente: 'Cliente Demo 21', domicilio: 'Roquetas de Mar, Almería, España' },
  { num: 'D-1022', fVisita: isoDate(0), desdeHora: '10:00', fechaCaducidad: isoDate(6), descSede: 'Sede Cádiz 2', referencia: 'INC-1022', operario: 'AAR', estado: 'Pendiente', descCliente: 'Cliente Demo 22', domicilio: 'El Puerto de Santa María, Cádiz, España' }
];

import type { Incident } from '../types/models';
import { buildIncidents } from '../services/planningService';

const demoCoords: Record<string, [number, number]> = {
  'Sevilla, España': [37.3891, -5.9845],
  'Dos Hermanas, Sevilla, España': [37.2829, -5.9209],
  'Alcalá de Guadaíra, Sevilla, España': [37.3379, -5.8390],
  'Utrera, Sevilla, España': [37.1856, -5.7809],
  'Córdoba, España': [37.8882, -4.7794],
  'Granada, España': [37.1773, -3.5986],
  'Málaga, España': [36.7213, -4.4214],
  'Marbella, Málaga, España': [36.5101, -4.8824],
  'Cádiz, España': [36.5271, -6.2886],
  'Jerez de la Frontera, Cádiz, España': [36.6850, -6.1261],
  'Tomares, Sevilla, España': [37.3718, -6.0459],
  'La Rinconada, Sevilla, España': [37.4876, -5.9801],
  'Almería, España': [36.8340, -2.4637],
  'Roquetas de Mar, Almería, España': [36.7642, -2.6147],
  'Jaén, España': [37.7796, -3.7849],
  'Huelva, España': [37.2614, -6.9447]
};

export function buildDemoIncidents(): Incident[] {
  const incidents = buildIncidents(demoRows);
  const orderedByTech = new Map<string, Incident[]>();
  for (const incident of incidents) {
    const list = orderedByTech.get(incident.operario) ?? [];
    list.push(incident);
    orderedByTech.set(incident.operario, list);
  }
  for (const list of orderedByTech.values()) {
    list.sort((a, b) => (a.horaInicioMinutos ?? Number.MAX_SAFE_INTEGER) - (b.horaInicioMinutos ?? Number.MAX_SAFE_INTEGER));
    for (let idx = 0; idx < list.length; idx += 1) {
      const incident = list[idx];
      const coords = demoCoords[incident.domicilio];
      if (coords) { incident.latitud = coords[0]; incident.longitud = coords[1]; }
      if (idx > 0 && coords) {
        const previous = list[idx - 1];
        const isConflict = incident.operario === 'DSG' && idx === 1;
        const travelMin = isConflict ? 54 : 18 + idx * 7;
        const distanceKm = isConflict ? 62 : (incident.operario === 'JVR' && idx === 1 ? 128 : 10 + idx * 8);
        const gap = previous.horaInicioMinutos !== null && incident.horaInicioMinutos !== null ? incident.horaInicioMinutos - previous.horaInicioMinutos : null;
        incident.tiempoDesdeAnterior = travelMin;
        incident.distanciaDesdeAnterior = distanceKm;
        incident.margenHorario = gap === null ? null : gap - travelMin;
        incident.conflictoHorario = isConflict || (incident.margenHorario !== null && incident.margenHorario < 0);
        incident.riesgoRuta = !incident.conflictoHorario && incident.margenHorario !== null && incident.margenHorario <= 20;
        incident.rutaCalculada = true;
      }
    }
  }
  return incidents;
}
