import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { AppRole } from "../types/domain";

export interface AuthUser {
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
  login: (payload: LoginPayload) => { ok: boolean; message?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const ACCOUNTS: Array<AuthUser & { password: string }> = [
  { name: "Casey Morgan", email: "manager@fieldops.com", password: "Manager@123", role: "manager" },
  { name: "Jordan Lee", email: "admin@fieldops.com", password: "Admin@123", role: "admin" },
  {
    name: "Taylor Brooks",
    email: "accountant@fieldops.com",
    password: "Accountant@123",
    role: "accountant",
  },
];

const STORAGE_KEY = "fieldops_auth_user";

const RoleAccessContext = createContext<RoleAccessContextValue | null>(null);

export function RoleAccessProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  const value = useMemo<RoleAccessContextValue>(() => {
    return {
      user,
      isAuthenticated: !!user,
      login: ({ email, password, role }) => {
        const matched = ACCOUNTS.find(
          (item) =>
            item.email.toLowerCase() === email.toLowerCase().trim() &&
            item.password === password &&
            item.role === role
        );

        if (!matched) {
          return { ok: false, message: "Invalid credentials. Please check email, password, and role." };
        }

        const nextUser: AuthUser = { email: matched.email, name: matched.name, role: matched.role };
        setUser(nextUser);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        return { ok: true };
      },
      logout: () => {
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    };
  }, [user]);

  return <RoleAccessContext.Provider value={value}>{children}</RoleAccessContext.Provider>;
}

export function useRoleAccess() {
  const ctx = useContext(RoleAccessContext);
  if (!ctx) {
    throw new Error("useRoleAccess must be used inside RoleAccessProvider");
  }
  return ctx;
}

export const demoAccounts = ACCOUNTS.map(({ password, ...account }) => ({ ...account, passwordHint: password }));
