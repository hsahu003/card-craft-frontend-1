"use client"

import { useState } from "react"
import { TemplateCard } from "@/components/template-card-v2"
import { allTemplates } from "@/lib/templates"
import { ChevronLeft, ChevronRight } from "lucide-react"

const ITEMS_PER_PAGE = 8

export function AllTemplates() {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(allTemplates.length / ITEMS_PER_PAGE)
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTemplates = allTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            All Templates
          </h2>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-8">
          {paginatedTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center justify-center rounded-full p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center rounded-full p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
