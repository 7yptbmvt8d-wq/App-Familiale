import type { Geofence, GeoStatus, Location } from '../backend/types';

const R = 6_371_000; // rayon terrestre en mètres

/** Distance de Haversine en mètres entre deux points. */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** « 15 m », « 240 m », « 4,2 km » (format français, virgule décimale). */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const txt = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return `${txt.replace('.', ',')} km`;
}

/** Statut à partir de la distance à la maison. proche ⇒ sauge ; loin ⇒ terracotta. */
export function statusFromDistance(distanceMeters: number, homeRadius = 120): GeoStatus {
  if (!Number.isFinite(distanceMeters)) return 'unknown';
  if (distanceMeters <= homeRadius) return 'home';
  if (distanceMeters <= 300) return 'nearby';
  return 'away';
}

/** Géorepère contenant le point, le cas échéant. */
export function zoneFor(loc: Location, fences: Geofence[]): Geofence | undefined {
  return fences.find((f) => haversine(loc.lat, loc.lng, f.lat, f.lng) <= f.radius);
}

/** Couleur logique d'un statut (classe CSS appliquée côté composant). */
export function isHomeish(status: GeoStatus): boolean {
  return status === 'home' || status === 'nearby';
}
