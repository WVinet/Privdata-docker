import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { authApi } from "@/lib/api"
import type { MeResponse } from "@/types/auth"

const TOKEN_KEY = "agencia_token"
const USER_KEY  = "agencia_user"

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

  const hasRole = useCallback((role: string): boolean => {
    const current = user ?? getStoredUser()
    if (!current) return false
    return current.authorities.includes(`ROLE_${role.toUpperCase()}`)
  }, [user])

  // 1. Llama /auth/login → guarda token
  // 2. Llama /auth/me    → guarda usuario completo con authorities
  // 3. Exige el rol AGENCY_AUDITOR — este portal es solo para el auditor de la Agencia
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

      sessionStorage.setItem(TOKEN_KEY, token)

      const meRes = await authApi.me()
      const userData = meRes.data?.data
      if (!userData) {
        clearSession()
        return { ok: false, message: "No se pudo obtener el perfil del usuario" }
      }

      if (!userData.authorities.includes("ROLE_AGENCY_AUDITOR")) {
        clearSession()
        return { ok: false, message: "Esta cuenta no tiene acceso al portal de la Agencia." }
      }

      saveSession(token, userData)
      setUser(userData)

      return { ok: true, message: "Sesión iniciada" }
    } catch (error: unknown) {
      clearSession()
      const rawMsg =
        (error as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? "Credenciales inválidas"
      return { ok: false, message: rawMsg }
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    navigate("/login")
  }, [navigate])

  return { isAuthenticated, getUser, hasRole, login, logout, user }
}
