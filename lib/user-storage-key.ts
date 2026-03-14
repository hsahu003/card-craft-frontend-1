/**
 * Returns a localStorage key scoped by user. Guest (no profile) uses the base key;
 * signed-in user uses baseKey:normalizedEmail so data is per-user.
 */
export function getStorageKey(
  baseKey: string,
  profile: { email: string } | null
): string {
  if (!profile?.email?.trim()) return baseKey
  return `${baseKey}:${profile.email.trim().toLowerCase()}`
}
