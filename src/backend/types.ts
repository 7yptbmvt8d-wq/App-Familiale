/* ───────────────────────────────────────────────────────────
   Types du domaine + contrat Backend.
   Une seule interface, deux implémentations : mock & firebase.
   ─────────────────────────────────────────────────────────── */

export type Role = 'admin' | 'adult' | 'minor';

/** Mode de partage de localisation.
 *  - auto      : permanent et NON désactivable (mineurs)
 *  - optin     : permanent, choisi par l'adulte
 *  - temporary : limité à une durée / un trajet
 *  - off       : aucun partage (interdit pour les mineurs)
 */
export type SharingMode = 'auto' | 'optin' | 'temporary' | 'off';

export type GeoStatus = 'home' | 'nearby' | 'away' | 'unknown';

export type GeofenceKind = 'home' | 'school' | 'work' | 'custom';

export interface Geofence {
  id: string;
  label: string; // « Maison », « École », « Travail »
  kind: GeofenceKind;
  lat: number;
  lng: number;
  radius: number; // mètres
}

export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: Role;
  relation?: string; // « Mère », « Grand-père », « Fille »…
  birthDate?: string; // ISO yyyy-mm-dd
  color: string; // couleur d'avatar (fallback sans photo)
  initials: string;
  sharing: SharingMode;
}

export interface Location {
  memberId: string;
  lat: number;
  lng: number;
  updatedAt: number; // epoch ms
  battery?: number; // 0..1
  speed?: number; // km/h
}

/** Membre enrichi des données temps réel (calculées côté lecture). */
export interface LiveMember extends Member {
  location?: Location;
  status: GeoStatus;
  zone?: Geofence; // zone courante si à l'intérieur d'un géorepère
  distanceMeters: number; // distance jusqu'à la maison
  etaMinutes?: number; // estimation d'arrivée si en rapprochement
}

export type PostType = 'photo' | 'text' | 'event' | 'memory';

export type Room = 'general' | 'parents' | 'enfants' | 'organisation' | 'vacances';

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface Post {
  id: string;
  familyId: string;
  authorId: string;
  type: PostType;
  room: Room;
  text?: string;
  caption?: string; // légende monospace du placeholder photo
  imageUrl?: string; // photo réelle (Storage) ou data URL (mock)
  tilt?: number; // inclinaison du polaroïd (deg)
  createdAt: number;
  favorites: string[]; // memberIds
  comments: Comment[];
  // spécifique « event »
  eventDate?: number;
  eventLocation?: string;
  // spécifique « memory »
  yearsAgo?: number;
}

export interface Invitation {
  id: string;
  familyId: string;
  code: string;
  role: Role;
  label?: string; // ex. « Pour Mamie »
  createdBy: string;
  createdAt: number;
  status: 'pending' | 'accepted';
}

export interface Family {
  id: string;
  name: string;
  geofences: Geofence[];
}

export interface Session {
  member: Member;
  family: Family;
}

export interface NewProfile {
  name: string;
  relation?: string;
  birthDate?: string;
}

export interface CreatePostInput {
  type: PostType;
  room?: Room;
  text?: string;
  caption?: string;
  imageUrl?: string;
  eventDate?: number;
  eventLocation?: string;
}

/** Contrat unique partagé par le mock et Firebase. */
export interface Backend {
  /* Auth / onboarding (sur invitation uniquement) */
  getSession(): Promise<Session | null>;
  joinWithCode(code: string, profile: NewProfile): Promise<Session>;
  /** Raccourci démo : ouvrir une session en tant que membre existant (mock only). */
  demoSignIn(memberId: string): Promise<Session>;
  signOut(): Promise<void>;

  /* Famille */
  getFamily(): Promise<Family>;
  listMembers(): Promise<Member[]>;

  /* Invitations (admin) */
  listInvitations(): Promise<Invitation[]>;
  createInvitation(input: { role: Role; label?: string }): Promise<Invitation>;
  revokeInvitation(id: string): Promise<void>;

  /* Localisation temps réel */
  subscribeLive(cb: (members: LiveMember[]) => void): () => void;
  setSharing(memberId: string, mode: SharingMode): Promise<void>;

  /* Fil familial */
  subscribeFeed(cb: (posts: Post[]) => void): () => void;
  createPost(input: CreatePostInput): Promise<void>;
  toggleFavorite(postId: string): Promise<void>;
  addComment(postId: string, text: string): Promise<void>;
}
