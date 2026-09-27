import { getRoute, setRoute } from '../storage/db';
import type { RoutingConfig } from '../types/models';

export interface RouteResult { distanceM: number; durationS: number; }
export interface Point { lat: number; lon: number; }

export async function routeBetween(from: Point, to: Point, config: RoutingConfig): Promise<RouteResult | null> {
  if (!config.enabled) return null;
  const key = `${config.provider}:${from.lat.toFixed(5)},${from.lon.toFixed(5)}:${to.lat.toFixed(5)},${to.lon.toFixed(5)}`;
  const cached = await getRoute(key);
  if (cached) return cached;

  try {
    let response: Response;
    if (config.provider === 'osrm') {
      const base = config.url.replace(/\/$/, '');
      response = await fetch(`${base}/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`);
    } else if (config.provider === 'openrouteservice') {
      const base = config.url.replace(/\/$/, '');
      response = await fetch(`${base}/v2/directions/driving-car?start=${from.lon},${from.lat}&end=${to.lon},${to.lat}`, {
        headers: config.apiKey ? { Authorization: config.apiKey } : undefined
      });
    } else {
      const url = new URL(config.url);
      url.searchParams.set('from', `${from.lat},${from.lon}`);
      url.searchParams.set('to', `${to.lat},${to.lon}`);
      response = await fetch(url.toString(), { headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined });
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: unknown = await response.json();
    const result = parseRoute(data, config.provider);
    if (result) await setRoute(key, result);
    return result;
  } catch {
    return null;
  }
}

function parseRoute(data: unknown, provider: RoutingConfig['provider']): RouteResult | null {
  if (provider === 'osrm') {
    const typed = data as { routes?: Array<{ distance?: number; duration?: number }> };
    const route = typed.routes?.[0];
    if (route && typeof route.distance === 'number' && Number.isFinite(route.distance) && typeof route.duration === 'number' && Number.isFinite(route.duration)) return { distanceM: route.distance, durationS: route.duration };
  }
  if (provider === 'openrouteservice') {
    const typed = data as { features?: Array<{ properties?: { segments?: Array<{ distance?: number; duration?: number }> } }> };
    const segment = typed.features?.[0]?.properties?.segments?.[0];
    if (segment && typeof segment.distance === 'number' && Number.isFinite(segment.distance) && typeof segment.duration === 'number' && Number.isFinite(segment.duration)) return { distanceM: segment.distance, durationS: segment.duration };
  }
  const typed = data as { distanceM?: number; durationS?: number; distance?: number; duration?: number };
  const distanceM = typed.distanceM ?? typed.distance;
  const durationS = typed.durationS ?? typed.duration;
  if (typeof distanceM === 'number' && Number.isFinite(distanceM) && typeof durationS === 'number' && Number.isFinite(durationS)) return { distanceM, durationS };
  return null;
}
