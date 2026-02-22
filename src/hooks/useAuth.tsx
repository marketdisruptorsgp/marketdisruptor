import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  first_name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Prevents onAuthStateChange from re-establishing a session we just cleared
  const signingOut = useRef(false);

  const fetchOrCreateProfile = async (userId: string, showWelcome = false) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data as Profile);
      if (showWelcome) {
        toast.success(`Welcome back, ${data.first_name}! 👋 Your workspace is ready.`, {
          duration: 4000,
        });
      }
    } else {
      // No profile yet — new user, create from pending first name in localStorage
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
          if (showWelcome) {
            toast.success(`Let's go, ${newProfile.first_name}! 🚀 Your workspace is all set.`, {
              duration: 4000,
            });
          }
        }
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // While signing out, ignore all events so the session can't sneak back in
      if (signingOut.current) return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const isSignIn = event === "SIGNED_IN";
        fetchOrCreateProfile(session.user.id, isSignIn);
        // Auto-claim referral if code stored from share page
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
              .catch(() => { /* best effort */ });
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
      if (session?.user) fetchOrCreateProfile(session.user.id, false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    signingOut.current = true;

    // Clear React state first
    setUser(null);
    setSession(null);
    setProfile(null);

    // Sign out via Supabase — try local scope first (more reliable), then global
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (_) {
      // best effort
    }
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (_) {
      // best effort
    }

    // Wipe ALL storage keys — be aggressive
    [localStorage, sessionStorage].forEach((store) => {
      const keysToRemove = Object.keys(store).filter(
        (k) => k.startsWith("sb-") || k.includes("supabase") || k.includes("auth")
      );
      keysToRemove.forEach((k) => store.removeItem(k));
    });

    // Clear any auth cookies (Supabase PKCE flow can set these)
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("sb-") || name.includes("supabase") || name.includes("auth-token")) {
        // Clear for all possible path/domain combos
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });

    // Small delay to ensure storage is flushed before redirect
    await new Promise((r) => setTimeout(r, 100));

    // Use replace to prevent back-button from re-authenticating
    // Strip any query params that might contain tokens
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
