"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TemplateCard } from "@/components/template-card"
import { Button } from "@/components/ui/button"

const categories = ["All", "Birthday", "Wedding", "Thank You", "Holiday", "Corporate"]

const allTemplates = [
  { id: "1", name: "Birthday Celebration", category: "Birthday", price: 99, colors: ["#FDE68A", "#F59E0B"] as [string, string], emoji: "🎂" },
  { id: "2", name: "Wedding Elegance", category: "Wedding", price: 149, colors: ["#FDF2F8", "#EC4899"] as [string, string], emoji: "💒" },
  { id: "3", name: "Thank You Blooms", category: "Thank You", price: 79, colors: ["#DCFCE7", "#22C55E"] as [string, string], emoji: "💐" },
  { id: "4", name: "Holiday Cheer", category: "Holiday", price: 99, colors: ["#FEE2E2", "#EF4444"] as [string, string], emoji: "🎄" },
  { id: "5", name: "Corporate Thanks", category: "Corporate", price: 129, colors: ["#DBEAFE", "#3B82F6"] as [string, string], emoji: "🤝" },
  { id: "6", name: "Baby Shower", category: "Birthday", price: 89, colors: ["#E0E7FF", "#6366F1"] as [string, string], emoji: "👶" },
  { id: "7", name: "Romantic Anniversary", category: "Wedding", price: 119, colors: ["#FECDD3", "#F43F5E"] as [string, string], emoji: "💕" },
  { id: "8", name: "Graduation Day", category: "Birthday", price: 99, colors: ["#FEF3C7", "#D97706"] as [string, string], emoji: "🎓" },
  { id: "9", name: "New Year Wishes", category: "Holiday", price: 89, colors: ["#E0F2FE", "#0284C7"] as [string, string], emoji: "🎉" },
  { id: "10", name: "Professional Note", category: "Corporate", price: 109, colors: ["#F1F5F9", "#475569"] as [string, string], emoji: "📝" },
  { id: "11", name: "Mother's Day Love", category: "Thank You", price: 99, colors: ["#FCE7F3", "#DB2777"] as [string, string], emoji: "🌸" },
  { id: "12", name: "Winter Wonderland", category: "Holiday", price: 99, colors: ["#F0F9FF", "#38BDF8"] as [string, string], emoji: "❄️" },
]

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
