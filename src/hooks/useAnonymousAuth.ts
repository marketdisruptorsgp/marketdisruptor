import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const DEVICE_KEY = "md_device_id";
const DEVICE_FIRST_SEEN = "md_device_first_seen";
const DEVICE_VERIFIED = "md_device_verified";

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    localStorage.setItem(DEVICE_FIRST_SEEN, new Date().toISOString());
  }
  return id;
}

interface AnonymousAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  isVerified: boolean;
  deviceId: string;
  claimAccount: (email: string, password: string) => Promise<{ error: string | null }>;
}

/**
 * Session duration policy:
 * - Supabase default: 1 hour access token, 1 week refresh token
 * - persistSession: true → tokens stored in localStorage, survive browser close
 * - autoRefreshToken: true → access token refreshed silently before expiry
 * - Net effect: user stays signed in indefinitely on the same device
 *   until explicit sign-out or localStorage clear
 *
 * Device recognition:
 * - Unique device ID persisted in localStorage
 * - Tracks first-seen and verified status
 * - Anonymous session created on first visit if no session exists
 *
 * Re-authentication triggers:
 * - New device (no device ID in localStorage)
 * - Cleared browser data (localStorage wiped)
 * - Explicit sign-out
 * - Refresh token expired (>7 days inactive)
 */
export function useAnonymousAuth(): AnonymousAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const deviceId = getOrCreateDeviceId();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Mark device as verified when user confirms email
      if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
        localStorage.setItem(DEVICE_VERIFIED, "true");
      }

      // Handle token refresh — keep session alive
      if (event === "TOKEN_REFRESHED" && session) {
        // Session silently extended, no action needed
      }

      setLoading(false);
    });

    // Check for existing session first — returning users get recognized instantly
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Returning user — session persisted from previous visit
        setSession(session);
        setUser(session.user);

        // Update last-seen for verified users
        if (!session.user.is_anonymous) {
          localStorage.setItem(DEVICE_VERIFIED, "true");
          // Throttled to once per session
          const lastSeenKey = `md_last_seen_${session.user.id}`;
          if (!sessionStorage.getItem(lastSeenKey)) {
            sessionStorage.setItem(lastSeenKey, Date.now().toString());
            supabase.rpc("update_last_seen", { p_user_id: session.user.id }).then(() => {});
          }
        }

        setLoading(false);
      } else {
        // New device or cleared session — create anonymous identity
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
  const isVerified = localStorage.getItem(DEVICE_VERIFIED) === "true" && !isAnonymous;

  const claimAccount = useCallback(async (email: string, password: string) => {
    try {
      // Upgrade anonymous user to full account
      const { error } = await supabase.auth.updateUser({
        email,
        password,
      });
      if (error) return { error: error.message };

      // Mark device as verified
      localStorage.setItem(DEVICE_VERIFIED, "true");

      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to claim account" };
    }
  }, []);

  return { user, session, loading, isAnonymous, isVerified, deviceId, claimAccount };
}
