/**
 * LocalStorage-based auth storage. Replace this module (or its callers)
 * with API calls when connecting to a real backend.
 */

const USERS_STORAGE_KEY = "cardcraft-users"

export interface StoredUser {
  email: string
  password: string
  fullName: string
}

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (u): u is StoredUser =>
        u &&
        typeof u === "object" &&
        typeof (u as StoredUser).email === "string" &&
        typeof (u as StoredUser).password === "string" &&
        typeof (u as StoredUser).fullName === "string"
    )
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch {
    // ignore
  }
}

export function findUserByEmail(email: string): StoredUser | null {
  const normalized = email.trim().toLowerCase()
  return getUsers().find((u) => u.email.toLowerCase() === normalized) ?? null
}

export function addUser(user: StoredUser): { success: true } | { success: false; error: string } {
  const normalizedEmail = user.email.trim().toLowerCase()
  if (!normalizedEmail || !user.password.trim() || !user.fullName.trim()) {
    return { success: false, error: "Full name, email and password are required." }
  }
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: "This email is already registered." }
  }
  users.push({
    email: user.email.trim(),
    password: user.password,
    fullName: user.fullName.trim(),
  })
  saveUsers(users)
  return { success: true }
}

export function validateCredentials(
  email: string,
  password: string
): { success: true; user: StoredUser } | { success: false; error: string } {
  const user = findUserByEmail(email)
  if (!user) {
    return { success: false, error: "Invalid email or password." }
  }
  if (user.password !== password) {
    return { success: false, error: "Invalid email or password." }
  }
  return { success: true, user }
}
