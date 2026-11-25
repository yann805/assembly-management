import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RoleName } from '@/types';
import api from '@/lib/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (identifier, password) => {
        const res = await api.post('/auth/login', { identifier, password });
        const { accessToken, user } = res.data;
        localStorage.setItem('assembly_token', accessToken);
        set({ token: accessToken, user, isAuthenticated: true });
        return user;
      },
      logout: () => {
        localStorage.removeItem('assembly_token');
        set({ token: null, user: null, isAuthenticated: false });
      },
      refreshUser: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'assembly-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);

// Helpers
export function hasRole(user: User | null, role: RoleName): boolean {
  return !!user?.roles?.some((r) => r.name === role);
}

export function getActiveAssemblyId(user: User | null): string | undefined {
  return user?.roles?.find((r) => r.assemblyId)?.assemblyId;
}

export function getHomeRoute(user: User | null): string {
  if (!user) return '/login';
  if (hasRole(user, 'GENERAL_TREASURY')) return '/admin';
  if (hasRole(user, 'ASSEMBLY_TREASURER')) return '/treasurer';
  if (hasRole(user, 'ASSEMBLY_LEADER')) return '/leader';
  return '/login';
}
