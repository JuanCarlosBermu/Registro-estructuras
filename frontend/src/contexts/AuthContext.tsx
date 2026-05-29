import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

type User = {
  id: number;
  email: string;
  nombre: string;
  rol: "admin" | "operador" | "visor";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string, rol?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Invalid token");
          return res.json();
        })
        .then((data) => setUser(data.user))
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
        });
    }
  }, [token]);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
  }

  async function register(email: string, password: string, nombre: string, rol?: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nombre, rol })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Register failed");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
