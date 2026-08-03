import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../api/authService'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

const TOKEN_KEY = 'medibook_token'

// Normalizes role to lowercase so routes match patient/doctor/receptionist/admin
function normalizeUser(rawUser) {
  return { ...rawUser, role: rawUser.role === 'IT_ADMIN' ? 'admin' : rawUser.role.toLowerCase() }
}

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showToast }           = useToast()

  // On first load — if a token exists in localStorage, verify it with
  // the backend and restore the session. This runs once on page load/refresh.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }
    authService
      .getCurrentUser()
      .then((data) => setUser(normalizeUser(data.user)))
      .catch(() => {
        // Token is expired or invalid — clear it and send to login
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    const user = normalizeUser(data.user)  // role is now lowercase
    setUser(user)
    showToast(`Welcome back, ${user.name.split(' ')[0]}.`, 'success')
    return user  // return the normalized user so Login.jsx can redirect correctly
  }

  const register = async (payload) => {
    const data = await authService.register(payload)
    localStorage.setItem(TOKEN_KEY, data.token)
    const user = normalizeUser(data.user)  // role is now lowercase
    setUser(user)
    showToast('Account created. You can now book appointments.', 'success')
    return user
  }

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (token) {
      try {
        await authService.logout()
      } catch (error) {
        // Ignore backend logout failures; the client session must still be cleared.
      }
    }

    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}