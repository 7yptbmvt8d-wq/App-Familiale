import type { Role } from '../backend/types';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Responsable',
  adult: 'Adulte',
  minor: 'Mineur',
};
