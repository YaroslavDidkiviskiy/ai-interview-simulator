import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface User {
  id: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function formatApiDetail(detail: unknown): string | null {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && 'msg' in (detail[0] as object)) {
    return String((detail[0] as { msg: string }).msg)
  }
  return null
}

function getOAuthTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)oauth_access_token=([^;]*)/)
  if (!match) return null
  const token = decodeURIComponent(match[1])
  // одразу очищаємо cookie — токен переїжджає в localStorage
  document.cookie = 'oauth_access_token=; max-age=0; path=/'
  return token
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    // спочатку перевіряємо OAuth cookie (після редіректу від Google/GitHub)
    const oauthToken = getOAuthTokenFromCookie()
    if (oauthToken) {
      localStorage.setItem('access_token', oauthToken)
      return oauthToken
    }
    return localStorage.getItem('access_token')
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    fetch(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data) setUser(data)
        else {
          localStorage.removeItem('access_token')
          setToken(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  async function login(email: string, password: string) {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Invalid email or password')

    const data = await res.json()
    localStorage.setItem('access_token', data.access_token)
    setToken(data.access_token)

    const me = await fetch(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (!me.ok) {
      localStorage.removeItem('access_token')
      setToken(null)
      throw new Error('Could not load your profile')
    }
    setUser(await me.json())
  }

  async function register(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as { detail?: unknown }))
      const msg = formatApiDetail(err?.detail) ?? 'Registration failed'
      throw new Error(msg)
    }
    await login(email, password)
  }

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}