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
import type { CartItem } from "@/contexts/cart-context"
import { useUser } from "@/contexts/user-context"
import { getStorageKey } from "@/lib/user-storage-key"

const ORDERS_STORAGE_KEY = "cardcraft-orders"

export interface Order {
  id: string
  date: string
  items: CartItem[]
  total: number
}

interface OrdersContextValue {
  orders: Order[]
  addOrder: (items: CartItem[], total: number) => void
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

function loadFromStorage(key: string): Order[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Order[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(orders: Order[], key: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(orders))
  } catch {
    // ignore
  }
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { profile, isReady } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const prevKeyRef = useRef<string | null>(null)

  const currentKey = getStorageKey(ORDERS_STORAGE_KEY, profile)

  useEffect(() => {
    if (!isReady) return

    const prevKey = prevKeyRef.current

    if (prevKey !== null && prevKey !== currentKey) {
      saveToStorage(orders, prevKey)
      setOrders(loadFromStorage(currentKey))
    } else if (prevKey === null) {
      setOrders(loadFromStorage(currentKey))
    }

    prevKeyRef.current = currentKey
  }, [isReady, currentKey])

  useEffect(() => {
    if (!isReady) return
    saveToStorage(orders, currentKey)
  }, [isReady, currentKey, orders])

  const addOrder = useCallback((items: CartItem[], total: number) => {
    const order: Order = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...items],
      total,
    }
    setOrders((prev) => [order, ...prev])
  }, [])

  const value: OrdersContextValue = {
    orders,
    addOrder,
  }

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext)
  if (!ctx) {
    throw new Error("useOrders must be used within an OrdersProvider")
  }
  return ctx
}
