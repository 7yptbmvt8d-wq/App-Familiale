import type { LiveMember, Role, SharingMode } from '../backend/types';
import { formatDistance } from './geo';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Responsable',
  adult: 'Adulte',
  minor: 'Mineur',
};

export const SHARING_LABELS: Record<SharingMode, string> = {
  auto: 'Automatique',
  optin: 'Activé',
  temporary: 'Temporaire',
  off: 'Désactivé',
};

/** Libellé de présence sous un prénom (« à la maison », « Bureau · 4,2 km »). */
export function placeLabel(m: LiveMember): string {
  if (m.status === 'unknown') return 'Partage désactivé';
  if (m.status === 'home') return 'à la maison';
  if (m.zone && m.zone.kind !== 'home') return `${m.zone.label} · ${formatDistance(m.distanceMeters)}`;
  if (m.status === 'nearby') return `à proximité · ${formatDistance(m.distanceMeters)}`;
  return formatDistance(m.distanceMeters);
}
