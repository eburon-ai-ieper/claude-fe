import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  role: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("accessToken"),
  role: localStorage.getItem("userRole"),
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null,

  setAuth: (token, user) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, role: user.role, user });
  },

  logout: () => {
    localStorage.clear();
    set({ token: null, role: null, user: null });
  },
}));
