"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/contexts/cart-context"
import { Shield, Download, CheckCircle, Tag } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const { items: cartItems } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (cartItems.length === 0) {
      router.replace("/cart")
    }
  }, [cartItems.length, router])

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0)
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0
  const total = subtotal - discount

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "save10") {
      setPromoApplied(true)
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push("/confirmation")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Left Column - Order Summary */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>

                {/* Cart Items */}
                <div className="mt-4 space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div
                        className="flex h-24 w-20 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${item.colors[0]} 0%, ${item.colors[1]} 100%)`,
                        }}
                      >
                        <span className="text-3xl">{item.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{item.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          &quot;{item.customMessage}&quot;
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-foreground shrink-0">₹{item.price}</p>
                    </div>
                  ))}
                </div>

                {/* Promo Code */}
                <div className="mt-6 border-t border-border pt-4">
                  <Label htmlFor="promo" className="text-sm font-medium">
                    Promo Code
                  </Label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="promo"
                        placeholder="Enter code"
                        className="pl-10"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={promoApplied}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={promoApplied || !promoCode}
                    >
                      Apply
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      10% discount applied!
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{subtotal}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="text-green-600">-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">₹{total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Form */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Payment Details</h2>

                <form
                  className="mt-4 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handlePayment()
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isProcessing || !fullName || !email}
                  >
                    {isProcessing ? "Processing..." : `Pay Now - ₹${total}`}
                  </Button>
                </form>

                {/* Trust Badges */}
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="mt-1 text-xs text-muted-foreground">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Download className="h-6 w-6 text-primary" />
                    <span className="mt-1 text-xs text-muted-foreground">Instant Download</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <span className="mt-1 text-xs text-muted-foreground">100% Satisfaction</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                By completing your purchase, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
