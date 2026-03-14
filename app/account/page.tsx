"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrders } from "@/contexts/orders-context"
import { useUser } from "@/contexts/user-context"
import { Package, User, CheckCircle, LogOut } from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { orders } = useOrders()
  const { profile, isReady, updateProfile, logout } = useUser()
  const [fullName, setFullName] = useState(profile?.fullName ?? "")
  const [email, setEmail] = useState(profile?.email ?? "")
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    if (isReady && !profile) {
      router.replace("/login")
    }
  }, [isReady, profile, router])

  useEffect(() => {
    setFullName(profile?.fullName ?? "")
    setEmail(profile?.email ?? "")
  }, [profile])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ fullName, email })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!isReady || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Navbar />
        <p className="text-muted-foreground">
          {!isReady ? "Loading..." : "Redirecting to login..."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              My Account
            </h1>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Section 1: Purchase history */}
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Package className="h-5 w-5" />
              Purchase history
            </h2>
            {orders.length === 0 ? (
              <div className="mt-4 rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No orders yet.</p>
                <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/templates">Browse Templates</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          Order #{order.id.replace("order-", "").slice(-8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ₹{order.total}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.name} – ₹{item.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: User profile */}
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <User className="h-5 w-5" />
              Profile
            </h2>
            <form
              onSubmit={handleProfileSubmit}
              className="mt-4 rounded-xl border border-border bg-card p-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-fullName">Full name</Label>
                  <Input
                    id="account-fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email</Label>
                  <Input
                    id="account-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              {profileSaved && (
                <p className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Profile updated.
                </p>
              )}
              <Button
                type="submit"
                className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Update profile
              </Button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
