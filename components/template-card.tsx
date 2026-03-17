"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useWishlist } from "@/contexts/wishlist-context"
import { Heart } from "lucide-react"

interface Template {
  id: string
  name: string
  category: string
  price: number
  colors: [string, string]
  emoji: string
  svg?: string
}

interface TemplateCardProps {
  template: Template
}

export function TemplateCard({ template }: TemplateCardProps) {
  const { add, remove, isInWishlist } = useWishlist()
  const isFavorite = isInWishlist(template.id)

  const toggleFavorite = () => {
    if (isFavorite) {
      remove(template.id)
    } else {
      add(template)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Card with Frame Effect */}
      <div className="relative mb-4">
        {/* Back frame (envelope effect) */}
        <div className="absolute -right-3 top-3 h-[280px] w-[220px] rounded-lg bg-[#c9c9c9] shadow-md" />
        
        {/* Main card */}
        <div
          className="relative z-10 flex h-[280px] w-[220px] -rotate-3 transform items-center justify-center overflow-hidden rounded-lg shadow-lg transition-transform hover:-rotate-1"
          style={{
            background: template.colors
              ? `linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%)`
              : "linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)",
          }}
        >
          {template.svg ? (
            <img
              src={template.svg}
              alt={template.name}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <>
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="absolute -bottom-4 -left-4 h-16 w-16 rotate-45 bg-[#8B4513] opacity-80" />
                <div className="absolute -right-4 -top-4 h-20 w-20 rotate-12 bg-[#b8860b] opacity-70" />
                <div className="absolute -bottom-2 right-4 h-12 w-12 rotate-45 bg-[#c41e3a] opacity-70" />
                <div className="absolute left-4 top-8 h-8 w-8 rotate-45 bg-[#228b22] opacity-60" />
              </div>
              <div className="relative z-10 text-center">
                <p className="font-serif text-3xl font-bold leading-tight text-white">thank</p>
                <p className="font-serif text-4xl font-bold leading-tight text-white">you!</p>
                <p className="mt-1 font-serif text-sm italic text-[#E8733A]">so much</p>
              </div>
            </>
          )}
        </div>

        {/* Price badge */}
        <div className="absolute -bottom-2 left-0 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8733A] text-sm font-bold text-white shadow-md">
          ₹{template.price}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          asChild 
          className="h-10 w-32 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href={`/editor/${template.id}`}>Buy</Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-lg border-primary ${isFavorite ? 'bg-primary text-primary-foreground' : 'text-primary'}`}
          onClick={toggleFavorite}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
