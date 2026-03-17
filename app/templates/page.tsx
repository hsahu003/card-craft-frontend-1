"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TemplateCard } from "@/components/template-card"
import { Button } from "@/components/ui/button"
import { allTemplates } from "@/lib/templates"

const categories = ["All", "Birthday", "Wedding", "Thank You", "Holiday", "Corporate"]

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("All")

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      const matchesCategory = activeCategory === "All" || template.category === activeCategory
      return matchesCategory
    })
  }, [activeCategory])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Category Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
              >
                {category}
              </Button>
            ))}
          </div>
  
          {/* Templates Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
  
          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="mt-12 text-center">
              <p className="text-lg text-muted-foreground">
                No templates found. Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
