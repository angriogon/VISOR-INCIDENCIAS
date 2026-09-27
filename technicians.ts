import type { AppSettings, TechnicianConfig } from '../types/models';
import { AUTHORIZED_TECHNICIANS } from '../types/models';

export const defaultTechnicians: TechnicianConfig[] = AUTHORIZED_TECHNICIANS.map((operario) => ({
  operario,
  puntoInicio: '',
  direccion: '',
  poblacion: '',
  provincia: '',
  latitud: null,
  longitud: null
}));

export const defaultSettings: AppSettings = {
  technicians: defaultTechnicians,
  routing: {
    provider: 'osrm',
    url: 'https://router.project-osrm.org',
    apiKey: '',
    enabled: false
  },
  geocoding: {
    provider: 'nominatim',
    url: 'https://nominatim.openstreetmap.org',
    enabled: false
  }
};
