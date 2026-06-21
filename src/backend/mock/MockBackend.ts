import { haversine, statusFromDistance, zoneFor } from '../../lib/geo';
import type {
  Backend,
  CreatePostInput,
  Family,
  Invitation,
  LiveMember,
  Location,
  Member,
  NewProfile,
  Post,
  Role,
  Session,
  SharingMode,
} from '../types';
import {
  FAMILY,
  HOME,
  SEED_INVITATIONS,
  SEED_MEMBERS,
  SEED_POSTS,
  SEED_SIM,
  type SimProfile,
} from './data';

const STORE_KEY = 'famille:mock:v3';
const TICK_MS = 2500;

interface PersistShape {
  sessionMemberId: string | null;
  family: Family;
  members: Member[];
  posts: Post[];
  invitations: Invitation[];
}

/** Décale un point de (dNorth, dEast) mètres. */
function offset(lat: number, lng: number, dNorth: number, dEast: number) {
  const dLat = dNorth / 111_320;
  const dLng = dEast / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
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

  private sim: Record<string, SimProfile> = {};
  private locations: Record<string, Location> = {};

  private liveSubs = new Set<(m: LiveMember[]) => void>();
  private feedSubs = new Set<(p: Post[]) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const loaded = this.load();
    this.family = loaded?.family ?? structuredClone(FAMILY);
    this.members = loaded?.members ?? structuredClone(SEED_MEMBERS);
    this.posts = loaded?.posts ?? structuredClone(SEED_POSTS);
    this.invitations = loaded?.invitations ?? structuredClone(SEED_INVITATIONS);
    this.sessionMemberId = loaded?.sessionMemberId ?? null;

    // Profils de simulation : seed + défaut « maison » pour les membres ajoutés.
    this.sim = structuredClone(SEED_SIM);
    for (const m of this.members) {
      if (!this.sim[m.id]) this.sim[m.id] = { mode: 'home', anchor: HOME, battery: 0.8 };
    }
    this.seedInitialPositions();
    this.start();
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

  /* ── Moteur de simulation temps réel ─────────────────────── */
  private seedInitialPositions() {
    for (const m of this.members) {
      const s = this.sim[m.id];
      if (!s || s.mode === 'off') continue;
      if (s.mode === 'commute' && s.from && s.to) {
        const t = s.phase ?? 0.5;
        this.locations[m.id] = {
          memberId: m.id,
          lat: lerp(s.from.lat, s.to.lat, t),
          lng: lerp(s.from.lng, s.to.lng, t),
          updatedAt: Date.now(),
          battery: s.battery,
          speed: s.speedKmh,
        };
      } else if (s.anchor) {
        const p = offset(s.anchor.lat, s.anchor.lng, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
        this.locations[m.id] = { memberId: m.id, ...p, updatedAt: Date.now(), battery: s.battery, speed: 0 };
      }
    }
  }

  private start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.liveSubs.clear();
    this.feedSubs.clear();
  }

  private tick() {
    const dt = TICK_MS / 1000;
    for (const m of this.members) {
      const s = this.sim[m.id];
      if (!s || s.mode === 'off') continue;
      s.battery = Math.max(0.05, s.battery - 0.0006);

      if (s.mode === 'commute' && s.from && s.to) {
        const pathLen = Math.max(1, haversine(s.from.lat, s.from.lng, s.to.lat, s.to.lng));
        const step = ((s.speedKmh ?? 4) * 1000 * dt) / 3600 / pathLen;
        let phase = (s.phase ?? 0) + step * (s.dir ?? 1);
        if (phase >= 1) {
          phase = 1;
          s.dir = -1;
        } else if (phase <= 0) {
          phase = 0;
          s.dir = 1;
        }
        s.phase = phase;
        this.locations[m.id] = {
          memberId: m.id,
          lat: lerp(s.from.lat, s.to.lat, phase),
          lng: lerp(s.from.lng, s.to.lng, phase),
          updatedAt: Date.now(),
          battery: s.battery,
          speed: phase > 0 && phase < 1 ? s.speedKmh : 0,
        };
      } else if (s.anchor) {
        const prev = this.locations[m.id] ?? { lat: s.anchor.lat, lng: s.anchor.lng };
        // marche aléatoire douce, rappel vers l'ancre
        const jitter = offset(prev.lat, prev.lng, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        const pull = 0.15;
        this.locations[m.id] = {
          memberId: m.id,
          lat: lerp(jitter.lat, s.anchor.lat, pull),
          lng: lerp(jitter.lng, s.anchor.lng, pull),
          updatedAt: Date.now(),
          battery: s.battery,
          speed: Math.round(Math.random() * 2),
        };
      }
    }
    this.emitLive();
  }

  private computeLive(m: Member): LiveMember {
    const loc = m.sharing === 'off' ? undefined : this.locations[m.id];
    const home = this.family.geofences.find((g) => g.kind === 'home');
    if (!loc || !home) {
      return { ...m, status: 'unknown', distanceMeters: Infinity };
    }
    const distance = haversine(loc.lat, loc.lng, home.lat, home.lng);
    const zone = zoneFor(loc, this.family.geofences);
    const status = zone?.kind === 'home' ? 'home' : statusFromDistance(distance, home.radius);

    let etaMinutes: number | undefined;
    const s = this.sim[m.id];
    if (s?.mode === 'commute' && s.dir === 1 && s.from && s.to && status !== 'home') {
      const pathLen = haversine(s.from.lat, s.from.lng, s.to.lat, s.to.lng);
      const remaining = (1 - (s.phase ?? 0)) * pathLen; // mètres jusqu'à la maison
      const mPerMin = ((s.speedKmh ?? 4) * 1000) / 60;
      if (mPerMin > 0) etaMinutes = remaining / mPerMin;
    }

    return { ...m, location: loc, status, zone, distanceMeters: distance, etaMinutes };
  }

  private liveSnapshot(): LiveMember[] {
    return this.members.map((m) => this.computeLive(m));
  }

  private emitLive() {
    const snap = this.liveSnapshot();
    this.liveSubs.forEach((cb) => cb(snap));
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
      sharing: role === 'minor' ? 'auto' : 'optin',
    };
    this.members.push(member);
    this.sim[member.id] = { mode: 'home', anchor: HOME, battery: 0.9 };
    this.seedInitialPositions();
    invite.status = 'accepted';
    this.sessionMemberId = member.id;
    this.save();
    this.emitLive();
    return { member, family: this.family };
  }

  async createFamily({ familyName, profile }: { familyName: string; profile: NewProfile }): Promise<Session> {
    const name = profile.name.trim();
    if (!name) throw new Error('Le prénom est requis.');
    const familyId = rid('fam');
    this.family = { id: familyId, name: familyName.trim() || 'Ma famille', geofences: [] };
    const member: Member = {
      id: rid('m'),
      familyId,
      name,
      role: 'admin',
      relation: profile.relation?.trim() || undefined,
      birthDate: profile.birthDate,
      color: '#C4623F',
      initials: name.slice(0, 2),
      sharing: 'optin',
    };
    this.members = [member];
    this.posts = [];
    this.invitations = [];
    this.sim = {};
    this.locations = {};
    this.sessionMemberId = member.id;
    this.save();
    this.emitLive();
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

  /* ── Localisation temps réel ─────────────────────────────── */
  subscribeLive(cb: (members: LiveMember[]) => void): () => void {
    this.liveSubs.add(cb);
    cb(this.liveSnapshot());
    return () => this.liveSubs.delete(cb);
  }

  async setSharing(memberId: string, mode: SharingMode): Promise<void> {
    const m = this.members.find((x) => x.id === memberId);
    if (!m) throw new Error('Membre introuvable.');
    if (m.role === 'minor' && mode !== 'auto') {
      throw new Error('Le partage de localisation est obligatoire pour un compte mineur.');
    }
    m.sharing = mode;
    this.save();
    this.emitLive();
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
}
