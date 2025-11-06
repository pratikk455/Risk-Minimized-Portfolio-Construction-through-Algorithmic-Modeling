import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  email: string
  full_name?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // Actions
  login: (accessToken: string, refreshToken: string, userId: number) => void
  logout: () => void
  setUser: (user: User) => void
  checkAuth: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (accessToken: string, refreshToken: string, userId: number) => {
        set({
          accessToken,
          refreshToken,
          user: { id: userId } as User,
          isAuthenticated: true,
        })

        // Store in localStorage as backup
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('user_id', userId.toString())
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })

        // Clear localStorage
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('portfolioGenerated')
        localStorage.removeItem('pendingAssessment')
      },

      setUser: (user: User) => {
        set({ user })
      },

      checkAuth: () => {
        const state = get()

        // Check if we have tokens in store
        if (state.accessToken && state.isAuthenticated) {
          return true
        }

        // Check localStorage as fallback
        const token = localStorage.getItem('access_token')
        const userId = localStorage.getItem('user_id')

        if (token && userId) {
          set({
            accessToken: token,
            refreshToken: localStorage.getItem('refresh_token'),
            user: { id: parseInt(userId) } as User,
            isAuthenticated: true,
          })
          return true
        }

        return false
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
