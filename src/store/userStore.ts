import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Event, EventSummary } from '@/types/api.types';

interface UserStore {
  token: string | null;
  user: User | null;
  currentEvent: Event | EventSummary | null;
  isLoading: boolean;
  isNewUser: boolean;

  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setCurrentEvent: (event: Event | EventSummary | null) => void;
  setLoading: (loading: boolean) => void;
  setNewUser: (value: boolean) => void;

  login: (token: string, user: User) => void;
  logout: () => void;

  isLoggedIn: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      currentEvent: null,
      isLoading: false,
      isNewUser: false,

      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token });
      },

      setUser: (user) => set({ user }),

      setCurrentEvent: (event) => set({ currentEvent: event }),

      setLoading: (isLoading) => set({ isLoading }),

      setNewUser: (isNewUser) => set({ isNewUser }),

      login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user, isNewUser: !user.name });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, currentEvent: null, isNewUser: false });
      },

      isLoggedIn: () => !!get().token && !!get().user,
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        currentEvent: state.currentEvent,
      }),
    }
  )
);
