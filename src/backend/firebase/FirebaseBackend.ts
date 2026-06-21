import {
  onAuthStateChanged,
  signInAnonymously,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadString } from 'firebase/storage';

import { haversine, statusFromDistance, zoneFor } from '../../lib/geo';
import type {
  Backend,
  CreatePostInput,
  Family,
  Geofence,
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
import { auth, db, storage } from './app';

/**
 * Implémentation Firebase (cible « produits Google »).
 *
 * Modèle Firestore :
 *   users/{uid}                    → { familyId, memberId }
 *   families/{fid}                 → { name, geofences[] }
 *   families/{fid}/members/{uid}   → Member
 *   families/{fid}/locations/{uid} → Location (mise à jour par l'app mobile)
 *   families/{fid}/posts/{pid}     → Post (souvenirs & événements)
 *   inviteCodes/{CODE}             → Invitation (racine ; id = code)
 *
 * Auth : connexion anonyme liée à un membre via le code d'invitation.
 * Les règles (firestore.rules) imposent l'invitation et le partage obligatoire
 * pour les mineurs.
 */
export class FirebaseBackend implements Backend {
  private ctx: { familyId: string; memberId: string } | null = null;
  private geofences: Geofence[] = [];

  private currentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth(), (u) => {
        unsub();
        resolve(u);
      });
    });
  }

  private async resolveCtx(): Promise<{ familyId: string; memberId: string }> {
    if (this.ctx) return this.ctx;
    const user = await this.currentUser();
    if (!user) throw new Error('Aucune session active.');
    const idx = await getDoc(doc(db(), 'users', user.uid));
    if (!idx.exists()) throw new Error('Compte non rattaché à une famille.');
    const data = idx.data() as { familyId: string; memberId: string };
    this.ctx = data;
    return data;
  }

  private async loadFamily(familyId: string): Promise<Family> {
    const snap = await getDoc(doc(db(), 'families', familyId));
    if (!snap.exists()) throw new Error('Famille introuvable.');
    const fam = { id: snap.id, ...(snap.data() as Omit<Family, 'id'>) };
    this.geofences = fam.geofences ?? [];
    return fam;
  }

  private computeLive(m: Member, locs: Record<string, Location>): LiveMember {
    const loc = m.sharing === 'off' ? undefined : locs[m.id];
    const home = this.geofences.find((g) => g.kind === 'home');
    if (!loc || !home) return { ...m, status: 'unknown', distanceMeters: Infinity };
    const distance = haversine(loc.lat, loc.lng, home.lat, home.lng);
    const zone = zoneFor(loc, this.geofences);
    const status = zone?.kind === 'home' ? 'home' : statusFromDistance(distance, home.radius);
    let etaMinutes: number | undefined;
    if (loc.speed && loc.speed > 1 && status !== 'home') {
      etaMinutes = distance / ((loc.speed * 1000) / 60);
    }
    return { ...m, location: loc, status, zone, distanceMeters: distance, etaMinutes };
  }

  /* ── Auth / onboarding ───────────────────────────────────── */
  async getSession(): Promise<Session | null> {
    const user = await this.currentUser();
    if (!user) return null;
    const idx = await getDoc(doc(db(), 'users', user.uid));
    if (!idx.exists()) return null;
    const { familyId, memberId } = idx.data() as { familyId: string; memberId: string };
    this.ctx = { familyId, memberId };
    const [mSnap, family] = await Promise.all([
      getDoc(doc(db(), 'families', familyId, 'members', memberId)),
      this.loadFamily(familyId),
    ]);
    if (!mSnap.exists()) return null;
    return { member: { id: mSnap.id, ...(mSnap.data() as Omit<Member, 'id'>) }, family };
  }

  async joinWithCode(code: string, profile: NewProfile): Promise<Session> {
    const cred = await signInAnonymously(auth());
    const uid = cred.user.uid;
    const codeUp = code.trim().toUpperCase();

    // 1. Lire le code (autorisé à tout utilisateur authentifié).
    const inviteSnap = await getDoc(doc(db(), 'inviteCodes', codeUp));
    const invite = inviteSnap.data() as Invitation | undefined;
    if (!inviteSnap.exists() || !invite || invite.status !== 'pending') {
      throw new Error('Code d’invitation invalide ou déjà utilisé.');
    }
    const familyId = invite.familyId;
    const role: Role = invite.role;

    // 2. Créer l'index users/{uid} AVANT la fiche membre (les règles en dépendent).
    await setDoc(doc(db(), 'users', uid), { familyId, memberId: uid });

    // 3. Créer sa propre fiche membre.
    const member: Member = {
      id: uid,
      familyId,
      name: profile.name.trim(),
      role,
      relation: profile.relation?.trim() || undefined,
      birthDate: profile.birthDate,
      color: '#B98A57',
      initials: profile.name.trim().slice(0, 2),
      sharing: role === 'minor' ? 'auto' : 'optin',
    };
    await setDoc(doc(db(), 'families', familyId, 'members', uid), member);

    // 4. Marquer le code comme utilisé.
    await updateDoc(doc(db(), 'inviteCodes', codeUp), { status: 'accepted' });

    this.ctx = { familyId, memberId: uid };
    const family = await this.loadFamily(familyId);
    return { member, family };
  }

  async demoSignIn(): Promise<Session> {
    throw new Error('La connexion démo n’est disponible que sur le backend mock.');
  }

  async signOut(): Promise<void> {
    this.ctx = null;
    await fbSignOut(auth());
  }

  /* ── Famille ─────────────────────────────────────────────── */
  async getFamily(): Promise<Family> {
    const { familyId } = await this.resolveCtx();
    return this.loadFamily(familyId);
  }

  async listMembers(): Promise<Member[]> {
    const { familyId } = await this.resolveCtx();
    const snap = await getDocs(collection(db(), 'families', familyId, 'members'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }));
  }

  /* ── Invitations ─────────────────────────────────────────── */
  async listInvitations(): Promise<Invitation[]> {
    const { familyId } = await this.resolveCtx();
    const snap = await getDocs(query(collection(db(), 'inviteCodes'), where('familyId', '==', familyId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Invitation, 'id'>) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async createInvitation(input: { role: Role; label?: string }): Promise<Invitation> {
    const { familyId, memberId } = await this.resolveCtx();
    const code = `LACROIX-${Math.floor(1000 + Math.random() * 9000)}`;
    const inv: Invitation = {
      id: code,
      familyId,
      code,
      role: input.role,
      label: input.label,
      createdBy: memberId,
      createdAt: Date.now(),
      status: 'pending',
    };
    await setDoc(doc(db(), 'inviteCodes', code), inv);
    return inv;
  }

  async revokeInvitation(id: string): Promise<void> {
    await deleteDoc(doc(db(), 'inviteCodes', id));
  }

  /* ── Localisation temps réel ─────────────────────────────── */
  subscribeLive(cb: (members: LiveMember[]) => void): () => void {
    let unsubs: Array<() => void> = [];
    let cancelled = false;
    let members: Member[] = [];
    let locs: Record<string, Location> = {};
    const recompute = () => cb(members.map((m) => this.computeLive(m, locs)));

    this.resolveCtx()
      .then(async ({ familyId }) => {
        await this.loadFamily(familyId);
        if (cancelled) return;
        const u1 = onSnapshot(collection(db(), 'families', familyId, 'members'), (s) => {
          members = s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }));
          recompute();
        });
        const u2 = onSnapshot(collection(db(), 'families', familyId, 'locations'), (s) => {
          locs = {};
          s.docs.forEach((d) => (locs[d.id] = d.data() as Location));
          recompute();
        });
        unsubs = [u1, u2];
      })
      .catch((e) => console.error('[firebase] subscribeLive', e));

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }

  async setSharing(memberId: string, mode: SharingMode): Promise<void> {
    const { familyId } = await this.resolveCtx();
    const snap = await getDoc(doc(db(), 'families', familyId, 'members', memberId));
    const role = (snap.data() as Member | undefined)?.role;
    if (role === 'minor' && mode !== 'auto') {
      throw new Error('Le partage de localisation est obligatoire pour un compte mineur.');
    }
    await updateDoc(doc(db(), 'families', familyId, 'members', memberId), { sharing: mode });
  }

  /* ── Fil de souvenirs & événements ───────────────────────── */
  subscribeFeed(cb: (posts: Post[]) => void): () => void {
    let unsub = () => {};
    let cancelled = false;
    this.resolveCtx()
      .then(({ familyId }) => {
        if (cancelled) return;
        unsub = onSnapshot(
          query(collection(db(), 'families', familyId, 'posts'), orderBy('createdAt', 'desc')),
          (s) => cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, 'id'>) }))),
        );
      })
      .catch((e) => console.error('[firebase] subscribeFeed', e));
    return () => {
      cancelled = true;
      unsub();
    };
  }

  private async uploadIfDataUrl(familyId: string, value?: string): Promise<string | undefined> {
    if (!value || !value.startsWith('data:')) return value;
    const path = `families/${familyId}/posts/${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const r = storageRef(storage(), path);
    await uploadString(r, value, 'data_url');
    return getDownloadURL(r);
  }

  async createPost(input: CreatePostInput): Promise<void> {
    const { familyId, memberId } = await this.resolveCtx();
    const imageUrl = await this.uploadIfDataUrl(familyId, input.imageUrl);
    const post: Omit<Post, 'id'> = {
      familyId,
      authorId: memberId,
      type: input.type,
      text: input.text,
      caption: input.caption,
      imageUrl,
      tilt: input.type === 'photo' || input.type === 'memory' ? Math.random() * 7 - 3.5 : 0,
      createdAt: Date.now(),
      memoryDate: input.memoryDate,
      favorites: [],
      comments: [],
      eventDate: input.eventDate,
      eventLocation: input.eventLocation,
    };
    const ref = doc(collection(db(), 'families', familyId, 'posts'));
    await setDoc(ref, post);
  }

  async toggleFavorite(postId: string): Promise<void> {
    const { familyId, memberId } = await this.resolveCtx();
    const ref = doc(db(), 'families', familyId, 'posts', postId);
    const snap = await getDoc(ref);
    const favs = (snap.data() as Post | undefined)?.favorites ?? [];
    await updateDoc(ref, {
      favorites: favs.includes(memberId) ? arrayRemove(memberId) : arrayUnion(memberId),
    });
  }

  async addComment(postId: string, text: string): Promise<void> {
    const { familyId, memberId } = await this.resolveCtx();
    if (!text.trim()) return;
    await updateDoc(doc(db(), 'families', familyId, 'posts', postId), {
      comments: arrayUnion({
        id: `c-${Date.now()}`,
        authorId: memberId,
        text: text.trim(),
        createdAt: Date.now(),
      }),
    });
  }

  dispose() {
    this.ctx = null;
  }
}
