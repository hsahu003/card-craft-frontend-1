"use client"

import Link from "next/link"
import { useWishlist } from "@/contexts/wishlist-context"
import type { Template } from "@/lib/templates"
import { Heart, Crown } from "lucide-react"

interface TemplateCardProps {
  template: Template
}

export function TemplateCard({ template }: TemplateCardProps) {
  const { add, remove, isInWishlist } = useWishlist()
  const isFavorite = isInWishlist(template.id)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isFavorite) {
      remove(template.id)
    } else {
      add(template)
    }
  }

  return (
    <div className="group flex flex-col w-full max-w-[360px] overflow-hidden transition-all duration-200">
      {/* Card Image/Preview Section */}
      <Link href={`/editor/${template.id}`} className="relative block w-full overflow-hidden bg-slate-100">
        {template.svg ? (
          <img
            src={template.svg}
            alt={template.name || "Template Preview"}
            className="h-full w-full transition-transform duration-300"
          />
        ) : (
          /* Fallback handling matching your legacy dynamic gradient fallback logic */
          <div
            className="flex h-full w-full items-center justify-center p-6"
            style={{
              background: template.colors
                ? `linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%)`
                : "linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)",
            }}
          >
            <div className="text-center text-white">
              <p className="font-serif text-2xl font-bold">Preview Unavailable</p>
            </div>
          </div>
        )}

        {/* HOVER OVERLAY: "Customize template" pill banner */}
        <div className="absolute inset-0 flex items-end justify-center pb-5 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="rounded-full bg-white/80 px-2 py-1 lg:px-6 lg:py-3 text-base font-normal text-slate-900 backdrop-blur-md shadow-sm border border-white/20 whitespace-nowrap">
            Customize template
          </div>
        </div>

        {/* Dynamic Badges (Price / Favorite) overlayed cleanly on preview */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {template.price > 0 ? "₹" + template.price : "Free"}
        </div>
      </Link>

      {/* Metadata Typography section mirroring rect14.png */}
      <div className="flex flex-col p-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-roboto-condensed text-lg font-medium tracking-tight text-slate-900 line-clamp-1">
            {template.name || "Wild Birthday Card"}
          </h3>
        </div>

        <p className="font-roboto mt-1 text-sm leading-relaxed text-slate-500 line-clamp-2">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  )
}