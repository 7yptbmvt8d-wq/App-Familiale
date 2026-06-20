import type { Family, Invitation, Member, Post } from '../types';

/* Coordonnées de référence (région lyonnaise) — uniquement pour la démo. */
export const HOME = { lat: 45.764, lng: 4.8357 };
export const SCHOOL = { lat: 45.7702, lng: 4.829 };
export const WORK = { lat: 45.744, lng: 4.87 };

export const FAMILY: Family = {
  id: 'fam-lacroix',
  name: 'Famille Lacroix',
  geofences: [
    { id: 'gf-home', label: 'Maison', kind: 'home', lat: HOME.lat, lng: HOME.lng, radius: 120 },
    { id: 'gf-school', label: 'École', kind: 'school', lat: SCHOOL.lat, lng: SCHOOL.lng, radius: 150 },
    { id: 'gf-work', label: 'Travail', kind: 'work', lat: WORK.lat, lng: WORK.lng, radius: 180 },
  ],
};

/* ── Profils de simulation (mock uniquement) ─────────────────── */
export type SimMode = 'home' | 'zone' | 'commute' | 'off';

export interface SimProfile {
  mode: SimMode;
  anchor?: { lat: number; lng: number }; // home / zone : centre de marche aléatoire
  from?: { lat: number; lng: number }; // commute : point extérieur
  to?: { lat: number; lng: number }; // commute : destination (toujours la maison)
  speedKmh?: number;
  phase?: number; // 0 = extérieur, 1 = maison
  dir?: 1 | -1;
  battery: number;
}

const fam = FAMILY.id;

export const SEED_MEMBERS: Member[] = [
  { id: 'm-helene', familyId: fam, name: 'Hélène', role: 'admin', relation: 'Mère', birthDate: '1984-03-12', color: '#C4623F', initials: 'Hé', sharing: 'optin' },
  { id: 'm-marc', familyId: fam, name: 'Marc', role: 'admin', relation: 'Père', birthDate: '1982-09-02', color: '#A24C32', initials: 'Ma', sharing: 'optin' },
  { id: 'm-lea', familyId: fam, name: 'Léa', role: 'minor', relation: 'Fille · 14 ans', birthDate: '2012-05-21', color: '#C99A4E', initials: 'Lé', sharing: 'auto' },
  { id: 'm-tom', familyId: fam, name: 'Tom', role: 'minor', relation: 'Fils · 11 ans', birthDate: '2015-01-08', color: '#7E8A6A', initials: 'To', sharing: 'auto' },
  { id: 'm-jeanne', familyId: fam, name: 'Jeanne', role: 'adult', relation: 'Grand-mère', birthDate: '1955-11-30', color: '#B98A57', initials: 'Je', sharing: 'optin' },
  { id: 'm-robert', familyId: fam, name: 'Robert', role: 'adult', relation: 'Grand-père', birthDate: '1953-06-17', color: '#8A6A4F', initials: 'Ro', sharing: 'off' },
  { id: 'm-sofia', familyId: fam, name: 'Sofia', role: 'adult', relation: 'Cousine', birthDate: '1996-02-14', color: '#C4623F', initials: 'So', sharing: 'optin' },
  { id: 'm-hugo', familyId: fam, name: 'Hugo', role: 'adult', relation: 'Oncle', birthDate: '1989-07-25', color: '#A24C32', initials: 'Hu', sharing: 'temporary' },
];

export const SEED_SIM: Record<string, SimProfile> = {
  'm-helene': { mode: 'home', anchor: HOME, battery: 0.82 },
  'm-marc': { mode: 'zone', anchor: WORK, battery: 0.54 },
  'm-lea': { mode: 'zone', anchor: SCHOOL, battery: 0.39 },
  'm-tom': { mode: 'zone', anchor: SCHOOL, battery: 0.71 },
  'm-jeanne': { mode: 'home', anchor: HOME, battery: 0.93 },
  'm-robert': { mode: 'off', battery: 0.6 },
  'm-sofia': { mode: 'commute', from: { lat: 45.7665, lng: 4.8385 }, to: HOME, speedKmh: 5, phase: 0.45, dir: 1, battery: 0.66 },
  'm-hugo': { mode: 'commute', from: WORK, to: HOME, speedKmh: 42, phase: 0.3, dir: 1, battery: 0.48 },
};

const now = Date.now();
const H = 3_600_000;
const D = 86_400_000;

export const SEED_POSTS: Post[] = [
  {
    id: 'p-souvenir',
    familyId: fam,
    authorId: 'm-helene',
    type: 'memory',
    room: 'general',
    text: "Première fois de Tom devant la mer. Il a refusé de quitter le sable jusqu'à la nuit.",
    caption: "étretat · falaise d'aval",
    tilt: -2.5,
    yearsAgo: 3,
    createdAt: now - 2 * H,
    favorites: ['m-marc', 'm-jeanne'],
    comments: [
      { id: 'c1', authorId: 'm-jeanne', text: "Quel souvenir… il était si petit.", createdAt: now - 1.5 * H },
    ],
  },
  {
    id: 'p-tomates',
    familyId: fam,
    authorId: 'm-marc',
    type: 'photo',
    room: 'general',
    text: 'Les tomates de Robert ont enfin mûri.',
    caption: 'jardin · récolte de juin',
    tilt: 3.5,
    createdAt: now - 5 * H,
    favorites: ['m-helene'],
    comments: [],
  },
  {
    id: 'p-anniv',
    familyId: fam,
    authorId: 'm-helene',
    type: 'event',
    room: 'organisation',
    text: 'Anniversaire de Jeanne',
    eventDate: now + 6 * D,
    eventLocation: 'Maison · 19h00',
    tilt: 0,
    createdAt: now - 1 * D,
    favorites: ['m-sofia', 'm-hugo', 'm-marc'],
    comments: [
      { id: 'c2', authorId: 'm-hugo', text: "Je m'occupe du gâteau.", createdAt: now - 20 * H },
    ],
  },
  {
    id: 'p-tom-record',
    familyId: fam,
    authorId: 'm-lea',
    type: 'text',
    room: 'enfants',
    text: 'Quelqu\'un récupère Tom à 16h30 ? J\'ai entraînement.',
    tilt: 0,
    createdAt: now - 3 * H,
    favorites: [],
    comments: [],
  },
  {
    id: 'p-rando',
    familyId: fam,
    authorId: 'm-jeanne',
    type: 'photo',
    room: 'vacances',
    text: 'La rando des crêtes, comme chaque été.',
    caption: 'vercors · crêtes du moucherotte',
    tilt: -3,
    createdAt: now - 2 * D,
    favorites: ['m-helene', 'm-marc', 'm-sofia'],
    comments: [],
  },
];

export const SEED_INVITATIONS: Invitation[] = [
  { id: 'i-1', familyId: fam, code: 'LACROIX-2026', role: 'adult', label: 'Adulte (proche)', createdBy: 'm-helene', createdAt: now - 4 * D, status: 'pending' },
  { id: 'i-2', familyId: fam, code: 'ADO-7788', role: 'minor', label: 'Compte mineur', createdBy: 'm-helene', createdAt: now - 2 * D, status: 'pending' },
];
