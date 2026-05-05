import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { AppRole } from "../types/domain";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

interface LoginPayload {
  email: string;
  password: string;
  role: AppRole;
}

interface RoleAccessContextValue {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const RoleAccessContext = createContext<RoleAccessContextValue | null>(null);

export function RoleAccessProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session) {
          const { user: supabaseUser } = data.session;
          if (supabaseUser) {
            // Construct AuthUser from Supabase session
            const role = (supabaseUser.user_metadata?.role as AppRole) || "employee";
            const name = supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User";
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || "",
              name,
              role,
            });
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (session?.user) {
        const role = (session.user.user_metadata?.role as AppRole) || "employee";
        const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User";
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name,
          role,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<RoleAccessContextValue>(() => {
    return {
      user,
      isAuthenticated: !!user,
      isLoading,
      login: async ({ email, password, role }) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
          });

          if (error) {
            return { ok: false, message: error.message || "Invalid credentials. Please try again." };
          }

          if (data?.user) {
            const authUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || "",
              name: data.user.user_metadata?.name || email.split("@")[0] || "User",
              role,
            };

            await supabase.auth.updateUser({
              data: { role, name: authUser.name },
            });

            setUser(authUser);
            return { ok: true };
          }

          return { ok: false, message: "Login failed. Please try again." };
        } catch (err) {
          console.error("Login error:", err);
          return { ok: false, message: "An error occurred during login." };
        }
      },
      logout: async () => {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (session?.session) {
            await supabase.auth.signOut();
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          setUser(null);
        }
      },
    };
  }, [user, isLoading]);

  return <RoleAccessContext.Provider value={value}>{children}</RoleAccessContext.Provider>;
}

export function useRoleAccess() {
  const ctx = useContext(RoleAccessContext);
  if (!ctx) {
    throw new Error("useRoleAccess must be used inside RoleAccessProvider");
  }
  return ctx;
}
