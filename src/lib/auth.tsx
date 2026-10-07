import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

type User = { id: string; name: string; email: string; role: string };
type AuthContextType = {
  user: User | null;
  workspace: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res: any = await api.auth.me();
      setUser(res.data?.user || null);
      setWorkspace(res.data?.workspace || null);
    } catch {
      setUser(null);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res: any = await api.auth.login({ email, password });
    setUser(res.data?.user || null);
    setWorkspace(res.data?.workspace || null);
  };

  const register = async (name: string, email: string, password: string) => {
    const res: any = await api.auth.register({ name, email, password });
    setUser(res.data?.user || null);
    setWorkspace(res.data?.workspace || res.data?.workspace || null);
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    setWorkspace(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, workspace, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
