import type {
  Backend,
  CreatePostInput,
  Family,
  Invitation,
  Member,
  NewProfile,
  Post,
  Role,
  Session,
} from '../types';
import { FAMILY, SEED_INVITATIONS, SEED_MEMBERS, SEED_POSTS } from './data';

const STORE_KEY = 'famille:mock:v4';

interface PersistShape {
  sessionMemberId: string | null;
  family: Family;
  members: Member[];
  posts: Post[];
  invitations: Invitation[];
}

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export class MockBackend implements Backend {
  private family: Family;
  private members: Member[];
  private posts: Post[];
  private invitations: Invitation[];
  private sessionMemberId: string | null;

  private feedSubs = new Set<(p: Post[]) => void>();

  constructor() {
    const loaded = this.load();
    this.family = loaded?.family ?? structuredClone(FAMILY);
    this.members = loaded?.members ?? structuredClone(SEED_MEMBERS);
    this.posts = loaded?.posts ?? structuredClone(SEED_POSTS);
    this.invitations = loaded?.invitations ?? structuredClone(SEED_INVITATIONS);
    this.sessionMemberId = loaded?.sessionMemberId ?? null;
  }

  /* ── Persistance ─────────────────────────────────────────── */
  private load(): PersistShape | null {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? (JSON.parse(raw) as PersistShape) : null;
    } catch {
      return null;
    }
  }

  private save() {
    const data: PersistShape = {
      sessionMemberId: this.sessionMemberId,
      family: this.family,
      members: this.members,
      posts: this.posts,
      invitations: this.invitations,
    };
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch {
      /* quota / mode privé : on ignore */
    }
  }

  dispose() {
    this.feedSubs.clear();
  }

  private feedSnapshot(): Post[] {
    return [...this.posts].sort((a, b) => b.createdAt - a.createdAt);
  }

  private emitFeed() {
    const snap = this.feedSnapshot();
    this.feedSubs.forEach((cb) => cb(snap));
  }

  private requireMember(): Member {
    const m = this.members.find((x) => x.id === this.sessionMemberId);
    if (!m) throw new Error('Aucune session active.');
    return m;
  }

  /* ── Auth / onboarding ───────────────────────────────────── */
  async getSession(): Promise<Session | null> {
    const m = this.members.find((x) => x.id === this.sessionMemberId);
    return m ? { member: m, family: this.family } : null;
  }

  async joinWithCode(code: string, profile: NewProfile): Promise<Session> {
    const invite = this.invitations.find(
      (i) => i.code.toUpperCase() === code.trim().toUpperCase() && i.status === 'pending',
    );
    if (!invite) throw new Error('Code d’invitation invalide ou déjà utilisé.');

    const name = profile.name.trim();
    if (!name) throw new Error('Le prénom est requis.');

    const role: Role = invite.role;
    const member: Member = {
      id: rid('m'),
      familyId: this.family.id,
      name,
      role,
      relation: profile.relation?.trim() || undefined,
      birthDate: profile.birthDate,
      color: '#B98A57',
      initials: name.slice(0, 2),
    };
    this.members.push(member);
    invite.status = 'accepted';
    this.sessionMemberId = member.id;
    this.save();
    return { member, family: this.family };
  }

  async createFamily({ familyName, profile }: { familyName: string; profile: NewProfile }): Promise<Session> {
    const name = profile.name.trim();
    if (!name) throw new Error('Le prénom est requis.');
    const familyId = rid('fam');
    this.family = { id: familyId, name: familyName.trim() || 'Ma famille' };
    const member: Member = {
      id: rid('m'),
      familyId,
      name,
      role: 'admin',
      relation: profile.relation?.trim() || undefined,
      birthDate: profile.birthDate,
      color: '#C4623F',
      initials: name.slice(0, 2),
    };
    this.members = [member];
    this.posts = [];
    this.invitations = [];
    this.sessionMemberId = member.id;
    this.save();
    this.emitFeed();
    return { member, family: this.family };
  }

  async demoSignIn(memberId: string): Promise<Session> {
    const m = this.members.find((x) => x.id === memberId);
    if (!m) throw new Error('Membre introuvable.');
    this.sessionMemberId = m.id;
    this.save();
    return { member: m, family: this.family };
  }

  async signOut(): Promise<void> {
    this.sessionMemberId = null;
    this.save();
  }

  /* ── Famille ─────────────────────────────────────────────── */
  async getFamily(): Promise<Family> {
    return this.family;
  }

  async listMembers(): Promise<Member[]> {
    return [...this.members];
  }

  async updateMember(memberId: string, patch: { name?: string; relation?: string; birthDate?: string }): Promise<void> {
    const m = this.members.find((x) => x.id === memberId);
    if (!m) throw new Error('Membre introuvable.');
    if (patch.name !== undefined && patch.name.trim()) {
      m.name = patch.name.trim();
      m.initials = m.name.slice(0, 2);
    }
    if (patch.relation !== undefined) m.relation = patch.relation.trim() || undefined;
    if (patch.birthDate !== undefined) m.birthDate = patch.birthDate || undefined;
    this.save();
  }

  /* ── Invitations ─────────────────────────────────────────── */
  async listInvitations(): Promise<Invitation[]> {
    return [...this.invitations].sort((a, b) => b.createdAt - a.createdAt);
  }

  async createInvitation(input: { role: Role; label?: string }): Promise<Invitation> {
    const me = this.requireMember();
    if (me.role !== 'admin') throw new Error('Seuls les administrateurs peuvent inviter.');
    const inv: Invitation = {
      id: rid('i'),
      familyId: this.family.id,
      code: `${this.family.name.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'FAM'}-${Math.floor(1000 + Math.random() * 9000)}`,
      role: input.role,
      label: input.label,
      createdBy: me.id,
      createdAt: Date.now(),
      status: 'pending',
    };
    this.invitations.push(inv);
    this.save();
    return inv;
  }

  async revokeInvitation(id: string): Promise<void> {
    this.invitations = this.invitations.filter((i) => i.id !== id || i.status === 'accepted');
    this.save();
  }

  /* ── Fil de souvenirs & événements ───────────────────────── */
  subscribeFeed(cb: (posts: Post[]) => void): () => void {
    this.feedSubs.add(cb);
    cb(this.feedSnapshot());
    return () => this.feedSubs.delete(cb);
  }

  async createPost(input: CreatePostInput): Promise<void> {
    const me = this.requireMember();
    const post: Post = {
      id: rid('p'),
      familyId: this.family.id,
      authorId: me.id,
      type: input.type,
      text: input.text,
      caption: input.caption,
      imageUrl: input.imageUrl,
      tilt: input.type === 'photo' || input.type === 'memory' ? Math.random() * 7 - 3.5 : 0,
      createdAt: Date.now(),
      memoryDate: input.memoryDate,
      favorites: [],
      comments: [],
      eventDate: input.eventDate,
      eventLocation: input.eventLocation,
    };
    this.posts.push(post);
    this.save();
    this.emitFeed();
  }

  async toggleFavorite(postId: string): Promise<void> {
    const me = this.requireMember();
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;
    post.favorites = post.favorites.includes(me.id)
      ? post.favorites.filter((id) => id !== me.id)
      : [...post.favorites, me.id];
    this.save();
    this.emitFeed();
  }

  async addComment(postId: string, text: string): Promise<void> {
    const me = this.requireMember();
    const post = this.posts.find((p) => p.id === postId);
    if (!post || !text.trim()) return;
    post.comments.push({ id: rid('c'), authorId: me.id, text: text.trim(), createdAt: Date.now() });
    this.save();
    this.emitFeed();
  }

  async deletePost(postId: string): Promise<void> {
    const me = this.requireMember();
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;
    if (post.authorId !== me.id && me.role !== 'admin') {
      throw new Error('Seuls l’auteur ou un responsable peuvent supprimer.');
    }
    this.posts = this.posts.filter((p) => p.id !== postId);
    this.save();
    this.emitFeed();
  }
}
