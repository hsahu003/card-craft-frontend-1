"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const PROFILE_STORAGE_KEY = "cardcraft-profile"

export interface Profile {
  fullName: string
  email: string
}

interface UserContextValue {
  profile: Profile | null
  updateProfile: (profile: Profile) => void
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

function loadFromStorage(): Profile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Profile
    return parsed && typeof parsed.fullName === "string" && typeof parsed.email === "string"
      ? parsed
      : null
  } catch {
    return null
  }
}

function saveToStorage(profile: Profile | null) {
  if (typeof window === "undefined") return
  try {
    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    setProfile(loadFromStorage())
  }, [])

  useEffect(() => {
    saveToStorage(profile)
  }, [profile])

  const updateProfile = useCallback((newProfile: Profile) => {
    setProfile(newProfile)
  }, [])

  const logout = useCallback(() => {
    setProfile(null)
  }, [])

  const value: UserContextValue = {
    profile,
    updateProfile,
    logout,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return ctx
}
