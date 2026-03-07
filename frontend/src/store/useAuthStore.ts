import { create } from "zustand";
import { authApi } from "../api";

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem("token"),
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ username, password });
      const { access_token, user } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ token: access_token, user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ username, email, password });
      const { access_token, user } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ token: access_token, user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const res = await authApi.getMe();
      const user = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      set({ user });
    } catch {
      get().logout();
    }
  },

  updateUser: (data) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));
