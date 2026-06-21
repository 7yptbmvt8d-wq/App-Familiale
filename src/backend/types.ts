/* ───────────────────────────────────────────────────────────
   Types du domaine + contrat Backend.
   MVP « Mémoire familiale » : fil de souvenirs, pas de géolocalisation.
   Une seule interface, deux implémentations : mock & firebase.
   ─────────────────────────────────────────────────────────── */

export type Role = 'admin' | 'member';

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

export type PostType = 'photo' | 'text' | 'memory';

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

  /* Fil de souvenirs */
  subscribeFeed(cb: (posts: Post[]) => void): () => void;
  createPost(input: CreatePostInput): Promise<void>;
  toggleFavorite(postId: string): Promise<void>;
  addComment(postId: string, text: string): Promise<void>;

  /** Libère les ressources (écouteurs). */
  dispose(): void;
}
