import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Affiliate } from '@/types/api.types';

interface AffiliateStore {
  token: string | null;
  affiliate: Affiliate | null;
  isLoading: boolean;

  setToken: (token: string | null) => void;
  setAffiliate: (affiliate: Affiliate | null) => void;
  setLoading: (loading: boolean) => void;

  login: (token: string, affiliate: Affiliate) => void;
  logout: () => void;

  isLoggedIn: () => boolean;
}

export const useAffiliateStore = create<AffiliateStore>()(
  persist(
    (set, get) => ({
      token: null,
      affiliate: null,
      isLoading: false,

      setToken: (token) => {
        if (token) {
          localStorage.setItem('affiliate-token', token);
        } else {
          localStorage.removeItem('affiliate-token');
        }
        set({ token });
      },

      setAffiliate: (affiliate) => set({ affiliate }),

      setLoading: (isLoading) => set({ isLoading }),

      login: (token, affiliate) => {
        localStorage.setItem('affiliate-token', token);
        set({ token, affiliate });
      },

      logout: () => {
        localStorage.removeItem('affiliate-token');
        set({ token: null, affiliate: null });
      },

      isLoggedIn: () => !!get().token && !!get().affiliate,
    }),
    {
      name: 'affiliate-storage',
      partialize: (state) => ({
        token: state.token,
        affiliate: state.affiliate,
      }),
    }
  )
);
