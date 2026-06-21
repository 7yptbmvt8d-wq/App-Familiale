/**
 * Amorce la Firebase Emulator Suite avec une famille de démonstration.
 * Conçu pour tourner DANS `firebase emulators:exec` (les variables
 * FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST sont alors injectées).
 *
 *   firebase emulators:exec --project demo-famille "node scripts/seed-emulator.mjs"
 */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT = 'demo-famille';
const FAMILY = 'fam-lacroix';
const now = Date.now();
const H = 3_600_000;
const D = 86_400_000;
const thisYear = new Date().getFullYear();

const members = [
  { id: 'm-helene', name: 'Hélène', role: 'admin', relation: 'Mère', birthDate: '1984-03-12', color: '#C4623F', initials: 'Hé' },
  { id: 'm-marc', name: 'Marc', role: 'admin', relation: 'Père', birthDate: '1982-09-02', color: '#A24C32', initials: 'Ma' },
  { id: 'm-lea', name: 'Léa', role: 'minor', relation: 'Fille · 14 ans', birthDate: '2012-05-21', color: '#C99A4E', initials: 'Lé' },
  { id: 'm-tom', name: 'Tom', role: 'minor', relation: 'Fils · 11 ans', birthDate: '2015-01-08', color: '#7E8A6A', initials: 'To' },
  { id: 'm-jeanne', name: 'Jeanne', role: 'adult', relation: 'Grand-mère', birthDate: '1955-11-30', color: '#B98A57', initials: 'Je' },
  { id: 'm-robert', name: 'Robert', role: 'adult', relation: 'Grand-père', birthDate: '1953-06-17', color: '#8A6A4F', initials: 'Ro' },
  { id: 'm-sofia', name: 'Sofia', role: 'adult', relation: 'Cousine', birthDate: '1996-02-14', color: '#C4623F', initials: 'So' },
  { id: 'm-hugo', name: 'Hugo', role: 'adult', relation: 'Oncle', birthDate: '1989-07-25', color: '#A24C32', initials: 'Hu' },
];

const posts = [
  { id: 'p-souvenir', authorId: 'm-helene', type: 'memory', text: 'Première fois de Tom devant la mer.', caption: "étretat · falaise d'aval", tilt: -2.5, createdAt: now - 2 * H, memoryDate: new Date(thisYear - 3, 7, 12).getTime(), favorites: ['m-marc', 'm-jeanne'], comments: [{ id: 'c1', authorId: 'm-jeanne', text: 'Quel souvenir…', createdAt: now - 1.5 * H }] },
  { id: 'p-tomates', authorId: 'm-marc', type: 'photo', text: 'Les tomates de Robert ont mûri.', caption: 'jardin · récolte de juin', tilt: 3.5, createdAt: now - 5 * H, favorites: ['m-helene'], comments: [] },
  { id: 'p-anniv', authorId: 'm-helene', type: 'event', text: 'Anniversaire de Jeanne', eventDate: now + 6 * D, eventLocation: 'Maison · 19h00', tilt: 0, createdAt: now - D, favorites: ['m-sofia', 'm-marc'], comments: [] },
  { id: 'p-rando', authorId: 'm-jeanne', type: 'photo', text: 'La rando des crêtes.', caption: 'vercors · crêtes du moucherotte', tilt: -3, createdAt: now - 2 * D, memoryDate: new Date(thisYear - 1, 6, 20).getTime(), favorites: ['m-helene', 'm-marc'], comments: [] },
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
  batch.set(db.doc(`families/${FAMILY}`), { id: FAMILY, name: 'Famille Lacroix' });
  for (const m of members) batch.set(db.doc(`families/${FAMILY}/members/${m.id}`), { ...m, familyId: FAMILY });
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

  console.log(`Seed OK : ${members.length} membres, ${posts.length} posts, ${inviteCodes.length} codes.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Seed échec :', e);
      process.exit(1);
    });
}
