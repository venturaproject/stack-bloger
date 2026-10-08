import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: number
  name: string
  username?: string | null
  email: string
  role: string
  avatar: string | null
}

export type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthState {
  user: AuthUser | null
  permissions: string[]
  roles: string[]
  status: AuthStatus
  authVersion: number
  setAuth: (user: AuthUser, permissions?: string[], roles?: string[]) => void
  updateUser: (updates: Partial<AuthUser>) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      roles: [],
      status: 'loading',
      authVersion: 0,
      setAuth: (user, permissions = [], roles = []) =>
        set((state) => ({ user, permissions, roles, status: 'authenticated', authVersion: state.authVersion + 1 })),
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      logout: () => set((state) => ({
        user: null,
        permissions: [],
        roles: [],
        status: 'guest',
        authVersion: state.authVersion + 1,
      })),
      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'auth',
      // The cookie is the authority; bootstrap always validates it on reload.
      partialize: ({ user, permissions, roles }) => ({ user, permissions, roles }),
    },
  ),
)
