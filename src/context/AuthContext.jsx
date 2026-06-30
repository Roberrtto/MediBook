import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../api/authService'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

const TOKEN_KEY = 'medibook_token'

export function AuthProvider({ children }) {
  // --- DEVELOPMENT OVERRIDE ---
  // To view pages independently, set a mock user here.
  // Change the 'role' to 'patient', 'receptionist', or 'doctor' to see their pages.
  const [user, setUser] = useState({
    id: 'dev-user-123',
    name: 'Dev User',
    email: 'dev@medibook.com',
    role: 'patient', // <-- CHANGE THIS to 'receptionist' or 'doctor'
  })
  const [isLoading, setIsLoading] = useState(false) // Set to false since we aren't fetching
  const { showToast } = useToast()

  // The original effect is commented out to prevent it from overriding the mock user.
  // useEffect(() => {
  //   const token = localStorage.getItem(TOKEN_KEY)
  //   if (!token) {
  //     setIsLoading(false)
  //     return
  //   }
  //   authService.getCurrentUser()
  //     .then((data) => setUser(data.user))
  //     .catch(() => localStorage.removeItem(TOKEN_KEY))
  //     .finally(() => setIsLoading(false))
  // }, [])

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    showToast(`Welcome back, ${data.user.name.split(' ')[0]}.`, 'success')
    return data.user
  }

  const register = async (payload) => {
    const data = await authService.register(payload)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    showToast('Account created. You can now book appointments.', 'success')
    return data.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
