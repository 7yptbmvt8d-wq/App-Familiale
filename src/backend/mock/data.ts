import type { Family, Invitation, Member, Post } from '../types';

export const FAMILY: Family = {
  id: 'fam-lacroix',
  name: 'Famille Lacroix',
};

const fam = FAMILY.id;

export const SEED_MEMBERS: Member[] = [
  { id: 'm-helene', familyId: fam, name: 'Hélène', role: 'admin', relation: 'Mère', birthDate: '1984-03-12', color: '#C4623F', initials: 'Hé' },
  { id: 'm-marc', familyId: fam, name: 'Marc', role: 'admin', relation: 'Père', birthDate: '1982-09-02', color: '#A24C32', initials: 'Ma' },
  { id: 'm-lea', familyId: fam, name: 'Léa', role: 'minor', relation: 'Fille · 14 ans', birthDate: '2012-05-21', color: '#C99A4E', initials: 'Lé' },
  { id: 'm-tom', familyId: fam, name: 'Tom', role: 'minor', relation: 'Fils · 11 ans', birthDate: '2015-01-08', color: '#7E8A6A', initials: 'To' },
  { id: 'm-jeanne', familyId: fam, name: 'Jeanne', role: 'adult', relation: 'Grand-mère', birthDate: '1955-11-30', color: '#B98A57', initials: 'Je' },
  { id: 'm-robert', familyId: fam, name: 'Robert', role: 'adult', relation: 'Grand-père', birthDate: '1953-06-17', color: '#8A6A4F', initials: 'Ro' },
  { id: 'm-sofia', familyId: fam, name: 'Sofia', role: 'adult', relation: 'Cousine', birthDate: '1996-02-14', color: '#C4623F', initials: 'So' },
  { id: 'm-hugo', familyId: fam, name: 'Hugo', role: 'adult', relation: 'Oncle', birthDate: '1989-07-25', color: '#A24C32', initials: 'Hu' },
];

const now = Date.now();
const H = 3_600_000;
const D = 86_400_000;
const thisYear = new Date().getFullYear();

export const SEED_POSTS: Post[] = [
  {
    id: 'p-souvenir',
    familyId: fam,
    authorId: 'm-helene',
    type: 'memory',
    text: "Première fois de Tom devant la mer. Il a refusé de quitter le sable jusqu'à la nuit.",
    caption: "étretat · falaise d'aval",
    tilt: -2.5,
    createdAt: now - 2 * H,
    memoryDate: new Date(thisYear - 3, 7, 12).getTime(),
    favorites: ['m-marc', 'm-jeanne'],
    comments: [{ id: 'c1', authorId: 'm-jeanne', text: 'Quel souvenir… il était si petit.', createdAt: now - 1.5 * H }],
  },
  {
    id: 'p-tomates',
    familyId: fam,
    authorId: 'm-marc',
    type: 'photo',
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
    text: 'Anniversaire de Jeanne',
    eventDate: now + 6 * D,
    eventLocation: 'Maison · 19h00',
    tilt: 0,
    createdAt: now - 1 * D,
    favorites: ['m-sofia', 'm-hugo', 'm-marc'],
    comments: [{ id: 'c2', authorId: 'm-hugo', text: "Je m'occupe du gâteau.", createdAt: now - 20 * H }],
  },
  {
    id: 'p-recit',
    familyId: fam,
    authorId: 'm-jeanne',
    type: 'text',
    text: "Votre grand-père a construit la cabane du fond du jardin l'été 1979, avec trois planches et beaucoup d'entêtement. Elle tient toujours.",
    tilt: 0,
    createdAt: now - 1 * D,
    memoryDate: new Date('1979-07-15').getTime(),
    favorites: ['m-helene', 'm-marc', 'm-hugo'],
    comments: [],
  },
  {
    id: 'p-rando',
    familyId: fam,
    authorId: 'm-jeanne',
    type: 'photo',
    text: 'La rando des crêtes, comme chaque été.',
    caption: 'vercors · crêtes du moucherotte',
    tilt: -3,
    createdAt: now - 2 * D,
    memoryDate: new Date(thisYear - 1, 6, 20).getTime(),
    favorites: ['m-helene', 'm-marc', 'm-sofia'],
    comments: [],
  },
];

export const SEED_INVITATIONS: Invitation[] = [
  { id: 'i-1', familyId: fam, code: 'LACROIX-2026', role: 'adult', label: 'Adulte (proche)', createdBy: 'm-helene', createdAt: now - 4 * D, status: 'pending' },
  { id: 'i-2', familyId: fam, code: 'ADO-7788', role: 'minor', label: 'Compte mineur', createdBy: 'm-helene', createdAt: now - 2 * D, status: 'pending' },
];
