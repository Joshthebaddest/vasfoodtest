import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  email: string | null;
  code: string | null;
  isRefreshing: boolean; // Add this to prevent multiple refresh calls
  refreshPromise: Promise<string | null> | null; // Store the refresh promise

  setAccessToken: (token: string | null) => void;
  setMail: (email: string | null) => void;
  setCode: (code: string | null) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setRefreshPromise: (promise: Promise<string | null> | null) => void;
  resetAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  email: null,
  code: null,
  isRefreshing: false,
  refreshPromise: null,
  
  setAccessToken: (token) => set({ accessToken: token }),
  setMail: (email) => set({ email }),
  setCode: (code) => set({ code }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setRefreshPromise: (promise) => set({ refreshPromise: promise }),
  resetAuth: () => set({ 
    accessToken: null, 
    email: null, 
    code: null, 
    isRefreshing: false,
    refreshPromise: null 
  }),
}));