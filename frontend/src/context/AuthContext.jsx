import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const TOKEN_STORAGE_KEY = 'stockflow_token'
const USER_STORAGE_KEY = 'stockflow_user'

const AuthContext = createContext(null)

function getStoredUser() {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState(getStoredUser)

  useEffect(() => {
    function handleUnauthorized() {
      setToken(null)
      setUser(null)
    }

    window.addEventListener('stockflow:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('stockflow:unauthorized', handleUnauthorized)
  }, [])

  async function login(credentials) {
    const { data } = await api.post('/api/auth/login', credentials)
    const safeUser = data.user

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser))
    setToken(data.token)
    setUser(safeUser)

    return data
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
