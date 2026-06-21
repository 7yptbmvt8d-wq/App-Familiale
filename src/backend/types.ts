/* ───────────────────────────────────────────────────────────
   Types du domaine + contrat Backend.
   Mémoire familiale : fil de souvenirs, événements & anniversaires.
   Une seule interface, deux implémentations : mock & firebase.
   ─────────────────────────────────────────────────────────── */

export type Role = 'admin' | 'adult' | 'minor';

export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: Role;
  relation?: string; // « Mère », « Grand-père », « Fille »…
  birthDate?: string; // ISO yyyy-mm-dd
  color: string; // couleur d'avatar (fallback sans photo)
  initials: string;
}

export type PostType = 'photo' | 'text' | 'event' | 'memory';

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
  text?: string;
  caption?: string; // légende monospace du placeholder photo
  imageUrl?: string; // photo réelle (Storage) ou data URL (mock)
  tilt?: number; // inclinaison du polaroïd (deg)
  createdAt: number; // date de publication
  memoryDate?: number; // date du souvenir (« quand c'était »), si différente
  favorites: string[]; // memberIds
  comments: Comment[];
  // spécifique « event »
  eventDate?: number;
  eventLocation?: string; // lieu de l'événement (texte libre, ex. « Maison · 19h00 »)
}

export interface Invitation {
  id: string;
  familyId: string;
  code: string;
  role: Role;
  label?: string;
  createdBy: string;
  createdAt: number;
  status: 'pending' | 'accepted';
}

export interface Family {
  id: string;
  name: string;
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
  text?: string;
  caption?: string;
  imageUrl?: string;
  memoryDate?: number;
  eventDate?: number;
  eventLocation?: string;
}

/** Contrat unique partagé par le mock et Firebase. */
export interface Backend {
  /* Auth / onboarding (sur invitation uniquement) */
  getSession(): Promise<Session | null>;
  joinWithCode(code: string, profile: NewProfile): Promise<Session>;
  /** Crée une nouvelle famille ; l'auteur en devient responsable. */
  createFamily(input: { familyName: string; profile: NewProfile }): Promise<Session>;
  /** Raccourci démo : ouvrir une session en tant que membre existant (mock only). */
  demoSignIn(memberId: string): Promise<Session>;
  signOut(): Promise<void>;

  /* Famille */
  getFamily(): Promise<Family>;
  listMembers(): Promise<Member[]>;
  /** Modifie le profil d'un membre (soi-même, ou n'importe qui si responsable). */
  updateMember(memberId: string, patch: { name?: string; relation?: string; birthDate?: string }): Promise<void>;

  /* Invitations (admin) */
  listInvitations(): Promise<Invitation[]>;
  createInvitation(input: { role: Role; label?: string }): Promise<Invitation>;
  revokeInvitation(id: string): Promise<void>;

  /* Fil de souvenirs & événements */
  subscribeFeed(cb: (posts: Post[]) => void): () => void;
  createPost(input: CreatePostInput): Promise<void>;
  toggleFavorite(postId: string): Promise<void>;
  addComment(postId: string, text: string): Promise<void>;
  /** Supprime un post (son auteur ou un responsable). */
  deletePost(postId: string): Promise<void>;

  /** Libère les ressources (timers, écouteurs). */
  dispose(): void;
}
