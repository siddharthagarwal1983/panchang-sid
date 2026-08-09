import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabase } from "@/integrations/supabase/lazy";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Ctx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const supabase = await getSupabase();
      if (cancelled) return;
      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        if (!next) setProfile(null);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const supabase = await getSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, [userId]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!userId) return;
      const supabase = await getSupabase();
      await supabase.from("profiles").upsert({ id: userId, display_name: name });
      await refreshProfile();
    },
    [userId, refreshProfile],
  );

  const signOut = useCallback(async () => {
    // Drop protected state locally first so nothing can render with stale data
    // while the network round-trip completes.
    setProfile(null);
    setSession(null);
    const supabase = await getSupabase();
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile,
      updateDisplayName,
      signOut,
    }),
    [session, profile, loading, refreshProfile, updateDisplayName, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}