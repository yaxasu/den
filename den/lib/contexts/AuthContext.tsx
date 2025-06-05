// src/lib/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabaseClient";
import { fetchProfile, signInUser, registerUser } from "@/lib/services/auth";
import { Profile } from "@/lib/schema";
import * as jwtDecodeModule from "jwt-decode";
import { router } from "expo-router";
import { useReload } from "@/lib/contexts/KeyedReload";
import { queryClient } from "@/lib/queryClient";

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  register: (
    email: string,
    password: string,
    full_name: string,
    birthday: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function useAuthLoadingDone() {
  const ctx = useContext(AuthContext);
  return ctx ? !ctx.loading : false;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingHandledRef = useRef(false);
  const refreshingRef = useRef(false);
  const reload = useReload();

  const markLoadingDone = () => {
    if (!loadingHandledRef.current) {
      setLoading(false);
      loadingHandledRef.current = true;
    }
  };

  const saveProfileToStorage = useCallback(async (profile: Profile) => {
    try {
      await AsyncStorage.setItem("profile", JSON.stringify(profile));
    } catch (err) {
      console.warn("[AuthProvider] saveProfileToStorage error:", err);
    }
  }, []);

  const loadCachedProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const cached = await AsyncStorage.getItem("profile");
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn("[AuthProvider] loadCachedProfile error:", err);
      return null;
    }
  }, []);

  const jwtDecode = jwtDecodeModule as unknown as (token: string) => { exp?: number };

  const isAccessTokenExpired = (accessToken: string) => {
    try {
      const decoded: any = jwtDecode(accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime + 5; // 5-second buffer
    } catch (err) {
      console.warn("Failed to decode access token:", err);
      return true;
    }
  };

  const refreshProfile = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const profile = await fetchProfile();
      if (profile) {
        setUser((prev) => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(profile);
          if (hasChanged) {
            saveProfileToStorage(profile);
            return profile;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("[AuthProvider] refreshProfile error:", err);
    } finally {
      refreshingRef.current = false;
    }
  }, [saveProfileToStorage]);

  const restoreSession = useCallback(async () => {
    try {
      const rawSession = await AsyncStorage.getItem("supabase.auth.token");
      if (!rawSession) {
        if (__DEV__) console.log("[AuthProvider] No cached session.");
        markLoadingDone();
        return;
      }

      const { currentSession } = JSON.parse(rawSession);
      const { access_token, refresh_token } = currentSession;

      if (isAccessTokenExpired(access_token)) {
        if (__DEV__) console.log("[AuthProvider] Token expired. Attempting refresh...");
        const { data, error } = await Promise.race([
          supabase.auth.refreshSession({ refresh_token }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Refresh timeout")), 3000)
          ),
        ]);

        if (error || !data?.session) {
          throw error || new Error("No session returned from refresh");
        }

        await supabase.auth.setSession(data.session);
      }

    } catch (err) {
      console.warn("[AuthProvider] restoreSession error:", err);
    } finally {
      markLoadingDone();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const cached = await loadCachedProfile();
      if (isMounted && cached) setUser(cached);
      await restoreSession();
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (__DEV__) console.log("[AuthProvider] onAuthStateChange:", event);

      if (event === "SIGNED_OUT") {
        setUser(null);
        AsyncStorage.removeItem("profile").catch(() => {});
      } else if (
        session &&
        ["SIGNED_IN", "INITIAL_SESSION", "TOKEN_REFRESHED"].includes(event)
      ) {
        refreshProfile();
      }

      markLoadingDone();
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadCachedProfile, restoreSession, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    return await signInUser(email, password);
  }, []);

  const register = useCallback(
    async (email: string, password: string, full_name: string, birthday: string) => {
      return await registerUser(email, password, full_name, birthday);
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      await AsyncStorage.removeItem("profile");
      queryClient.clear()
      router.replace("/(auth)");
    } catch (err) {
      console.error("[AuthProvider] signOut error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, register, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
