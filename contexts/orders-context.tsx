"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { CartItem } from "@/contexts/cart-context"

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

function loadFromStorage(): Order[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Order[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(orders: Order[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // ignore
  }
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    setOrders(loadFromStorage())
  }, [])

  useEffect(() => {
    saveToStorage(orders)
  }, [orders])

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
