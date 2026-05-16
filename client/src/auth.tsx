import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { Organization, User } from "./types";

type AuthState = {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    organizationName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await api<{ user: User | null; organization: Organization | null }>(
      "/api/auth/session"
    );
    setUser(data.user);
    setOrg(data.organization);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await refresh();
  }

  async function signup(email: string, password: string, organizationName: string) {
    await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, organizationName }),
    });
    await refresh();
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrg(null);
  }

  return (
    <AuthCtx.Provider value={{ user, organization, loading, refresh, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
