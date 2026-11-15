import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { usePostHog } from "posthog-react-native";
import { supabase } from "../utils/supabase";

// Google Sign-In only, per product decision - less friction than
// email/password or magic link (no typing, no inbox round-trip). Supabase
// Auth verifies the Google ID token server-side via `signInWithIdToken`, so
// there's no separate account system to maintain - a Supabase session comes
// out the other end and persists exactly like any other Supabase auth
// method (already configured for `persistSession: true` via AsyncStorage in
// utils/supabase.ts).
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** True until the initial "is there already a persisted session" check resolves. */
  isLoading: boolean;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const posthog = usePostHog();
  // Guards against re-`identify()`-ing on every session refresh (same user,
  // rotated token fires onAuthStateChange too) - only a genuine sign-in/
  // sign-out/account-switch should touch PostHog identity.
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      console.error(
        "⚠️ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing! Google Sign-In will " +
          "fail until it's set - create a Web application OAuth client in " +
          "Google Cloud Console > APIs & Services > Credentials, and add the " +
          "same client ID as an Authorized Client ID on the Google provider " +
          "in Supabase Auth settings.",
      );
    }
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Mirror the signed-in user into PostHog so events/session recordings tie
  // back to a real person instead of just an anonymous per-device ID -
  // `identify()` merges this device's prior anonymous history into the
  // user's profile. `reset()` on sign-out prevents the *next* person to use
  // this device from inheriting the previous user's identity.
  useEffect(() => {
    const user = session?.user ?? null;
    if (user) {
      if (identifiedUserId.current === user.id) return;
      identifiedUserId.current = user.id;
      posthog?.identify(user.id, {
        email: user.email ?? null,
        name:
          user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });
    } else if (identifiedUserId.current !== null) {
      identifiedUserId.current = null;
      posthog?.reset();
    }
  }, [session, posthog]);

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type !== "success") return; // user cancelled - not an error

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error(
          "Google didn't return an ID token - check that webClientId is a " +
            "Web application OAuth client, not an Android one.",
        );
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) throw error;
      // No manual setSession() call needed - signInWithIdToken already
      // updates the client's session internally, which fires
      // onAuthStateChange above and updates `session` from there.
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error("[AUTH] Google sign-in failed:", e?.message ?? e);
      throw e;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    try {
      await GoogleSignin.signOut();
    } catch {
      // Best-effort - the Supabase session is already cleared either way,
      // and GoogleSignin.signOut() can throw if there's no active Google
      // session to clear (e.g. this device never actually saw the native
      // sign-in sheet).
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isSigningIn,
      signInWithGoogle,
      signOut,
    }),
    [session, isLoading, isSigningIn, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
