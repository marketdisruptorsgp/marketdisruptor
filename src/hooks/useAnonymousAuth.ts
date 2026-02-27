import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AnonymousAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  claimAccount: (email: string, password: string) => Promise<{ error: string | null }>;
}

/**
 * Hook for anonymous device-based authentication.
 * Auto-signs in anonymously on first visit.
 * Supports upgrading to email account later.
 */
export function useAnonymousAuth(): AnonymousAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Check for existing session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
      } else {
        // No session — sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous sign-in failed:", error);
        }
        setSession(data?.session ?? null);
        setUser(data?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAnonymous = user?.is_anonymous === true;

  const claimAccount = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to claim account" };
    }
  }, []);

  return { user, session, loading, isAnonymous, claimAccount };
}
