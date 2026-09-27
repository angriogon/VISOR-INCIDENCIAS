import { getGeocode, setGeocode } from '../storage/db';
import type { GeocodingConfig } from '../types/models';

export interface Coordinates { lat: number; lon: number; }

export async function geocodeAddress(address: string, config: GeocodingConfig): Promise<Coordinates | null> {
  const normalized = address.trim();
  if (!normalized || !config.enabled) return null;
  const cached = await getGeocode(normalized);
  if (cached) return cached;

  const base = config.url.replace(/\/$/, '');
  const url = config.provider === 'nominatim'
    ? `${base}/search?format=jsonv2&limit=1&q=${encodeURIComponent(normalized)}`
    : `${base}/search?q=${encodeURIComponent(normalized)}`;

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload: unknown = await response.json();
    let coordinates: Coordinates | null = null;
    if (Array.isArray(payload) && payload.length > 0) {
      const first = payload[0] as { lat?: string; lon?: string };
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) coordinates = { lat, lon };
    }
    if (coordinates) await setGeocode(normalized, coordinates);
    return coordinates;
  } catch {
    return null;
  }
}
