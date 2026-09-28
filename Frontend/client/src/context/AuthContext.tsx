import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types/auth";
import * as auth from "../services/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("intervexa_access_token") : null;
    
    if (!token) {
      auth
        .refreshToken()
        .then((res) => {
          if (res.user) setUser(res.user);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
      return;
    }

    auth
      .getMe()
      .then((res) => {
        if (res.user) setUser(res.user);
      })
      .catch(async () => {
        try {
          const result = await auth.refreshToken();
          if (result.user) setUser(result.user);
          else setUser(null);
        } catch {
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await auth.login(email, password);
    if (result.user) {
      setUser(result.user);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const result = await auth.register(name, email, password);
    if (result.user) {
      setUser(result.user);
    }
  };

  const updateName = async (name: string) => {
    const updated = await auth.updateProfile({ name });
    if (updated.user) {
      setUser(updated.user);
    }
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateName, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
