import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/api/client";

interface User {
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  initialising: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  token: string;
  userName: string;
  email: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    api.get<User>("/v1/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setInitialising(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.put<LoginResponse>("/v1/auth/login", { email, password });
    localStorage.setItem("token", response.token);
    setUser({ email: response.email, name: response.userName });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.put("/v1/auth/logout", {});
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, initialising, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
