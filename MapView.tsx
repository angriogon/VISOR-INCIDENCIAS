import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident, TechnicianConfig } from '../types/models';

const markerIcon = L.divIcon({ className: 'map-dot', html: '<span></span>', iconSize: [14, 14], iconAnchor: [7, 7] });

export function MapView({ incidents, technician, height = 520 }: { incidents: Incident[]; technician?: TechnicianConfig; height?: number }) {
  const points = useMemo(() => incidents.filter((i) => i.latitud !== null && i.longitud !== null), [incidents]);
  useEffect(() => {
    const el = document.getElementById('visor-map');
    if (!el) return;
    const map = L.map(el, { zoomControl: true }).setView(points[0] ? [points[0].latitud as number, points[0].longitud as number] : [37.3891, -5.9845], points.length ? 10 : 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const latLngs: L.LatLngExpression[] = [];
    if (technician?.latitud !== null && technician?.latitud !== undefined && technician?.longitud !== null && technician?.longitud !== undefined) {
      const start = L.latLng(technician.latitud, technician.longitud);
      L.marker(start, { icon: markerIcon }).addTo(map).bindTooltip(`Inicio ${technician.operario}`);
      latLngs.push(start);
    }
    points.forEach((i, idx) => {
      const point = L.latLng(i.latitud as number, i.longitud as number);
      L.marker(point, { icon: markerIcon }).addTo(map).bindPopup(`<strong>${idx + 1}. ${i.descSede || i.referencia}</strong><br>${i.descCliente}<br>${i.domicilio}`);
      latLngs.push(point);
    });
    if (latLngs.length > 1) {
      L.polyline(latLngs).addTo(map);
      map.fitBounds(L.latLngBounds(latLngs), { padding: [24, 24] });
    }
    return () => { map.remove(); };
  }, [points, technician]);

  if (!points.length && !(technician?.latitud !== null && technician?.latitud !== undefined)) {
    return <div className="empty-map" style={{ minHeight: height }}>Sin coordenadas disponibles. Activa geocodificación o configura las coordenadas del técnico.</div>;
  }
  return <div id="visor-map" className="map-canvas" style={{ height }} />;
}
