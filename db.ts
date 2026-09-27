import { openDB } from 'idb';
import type { AppSettings, Incident } from '../types/models';

const DB_NAME = 'visor-incidencias-db';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
    if (!db.objectStoreNames.contains('incidents')) db.createObjectStore('incidents', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('geocache')) db.createObjectStore('geocache');
    if (!db.objectStoreNames.contains('routecache')) db.createObjectStore('routecache');
  }
});

export async function loadSettings<T extends AppSettings>(fallback: T): Promise<T> {
  const db = await dbPromise;
  return (await db.get('settings', 'app')) ?? fallback;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await dbPromise;
  await db.put('settings', settings, 'app');
}

export async function saveIncidents(incidents: Incident[]): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction('incidents', 'readwrite');
  await tx.store.clear();
  for (const incident of incidents) await tx.store.put(incident);
  await tx.done;
}

export async function loadIncidents(): Promise<Incident[]> {
  const db = await dbPromise;
  return db.getAll('incidents');
}

export async function getGeocode(address: string): Promise<{ lat: number; lon: number } | undefined> {
  const db = await dbPromise;
  return db.get('geocache', address);
}

export async function setGeocode(address: string, coords: { lat: number; lon: number }): Promise<void> {
  const db = await dbPromise;
  await db.put('geocache', coords, address);
}

export async function getRoute(key: string): Promise<{ distanceM: number; durationS: number } | undefined> {
  const db = await dbPromise;
  return db.get('routecache', key);
}

export async function setRoute(key: string, value: { distanceM: number; durationS: number }): Promise<void> {
  const db = await dbPromise;
  await db.put('routecache', value, key);
}
