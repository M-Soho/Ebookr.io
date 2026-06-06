import { create } from "zustand";
import { api } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  plan?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  loadMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("ebookr_token"),
  ready: false,
  setSession: (token, user) => {
    localStorage.setItem("ebookr_token", token);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem("ebookr_token");
    set({ token: null, user: null });
  },
  loadMe: async () => {
    const token = localStorage.getItem("ebookr_token");
    if (!token) {
      set({ ready: true });
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, token, ready: true });
    } catch {
      localStorage.removeItem("ebookr_token");
      set({ token: null, user: null, ready: true });
    }
  },
}));
