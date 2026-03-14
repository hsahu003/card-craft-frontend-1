"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/contexts/user-context"

const DUMMY_EMAIL = "demo@example.com"
const DUMMY_PASSWORD = "password123"

export default function LoginPage() {
  const router = useRouter()
  const { updateProfile } = useUser()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validCredentials = email === DUMMY_EMAIL && password === DUMMY_PASSWORD
    if (!validCredentials) {
      setError("Invalid email or password. Use demo@example.com / password123")
      return
    }

    const fullName = isLogin ? "Demo User" : (name.trim() || "Demo User")
    updateProfile({ fullName, email })
    router.push("/account")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8">
            {/* Title */}
            <h1 className="mt-6 text-center text-2xl font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {isLogin
                ? "Sign in to access your cards and purchases"
                : "Start creating beautiful greeting cards today"}
            </p>

            {/* Form */}
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {isLogin ? (
                <>
                  <div className="space-y-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="py-6"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-6"
                      required
                    />
                    <div className="flex justify-end">
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Input
                    id="name"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="py-6"
                    required
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="py-6"
                    required
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-6"
                    required
                  />
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>

            {/* Switch Mode */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
