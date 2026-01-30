"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { Profile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  supabase: ReturnType<typeof getSupabaseClient>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function useSupabaseAuthInternal() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    let isMounted = true;
    const profileTimeoutMs = 5000; 

    const loadProfile = async (userId: string) => {
      if (!profile) {
        setProfileLoading(true);
      }
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          throw error;
        }

        if (!isMounted) return;
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;
        setUser(session?.user ?? null);

        if (session?.user) {
          if (!profile || profile.id !== session.user.id) {
            await loadProfile(session.user.id);
          }
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        if (isMounted) {
          setProfileLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        void event;
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
            if (!profile || profile.id !== session.user.id) {
              await loadProfile(session.user.id);
            }
          } else {
            setProfile(null);
            setProfileLoading(false);
          }
        } catch (error) {
          if ((error as Error)?.name !== "AbortError") {
            console.error("Failed to refresh session:", error);
          }
          if (isMounted) {
            setProfileLoading(false);
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, profileLoading, supabase };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useSupabaseAuthInternal();
  const value = useMemo(
    () => auth,
    [auth.user, auth.profile, auth.loading, auth.profileLoading, auth.supabase]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export const useSupabaseAuth = useAuth;
