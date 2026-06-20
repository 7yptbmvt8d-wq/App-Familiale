/**
 * Amorce la Firebase Emulator Suite avec une famille de démonstration.
 * Conçu pour tourner DANS `firebase emulators:exec` (les variables
 * FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST sont alors injectées,
 * et firebase-admin s'y connecte automatiquement).
 *
 *   firebase emulators:exec --project demo-famille "node scripts/seed-emulator.mjs"
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT = 'demo-famille';
const FAMILY = 'fam-lacroix';
const HOME = { lat: 45.764, lng: 4.8357 };
const SCHOOL = { lat: 45.7702, lng: 4.829 };
const WORK = { lat: 45.744, lng: 4.87 };
const now = Date.now();
const H = 3_600_000;
const D = 86_400_000;

const geofences = [
  { id: 'gf-home', label: 'Maison', kind: 'home', lat: HOME.lat, lng: HOME.lng, radius: 120 },
  { id: 'gf-school', label: 'École', kind: 'school', lat: SCHOOL.lat, lng: SCHOOL.lng, radius: 150 },
  { id: 'gf-work', label: 'Travail', kind: 'work', lat: WORK.lat, lng: WORK.lng, radius: 180 },
];

const members = [
  { id: 'm-helene', name: 'Hélène', role: 'admin', relation: 'Mère', birthDate: '1984-03-12', color: '#C4623F', initials: 'Hé', sharing: 'optin' },
  { id: 'm-marc', name: 'Marc', role: 'admin', relation: 'Père', birthDate: '1982-09-02', color: '#A24C32', initials: 'Ma', sharing: 'optin' },
  { id: 'm-lea', name: 'Léa', role: 'minor', relation: 'Fille · 14 ans', birthDate: '2012-05-21', color: '#C99A4E', initials: 'Lé', sharing: 'auto' },
  { id: 'm-tom', name: 'Tom', role: 'minor', relation: 'Fils · 11 ans', birthDate: '2015-01-08', color: '#7E8A6A', initials: 'To', sharing: 'auto' },
  { id: 'm-jeanne', name: 'Jeanne', role: 'adult', relation: 'Grand-mère', birthDate: '1955-11-30', color: '#B98A57', initials: 'Je', sharing: 'optin' },
  { id: 'm-robert', name: 'Robert', role: 'adult', relation: 'Grand-père', birthDate: '1953-06-17', color: '#8A6A4F', initials: 'Ro', sharing: 'off' },
  { id: 'm-sofia', name: 'Sofia', role: 'adult', relation: 'Cousine', birthDate: '1996-02-14', color: '#C4623F', initials: 'So', sharing: 'optin' },
  { id: 'm-hugo', name: 'Hugo', role: 'adult', relation: 'Oncle', birthDate: '1989-07-25', color: '#A24C32', initials: 'Hu', sharing: 'temporary' },
];

const loc = (id, lat, lng, battery, speed) => ({ memberId: id, lat, lng, updatedAt: now, battery, speed });
const locations = [
  loc('m-helene', HOME.lat, HOME.lng, 0.82, 0),
  loc('m-marc', WORK.lat, WORK.lng, 0.54, 0),
  loc('m-lea', SCHOOL.lat, SCHOOL.lng, 0.39, 0),
  loc('m-tom', SCHOOL.lat, SCHOOL.lng, 0.71, 0),
  loc('m-jeanne', HOME.lat, HOME.lng, 0.93, 0),
  loc('m-sofia', 45.7655, 4.838, 0.66, 5),
  loc('m-hugo', 45.752, 4.857, 0.48, 38),
  // m-robert : partage désactivé → aucune position.
];

const posts = [
  { id: 'p-souvenir', authorId: 'm-helene', type: 'memory', room: 'general', text: "Première fois de Tom devant la mer.", caption: "étretat · falaise d'aval", tilt: -2.5, yearsAgo: 3, createdAt: now - 2 * H, favorites: ['m-marc', 'm-jeanne'], comments: [{ id: 'c1', authorId: 'm-jeanne', text: 'Quel souvenir…', createdAt: now - 1.5 * H }] },
  { id: 'p-tomates', authorId: 'm-marc', type: 'photo', room: 'general', text: 'Les tomates de Robert ont mûri.', caption: 'jardin · récolte de juin', tilt: 3.5, createdAt: now - 5 * H, favorites: ['m-helene'], comments: [] },
  { id: 'p-anniv', authorId: 'm-helene', type: 'event', room: 'organisation', text: 'Anniversaire de Jeanne', eventDate: now + 6 * D, eventLocation: 'Maison · 19h00', tilt: 0, createdAt: now - D, favorites: ['m-sofia', 'm-marc'], comments: [] },
  { id: 'p-rando', authorId: 'm-jeanne', type: 'photo', room: 'vacances', text: 'La rando des crêtes.', caption: 'vercors · crêtes du moucherotte', tilt: -3, createdAt: now - 2 * D, favorites: ['m-helene', 'm-marc'], comments: [] },
];

const inviteCodes = [
  { code: 'LACROIX-2026', role: 'adult', label: 'Adulte (proche)' },
  { code: 'ADO-7788', role: 'minor', label: 'Compte mineur' },
];

export async function seed() {
  if (!getApps().length) initializeApp({ projectId: PROJECT });
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  const batch = db.batch();
  batch.set(db.doc(`families/${FAMILY}`), { id: FAMILY, name: 'Famille Lacroix', geofences });
  for (const m of members) batch.set(db.doc(`families/${FAMILY}/members/${m.id}`), { ...m, familyId: FAMILY });
  for (const l of locations) batch.set(db.doc(`families/${FAMILY}/locations/${l.memberId}`), l);
  for (const p of posts) batch.set(db.doc(`families/${FAMILY}/posts/${p.id}`), { ...p, familyId: FAMILY });
  for (const c of inviteCodes)
    batch.set(db.doc(`inviteCodes/${c.code}`), {
      id: c.code,
      familyId: FAMILY,
      code: c.code,
      role: c.role,
      label: c.label,
      createdBy: 'm-helene',
      createdAt: now - 2 * D,
      status: 'pending',
    });
  await batch.commit();

  console.log(`Seed OK : ${members.length} membres, ${locations.length} positions, ${posts.length} posts, ${inviteCodes.length} codes.`);
}

// Exécution directe
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Seed échec :', e);
      process.exit(1);
    });
}
