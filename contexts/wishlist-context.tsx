"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useUser } from "@/contexts/user-context"
import { getStorageKey } from "@/lib/user-storage-key"
import type { TemplateLanguage } from "@/lib/templates"

const WISHLIST_STORAGE_KEY = "cardcraft-wishlist"

export interface WishlistItem {
  id: string
  name: string
  category: string
  language: TemplateLanguage
  price: number
  colors: [string, string]
  emoji: string
}

interface WishlistContextValue {
  items: WishlistItem[]
  add: (item: WishlistItem) => void
  remove: (id: string) => void
  isInWishlist: (id: string) => boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

function loadFromStorage(key: string): WishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WishlistItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(items: WishlistItem[], key: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function mergeWishlistItems(
  userItems: WishlistItem[],
  guestItems: WishlistItem[]
): WishlistItem[] {
  const byId = new Map<string, WishlistItem>()
  for (const item of userItems) byId.set(item.id, item)
  for (const item of guestItems) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { profile, isReady } = useUser()
  const [items, setItems] = useState<WishlistItem[]>([])
  const prevKeyRef = useRef<string | null>(null)

  const currentKey = getStorageKey(WISHLIST_STORAGE_KEY, profile)

  useEffect(() => {
    if (!isReady) return

    const prevKey = prevKeyRef.current

    if (prevKey !== null && prevKey !== currentKey) {
      const isGuestToUser = !prevKey.includes(":")
      if (isGuestToUser) {
        const userItems = loadFromStorage(currentKey)
        const guestItems = items
        const merged = mergeWishlistItems(userItems, guestItems)
        saveToStorage(merged, currentKey)
        setItems(merged)
        saveToStorage([], prevKey)
      } else {
        saveToStorage(items, prevKey)
        setItems(loadFromStorage(currentKey))
      }
    } else if (prevKey === null) {
      setItems(loadFromStorage(currentKey))
    }

    prevKeyRef.current = currentKey
  }, [isReady, currentKey])

  useEffect(() => {
    if (!isReady) return
    saveToStorage(items, currentKey)
  }, [isReady, currentKey, items])

  const add = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const isInWishlist = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  )

  const value: WishlistContextValue = {
    items,
    add,
    remove,
    isInWishlist,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return ctx
}
