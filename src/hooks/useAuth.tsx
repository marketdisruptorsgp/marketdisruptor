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

    // Wipe all Supabase session keys from localStorage so nothing can revive the session
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));

    try {
      await supabase.auth.signOut();
    } catch (_) {
      // best effort — local keys are already cleared
    }

    // Clear React state — AppRoutes sees user=null and shows AuthPage immediately
    setUser(null);
    setSession(null);
    setProfile(null);

    signingOut.current = false;
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
