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

const CART_STORAGE_KEY = "cardcraft-cart"

export interface CartItem {
  id: string
  name: string
  category: string
  language: TemplateLanguage
  price: number
  colors: [string, string]
  emoji: string
  customMessage: string
}

interface CartContextValue {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function loadFromStorage(key: string): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[], key: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function mergeCartItems(userItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>()
  for (const item of userItems) byId.set(item.id, item)
  for (const item of guestItems) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { profile, isReady } = useUser()
  const [items, setItems] = useState<CartItem[]>([])
  const prevKeyRef = useRef<string | null>(null)

  const currentKey = getStorageKey(CART_STORAGE_KEY, profile)

  useEffect(() => {
    if (!isReady) return

    const prevKey = prevKeyRef.current

    if (prevKey !== null && prevKey !== currentKey) {
      const isGuestToUser = !prevKey.includes(":")
      if (isGuestToUser) {
        const userItems = loadFromStorage(currentKey)
        const guestItems = items
        const merged = mergeCartItems(userItems, guestItems)
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

  const add = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item])
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value: CartContextValue = {
    items,
    add,
    remove,
    clearCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return ctx
}
