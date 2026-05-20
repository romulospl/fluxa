import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: async () => {
        try {
          await api.post('/api/logout')
        } catch (e) {
          console.error('Erro ao limpar cookie de sessão:', e)
        }
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'fluxa-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
