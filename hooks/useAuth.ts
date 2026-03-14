"use client"

import { useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { addUser, validateCredentials } from "@/lib/auth-storage"

export type AuthResult = { success: true } | { success: false; error: string }

/**
 * Auth hook: login, signup, logout. Uses localStorage for now;
 * replace the logic in this hook (or in lib/auth-storage) with API
 * calls when connecting to a real backend.
 */
export function useAuth() {
  const { updateProfile, logout: userLogout } = useUser()

  const login = useCallback(
    (email: string, password: string): AuthResult => {
      const result = validateCredentials(email, password)
      if (!result.success) return result
      updateProfile({
        fullName: result.user.fullName,
        email: result.user.email,
      })
      return { success: true }
    },
    [updateProfile]
  )

  const signup = useCallback(
    (fullName: string, email: string, password: string): AuthResult => {
      const result = addUser({ fullName, email, password })
      if (!result.success) return result
      updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
      })
      return { success: true }
    },
    [updateProfile]
  )

  const logout = useCallback(() => {
    userLogout()
  }, [userLogout])

  return { login, signup, logout }
}
