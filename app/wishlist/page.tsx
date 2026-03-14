"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useWishlist } from "@/contexts/wishlist-context"
import { Heart, Trash2, ArrowRight } from "lucide-react"

export default function WishlistPage() {
  const { items, remove } = useWishlist()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Wishlist
          </h1>

          {items.length > 0 ? (
            <div className="mt-8 space-y-4">
              {items.map((item) => (
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
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold text-foreground">
                      ₹{item.price}
                    </p>
                    <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link href={`/editor/${item.id}`}>
                        Buy
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(item.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-16 text-center">
              <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                Your wishlist is empty
              </h2>
              <p className="mt-2 text-muted-foreground">
                Save templates you like by clicking the heart on any card.
              </p>
              <Button
                asChild
                className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/templates">Browse Templates</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
