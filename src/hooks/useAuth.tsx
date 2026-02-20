import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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

  const fetchOrCreateProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data as Profile);
    } else {
      // No profile yet — try to create one using the pending first name from localStorage
      const pendingName = localStorage.getItem("pending_first_name");
      if (pendingName) {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ user_id: userId, first_name: pendingName })
          .select("user_id, first_name")
          .single();
        localStorage.removeItem("pending_first_name");
        if (newProfile) setProfile(newProfile as Profile);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchOrCreateProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    setUser(null);
    setSession(null);
    setProfile(null);
    // Force reload to clear any cached session state
    window.location.href = "/";
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
