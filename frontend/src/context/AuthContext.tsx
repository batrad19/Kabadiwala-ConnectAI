import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: string; email: string; full_name: string; role: string;
  phone?: string; is_active: boolean; is_verified: boolean; created_at: string;
}

interface AuthContextType {
  user: User | null; token: string | null; loading: boolean;
  isAuthenticated: boolean; login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>; logout: () => void;
}

interface RegisterData { full_name: string; email: string; password: string; phone?: string; role: string; }

const AuthContext = createContext<AuthContextType | null>(null)

const API = axios.create({ baseURL: '/api' })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored && token) { try { setUser(JSON.parse(stored)) } catch {} }
    setLoading(false)
  }, [token])

  const login = async (email: string, password: string) => {
    const { data } = await API.post('/auth/login', { email, password })
    setToken(data.access_token); setUser(data.user)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const register = async (d: RegisterData) => {
    const { data } = await API.post('/auth/register', d)
    setToken(data.access_token); setUser(data.user)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const logout = () => {
    setUser(null); setToken(null)
    localStorage.removeItem('token'); localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
