import { useState, useEffect, useRef, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const DEVICE_VERIFIED = "md_device_verified";

interface Profile {
  user_id: string;
  first_name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isReturningUser: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isReturningUser: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOut = useRef(false);
  // Persist across HMR — module-level guard survives hot reload
  const profileFetchedFor = useRef<string | null>(
    (window as any).__md_profileFetchedFor ?? null
  );

  const isReturningUser = localStorage.getItem(DEVICE_VERIFIED) === "true";

  const fetchOrCreateProfile = useCallback(async (userId: string) => {
    // Deduplicate: only fetch once per user per mount
    if (profileFetchedFor.current === userId) return;
    profileFetchedFor.current = userId;
    (window as any).__md_profileFetchedFor = userId;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data as Profile);
      // Update last seen — throttled to once per session
      const lastSeenKey = `md_last_seen_${userId}`;
      const lastFired = sessionStorage.getItem(lastSeenKey);
      if (!lastFired) {
        sessionStorage.setItem(lastSeenKey, Date.now().toString());
        supabase.rpc("update_last_seen", { p_user_id: userId }).catch(() => { /* non-critical — silent fail */ });
      }
    } else {
      const pendingName = localStorage.getItem("pending_first_name");
      if (pendingName) {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ user_id: userId, first_name: pendingName })
          .select("user_id, first_name")
          .single();
        localStorage.removeItem("pending_first_name");
        if (newProfile) {
          setProfile(newProfile as Profile);
        }
      }
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (signingOut.current) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const isSignIn = event === "SIGNED_IN";
        fetchOrCreateProfile(session.user.id);

        // Mark device as verified on successful sign-in (non-anonymous)
        if (isSignIn && !session.user.is_anonymous) {
          localStorage.setItem(DEVICE_VERIFIED, "true");
        }

        if (isSignIn) {
          const refCode = localStorage.getItem("referral_code");
          if (refCode) {
            localStorage.removeItem("referral_code");
            supabase.functions.invoke("claim-referral", { body: { referralCode: refCode } })
              .then(({ data }) => {
                if (data?.success && data?.bonus) {
                  toast.success(`🎉 Referral bonus! You got +${data.bonus} extra analyses!`, { duration: 5000 });
                }
              })
              .catch(() => {});
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (signingOut.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    signingOut.current = true;

    setUser(null);
    setSession(null);
    setProfile(null);

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (_) {}
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (_) {}

    // Wipe auth storage but preserve device ID for re-recognition
    [localStorage, sessionStorage].forEach((store) => {
      const keysToRemove = Object.keys(store).filter(
        (k) => (k.startsWith("sb-") || k.includes("supabase") || k.includes("auth")) &&
               !k.startsWith("md_") // preserve device keys
      );
      keysToRemove.forEach((k) => store.removeItem(k));
    });

    // Clear device verified flag — next login requires magic link
    localStorage.removeItem(DEVICE_VERIFIED);

    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("sb-") || name.includes("supabase") || name.includes("auth-token")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });

    await new Promise((r) => setTimeout(r, 100));
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isReturningUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
