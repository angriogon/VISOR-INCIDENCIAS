export const AUTHORIZED_TECHNICIANS = [
  'ACAB', 'JMOG', 'DSG', 'CLH', 'ADJC', 'LGV', 'JCGM', 'LEOC', 'IFF', 'JVR',
  'FMNT', 'MMHG', 'ILG', 'JRHG', 'AAR', 'EACL', 'MLOR', 'PHEP', 'JIFC'
] as const;

export type TechnicianCode = typeof AUTHORIZED_TECHNICIANS[number];

export type Priority = 'vencida' | 'hoy' | '48h' | '5dias' | 'normal' | 'sin-fecha';
export type RouteStatus = 'viable' | 'conflict' | 'unknown';

export interface Incident {
  id: string;
  num: string;
  fVisita: string;
  desdeHora: string;
  fechaCaducidad: string;
  descSede: string;
  referencia: string;
  operario: TechnicianCode;
  estado: string;
  descCliente: string;
  domicilio: string;
  prioridad: Priority;
  diasParaCaducidad: number | null;
  fechaNormalizada: string | null;
  horaInicioMinutos: number | null;
  direccionNormalizada: string;
  latitud: number | null;
  longitud: number | null;
  tiempoDesdeAnterior: number | null;
  distanciaDesdeAnterior: number | null;
  horaLlegadaEstimada: string | null;
  margenHorario: number | null;
  conflictoHorario: boolean;
  riesgoRuta: boolean;
  rutaCalculada: boolean;
  ordenActual: number;
  ordenOptimizado: number | null;
}

export interface TechnicianConfig {
  operario: TechnicianCode;
  puntoInicio: string;
  direccion: string;
  poblacion: string;
  provincia: string;
  latitud: number | null;
  longitud: number | null;
}

export interface RoutingConfig {
  provider: 'osrm' | 'openrouteservice' | 'custom';
  url: string;
  apiKey: string;
  enabled: boolean;
}

export interface GeocodingConfig {
  provider: 'nominatim' | 'custom';
  url: string;
  enabled: boolean;
}

export interface AppSettings {
  technicians: TechnicianConfig[];
  routing: RoutingConfig;
  geocoding: GeocodingConfig;
}

export interface Filters {
  tecnico: string;
  fechaVisita: string;
  fechaCaducidad: string;
  prioridad: string;
  estado: string;
  conHora: 'todos' | 'si' | 'no';
  conConflicto: 'todos' | 'si' | 'no';
  conRuta: 'todos' | 'si' | 'no';
  geolocalizado: 'todos' | 'si' | 'no';
  search: string;
}

export interface RouteLeg {
  fromLabel: string;
  toLabel: string;
  distanceKm: number | null;
  durationMin: number | null;
  marginMin: number | null;
  status: RouteStatus;
}

export interface TechnicianSummary {
  operario: TechnicianCode;
  incidentCount: number;
  criticalCount: number;
  caducity48Count: number;
  conflictCount: number;
  routeRiskCount: number;
  distanceKm: number;
  travelMin: number;
  activityLabel: string;
  loadLevel: 'baja' | 'media' | 'alta';
  geocodedCount: number;
  routeKnown: boolean;
  incidents: Incident[];
  legs: RouteLeg[];
}

export interface DashboardSummary {
  total: number;
  techniciansWithLoad: number;
  critical: number;
  expiring48: number;
  conflicts: number;
  kmEstimated: number;
  travelMin: number;
}

export interface ParseResult {
  rows: RawIncidentRow[];
  missingColumns: string[];
  discardedByOperator: number;
}

export interface RawIncidentRow {
  num: string;
  fVisita: unknown;
  desdeHora: unknown;
  fechaCaducidad: unknown;
  descSede: string;
  referencia: string;
  operario: string;
  estado: string;
  descCliente: string;
  domicilio: string;
}

export interface ReviewItem {
  type: 'conflict' | 'expired' | 'soon' | 'distance' | 'unlocated' | 'load' | 'no-time';
  technician?: TechnicianCode;
  incident?: Incident;
  title: string;
  detail: string;
}

export type PageKey = 'dashboard' | 'revisar' | 'tecnicos' | 'incidencias' | 'rutas' | 'mapa' | 'configuracion';
