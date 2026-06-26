"use client"

import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Check } from "lucide-react"
import { Suspense } from "react"
import { Button } from "./ui/button"

import { allTemplates } from "@/lib/templates"

const ALL_CATEGORIES = [
  "Wedding",
  "Birthday",
  "Naming ceremony",
  "Baby shower",
  "House warming"
]

const categories = ALL_CATEGORIES.filter(category =>
  allTemplates.some(template => template.category.toLowerCase() === category.toLowerCase())
)

function NavbarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useUser()

  const accountHref = profile ? "/account" : "/login"
  const buttonText = profile ? "Account" : "Log in"

  const isTemplatesPage = pathname === "/templates"

  // Active category is from search params, default to "Wedding" only on templates page.
  const activeCategory = searchParams.get("category") || (isTemplatesPage ? "Wedding" : "")

  const handleCategoryClick = (category: string) => {
    router.push(`/templates?category=${encodeURIComponent(category)}`)
  }

  return (
    <header className="w-full bg-white z-50 sticky top-0">
      {/* Top Row */}
      <div className="border-b border-[#E5E7EB]">
        <div className="mx-5 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className="text-[28px] font-black italic text-[#E13B30] tracking-tight font-sans select-none">
              Cardcraft
            </span>
          </Link>

          {/* Action Button */}
          <Link
            href={accountHref}
            className="bg-[#E5E7EB] hover:bg-[#D1D5DB] text-zinc-800 rounded-full px-5 py-3 text-sm font-inter font-medium tracking-wide transition-all duration-200 text-lg"
          >
            {buttonText}
          </Link>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-12 items-stretch">
          {/* Filters Header Tab for templates page on the extreme right */}
          {isTemplatesPage && (
            <div className="hidden md:flex w-64 items-center justify-center bg-[#EDEDED] border-l border-[#E5E7EB] shrink-0 font-semibold text-sm text-zinc-900 select-none">
              Filters
            </div>
          )}

          {/* Occasions Side Tab */}
          <div className="relative z-10 flex items-center justify-center bg-[#F3F4F6] px-6 border-r border-[#E5E7EB] shrink-0 font-inter font-semibold text-sm text-zinc-900 select-none shadow-[4px_0_8px_-3px_rgba(0,0,0,0.08)]">
            Occasions
          </div>

          {/* Horizontal scroll of Category pills */}
          <div className="flex-1 bg-[#f9fafb] overflow-x-auto scrollbar-none py-1.5 pl-4 sm:pl-6 flex items-center">
            <div className="flex items-center gap-3 flex-nowrap">
              {categories.map((category) => {
                const isActive = activeCategory.toLowerCase() === category.toLowerCase()
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`flex items-center gap-1.5 px-5 py-2 text-sm font-inter font-normal tracking-wide transition-all duration-200 shrink-0 cursor-pointer ${isActive
                      ? "rounded-full bg-zinc-950 text-white shadow-sm font-semibold"
                      : "rounded-sm bg-[#E5E7EB] hover:bg-[#D1D5DB] text-zinc-800"
                      }`}
                  >
                    {isActive && <Check className="h-4 w-4 stroke-[3px]" />}
                    {category}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}

function NavbarSkeleton() {
  const pathname = usePathname()
  const isTemplatesPage = pathname === "/templates"

  return (
    <header className="w-full bg-white z-50 sticky top-0">
      {/* Top Row */}
      <div className="border-b border-[#E5E7EB]">
        <div className="mx-5 flex h-16 items-center justify-between">
          <span className="text-[28px] font-black italic text-[#E13B30] tracking-tight font-sans select-none">
            Cardcraft
          </span>
          <div className="bg-[#E5E7EB] text-zinc-800 rounded-full px-5 py-1.5 text-xs font-semibold tracking-wide">
            Log in
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="flex h-12 items-stretch">
          <div className="flex items-center justify-center bg-[#F3F4F6] px-6 border-r border-[#E5E7EB] shrink-0 font-semibold text-sm text-zinc-900 select-none">
            Occasions
          </div>
          <div className="flex-1 overflow-x-auto scrollbar-none py-1.5 pl-4 sm:pl-6 flex items-center">
            <div className="flex items-center gap-3 flex-nowrap">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-semibold tracking-wide transition-all duration-200 shrink-0 cursor-pointer"
                >
                  {category}
                </div>
              ))}
            </div>
          </div>

          {/* Filters Header Tab for templates page on the extreme right */}
          {isTemplatesPage && (
            <div className="hidden md:flex w-64 items-center justify-center bg-[#EDEDED] border-l border-[#E5E7EB] shrink-0 font-semibold text-sm text-zinc-900 -mr-4 sm:-mr-6 lg:-mr-8 select-none">
              Filters
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function Navbar() {
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <NavbarContent />
    </Suspense>
  )
}
