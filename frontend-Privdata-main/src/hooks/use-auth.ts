import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { authApi } from "@/lib/api"
import type { MeResponse } from "@/types/auth"

const TOKEN_KEY = "privdata_token"
const USER_KEY  = "privdata_user"

function saveSession(token: string, user: MeResponse) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

function getStoredUser(): MeResponse | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as MeResponse) : null
  } catch { return null }
}

export function useAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState<MeResponse | null>(getStoredUser)

  const isAuthenticated = useCallback((): boolean => {
    return !!sessionStorage.getItem(TOKEN_KEY)
  }, [])

  const getUser = useCallback((): MeResponse | null => {
    return user ?? getStoredUser()
  }, [user])

  // Acepta tanto "ARCO_VIEW" como "ROLE_ADMIN"
  const hasPermission = useCallback((permission: string): boolean => {
    const current = user ?? getStoredUser()
    if (!current) return false
    const norm = permission.toUpperCase()
    return current.authorities.some((a) => a === norm || a === `ROLE_${norm}`)
  }, [user])

  const hasRole = useCallback((role: string): boolean => {
    const current = user ?? getStoredUser()
    if (!current) return false
    return current.authorities.includes(`ROLE_${role.toUpperCase()}`)
  }, [user])

  // 1. Llama /auth/login → guarda token
  // 2. Llama /auth/me    → guarda usuario completo con authorities
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; message: string }> => {
    try {
      const loginRes = await authApi.login({ email, password })
      const token = loginRes.data?.data?.token
      if (!token) {
        return { ok: false, message: loginRes.data?.message ?? "Error al iniciar sesión" }
      }

      sessionStorage.setItem(TOKEN_KEY, token) // necesario para que /auth/me lleve el JWT

      const meRes = await authApi.me()
      const userData = meRes.data?.data
      if (!userData) {
        clearSession()
        return { ok: false, message: "No se pudo obtener el perfil del usuario" }
      }

      saveSession(token, userData)
      setUser(userData)

  return { ok: true, message: "Sesión iniciada" }

  } catch (error: unknown) {
    clearSession()

    const rawMsg =
      (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Credenciales inválidas"

    const msg = rawMsg.includes("Credenciales inválidas")
      ? "Credenciales inválidas"
      : rawMsg

    return { ok: false, message: msg }
  }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    navigate("/login")
  }, [navigate])

  return { isAuthenticated, getUser, hasPermission, hasRole, login, logout, user }
}