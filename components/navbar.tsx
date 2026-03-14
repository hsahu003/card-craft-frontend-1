"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useWishlist } from "@/contexts/wishlist-context"
import { Menu, X, ShoppingCart, Heart, User, Search, Gift, HandHeart, Gem, HeartHandshake, PartyPopper, Flame, TreePine } from "lucide-react"

const categories = [
  { name: "Birthday Cards", icon: Gift, href: "/templates?category=birthday" },
  { name: "Thank You Cards", icon: HandHeart, href: "/templates?category=thank-you" },
  { name: "Wedding Cards", icon: Gem, href: "/templates?category=wedding" },
  { name: "Anniversary Cards", icon: HeartHandshake, href: "/templates?category=anniversary" },
  { name: "Festival Cards", icon: PartyPopper, href: "/templates?category=festival" },
  { name: "Diwali Cards", icon: Flame, href: "/templates?category=diwali" },
  { name: "Christmas Cards", icon: TreePine, href: "/templates?category=christmas" },
]

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { items: wishlistItems } = useWishlist()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.svg"
            alt="CardCraft"
            width={130}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex w-full max-w-md items-center">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-l-md border border-r-0 border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
            />
            <button
              className="flex h-10 items-center justify-center rounded-r-md bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Actions - Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/templates">Sample Button</Link>
          </Button>

          <Link
            href="/wishlist"
            className="relative p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <Link href="/cart" className="p-2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
          </Link>

          <Link href="/login" className="p-2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="flex flex-col gap-4 px-4 py-4">
            {/* Mobile Search */}
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-l-md border border-r-0 border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                className="flex h-10 items-center justify-center rounded-r-md bg-primary px-4 text-primary-foreground"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <Link
              href="/templates"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Templates
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/wishlist"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <Heart className="h-4 w-4" />
              Wishlist
              {wishlistItems.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Login
            </Link>
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/templates">Sample Button</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div className="hidden border-t border-border bg-card md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group flex flex-col items-center gap-1 text-primary transition-colors hover:text-accent"
            >
              <category.icon className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
