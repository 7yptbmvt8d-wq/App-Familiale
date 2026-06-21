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
  Invitation,
  Member,
  NewProfile,
  Post,
  Role,
  Session,
} from '../backend/types';

interface AppValue {
  ready: boolean;
  backendKind: 'mock' | 'firebase';
  session: Session | null;
  me: Member | null;
  feed: Post[];
  members: Member[];
  memberById: (id: string) => Member | undefined;

  join: (code: string, profile: NewProfile) => Promise<void>;
  createFamily: (familyName: string, profile: NewProfile) => Promise<void>;
  demoSignIn: (memberId: string) => Promise<void>;
  signOut: () => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleFavorite: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  updateMember: (memberId: string, patch: { name?: string; relation?: string; birthDate?: string }) => Promise<void>;
  createInvitation: (input: { role: Role; label?: string }) => Promise<Invitation>;
  revokeInvitation: (id: string) => Promise<void>;
  listInvitations: () => Promise<Invitation[]>;
}

/** Mêmes initiales que les backends (deux premières lettres du nom). */
const deriveInitials = (name: string) => name.trim().slice(0, 2);

const Ctx = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const backendRef = useRef<Backend | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
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

  // Abonnement au fil une fois connecté.
  const sessionMemberId = session?.member.id;
  useEffect(() => {
    const b = backendRef.current;
    if (!b || !sessionMemberId) {
      setFeed([]);
      return;
    }
    const u = b.subscribeFeed(setFeed);
    b.listMembers().then(setMembers).catch(() => {});
    return () => u();
  }, [sessionMemberId]);

  const memberById = useCallback(
    (id: string): Member | undefined => members.find((m) => m.id === id),
    [members],
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

  const createPost = useCallback((input: CreatePostInput) => backendRef.current!.createPost(input), []);
  const deletePost = useCallback((postId: string) => backendRef.current!.deletePost(postId), []);
  const toggleFavorite = useCallback((postId: string) => backendRef.current!.toggleFavorite(postId), []);
  const addComment = useCallback((postId: string, text: string) => backendRef.current!.addComment(postId, text), []);

  const updateMember = useCallback(
    async (memberId: string, patch: { name?: string; relation?: string; birthDate?: string }) => {
      await backendRef.current!.updateMember(memberId, patch);
      // Reflète immédiatement le changement (liste des membres + session si c'est moi).
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, ...patch, initials: patch.name ? deriveInitials(patch.name) : m.initials }
            : m,
        ),
      );
      setSession((prev) =>
        prev && prev.member.id === memberId
          ? {
              ...prev,
              member: {
                ...prev.member,
                ...patch,
                initials: patch.name ? deriveInitials(patch.name) : prev.member.initials,
              },
            }
          : prev,
      );
    },
    [],
  );

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
    feed,
    members,
    memberById,
    join,
    createFamily,
    demoSignIn,
    signOut,
    createPost,
    deletePost,
    toggleFavorite,
    addComment,
    updateMember,
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
