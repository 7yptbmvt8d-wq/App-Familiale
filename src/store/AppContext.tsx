import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { BACKEND_KIND, createBackend } from '../backend';
import type {
  Backend,
  CreatePostInput,
  GeofenceKind,
  Invitation,
  LiveMember,
  Member,
  NewProfile,
  Post,
  Role,
  Session,
  SharingMode,
} from '../backend/types';

interface AppValue {
  ready: boolean;
  backendKind: 'mock' | 'firebase';
  session: Session | null;
  me: Member | null;
  live: LiveMember[];
  feed: Post[];
  members: Member[];
  memberById: (id: string) => Member | undefined;

  join: (code: string, profile: NewProfile) => Promise<void>;
  createFamily: (familyName: string, profile: NewProfile) => Promise<void>;
  demoSignIn: (memberId: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSharing: (mode: SharingMode) => Promise<void>;
  upsertGeofence: (input: { kind: GeofenceKind; label: string; lat: number; lng: number; radius?: number }) => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<void>;
  toggleFavorite: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  createInvitation: (input: { role: Role; label?: string }) => Promise<Invitation>;
  revokeInvitation: (id: string) => Promise<void>;
  listInvitations: () => Promise<Invitation[]>;
}

const Ctx = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const backendRef = useRef<Backend | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [live, setLive] = useState<LiveMember[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Création du backend + reprise de session.
  useEffect(() => {
    let alive = true;
    let created: Backend | null = null;
    (async () => {
      const b = await createBackend();
      if (!alive) {
        b.dispose();
        return;
      }
      created = b;
      backendRef.current = b;
      try {
        const s = await b.getSession();
        if (alive && s) setSession(s);
      } catch {
        /* pas de session */
      }
      try {
        const m = await b.listMembers();
        if (alive) setMembers(m);
      } catch {
        /* listMembers indisponible avant session (firebase) */
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
      created?.dispose();
    };
  }, []);

  // Abonnements temps réel une fois connecté.
  const sessionMemberId = session?.member.id;
  useEffect(() => {
    const b = backendRef.current;
    if (!b || !sessionMemberId) {
      setLive([]);
      setFeed([]);
      return;
    }
    const u1 = b.subscribeLive(setLive);
    const u2 = b.subscribeFeed(setFeed);
    b.listMembers().then(setMembers).catch(() => {});
    return () => {
      u1();
      u2();
    };
  }, [sessionMemberId]);

  // Partage de position (GPS du navigateur) tant que l'app est ouverte et le partage actif.
  const mySharing = session?.member.sharing;
  useEffect(() => {
    if (!sessionMemberId || !mySharing || mySharing === 'off') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    let last = 0;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - last < 20000) return; // au plus une écriture / 20 s
        last = now;
        const { latitude, longitude, speed } = pos.coords;
        backendRef.current
          ?.updateLocation({
            lat: latitude,
            lng: longitude,
            speed: speed != null && speed >= 0 ? speed * 3.6 : undefined,
          })
          .catch(() => {});
      },
      () => {
        /* permission refusée / indisponible : on ignore */
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [sessionMemberId, mySharing]);

  const memberById = useCallback(
    (id: string): Member | undefined => live.find((m) => m.id === id) ?? members.find((m) => m.id === id),
    [live, members],
  );

  const join = useCallback(async (code: string, profile: NewProfile) => {
    setSession(await backendRef.current!.joinWithCode(code, profile));
  }, []);

  const createFamily = useCallback(async (familyName: string, profile: NewProfile) => {
    setSession(await backendRef.current!.createFamily({ familyName, profile }));
  }, []);

  const demoSignIn = useCallback(async (memberId: string) => {
    setSession(await backendRef.current!.demoSignIn(memberId));
  }, []);

  const signOut = useCallback(async () => {
    await backendRef.current!.signOut();
    setSession(null);
  }, []);

  const setSharing = useCallback(
    async (mode: SharingMode) => {
      const me = session?.member;
      if (!me) return;
      await backendRef.current!.setSharing(me.id, mode);
      setSession((prev) => (prev ? { ...prev, member: { ...prev.member, sharing: mode } } : prev));
    },
    [session?.member],
  );

  const upsertGeofence = useCallback(
    async (input: { kind: GeofenceKind; label: string; lat: number; lng: number; radius?: number }) => {
      await backendRef.current!.upsertGeofence(input);
      setSession((prev) => {
        if (!prev) return prev;
        const others = prev.family.geofences.filter((g) => g.kind !== input.kind);
        const gf = { id: `gf-${input.kind}`, ...input, radius: input.radius ?? 120 };
        return { ...prev, family: { ...prev.family, geofences: [...others, gf] } };
      });
    },
    [],
  );

  const createPost = useCallback((input: CreatePostInput) => backendRef.current!.createPost(input), []);
  const toggleFavorite = useCallback((postId: string) => backendRef.current!.toggleFavorite(postId), []);
  const addComment = useCallback((postId: string, text: string) => backendRef.current!.addComment(postId, text), []);
  const createInvitation = useCallback(
    (input: { role: Role; label?: string }) => backendRef.current!.createInvitation(input),
    [],
  );
  const revokeInvitation = useCallback((id: string) => backendRef.current!.revokeInvitation(id), []);
  const listInvitations = useCallback(() => backendRef.current!.listInvitations(), []);

  const value: AppValue = {
    ready,
    backendKind: BACKEND_KIND,
    session,
    me: session?.member ?? null,
    live,
    feed,
    members,
    memberById,
    join,
    createFamily,
    demoSignIn,
    signOut,
    setSharing,
    upsertGeofence,
    createPost,
    toggleFavorite,
    addComment,
    createInvitation,
    revokeInvitation,
    listInvitations,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp doit être utilisé dans <AppProvider>');
  return v;
}
