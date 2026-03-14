"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react"

export default function CartPage() {
  const { items: cartItems, remove: removeItem } = useCart()

  const total = cartItems.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Shopping Cart</h1>

          {cartItems.length > 0 ? (
            <>
              <div className="mt-8 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                  >
                    {/* Preview */}
                    <div
                      className="flex h-20 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${item.colors[0]} 0%, ${item.colors[1]} 100%)`,
                      }}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        &quot;{item.customMessage}&quot;
                      </p>
                    </div>

                    {/* Price & Actions */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">₹{item.price}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-8 rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground">₹{total}</span>
                </div>
                <Button asChild className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            /* Empty Cart */
            <div className="mt-16 text-center">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">Your cart is empty</h2>
              <p className="mt-2 text-muted-foreground">
                Looks like you haven&apos;t added any cards yet.
              </p>
              <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/templates">Browse Templates</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
