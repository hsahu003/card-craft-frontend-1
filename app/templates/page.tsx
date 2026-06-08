"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TemplateCard } from "@/components/template-card-v2"
import { allTemplates } from "@/lib/templates"

function TemplatesContent() {
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category") || "Wedding" // default to Wedding as seen in mock

  // Sidebar checked states
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedCultures, setSelectedCultures] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const handleThemeToggle = (theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    )
  }

  const handleCultureToggle = (culture: string) => {
    setSelectedCultures((prev) =>
      prev.includes(culture)
        ? prev.filter((c) => c !== culture)
        : [...prev, culture]
    )
  }

  const handleLanguageToggle = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      // Occasion category match
      const matchesCategory =
        activeCategory === "All" ||
        template.category.toLowerCase() === activeCategory.toLowerCase()
      if (!matchesCategory) return false

      // Theme match (if any is selected, template theme must match one of them)
      const matchesTheme =
        selectedThemes.length === 0 ||
        (template.theme && selectedThemes.includes(template.theme))
      if (!matchesTheme) return false

      // Culture match (if any is selected, template culture must match one of them)
      const matchesCulture =
        selectedCultures.length === 0 ||
        (template.culture && selectedCultures.includes(template.culture))
      if (!matchesCulture) return false

      // Language match (if any is selected, template language must match one of them)
      const matchesLanguage =
        selectedLanguages.length === 0 ||
        (template.language && selectedLanguages.includes(template.language.toLowerCase()))
      if (!matchesLanguage) return false

      return true
    })
  }, [activeCategory, selectedThemes, selectedCultures, selectedLanguages])

  const renderFilterSidebar = () => {
    return (
      <div className="flex flex-col gap-6">
        {/* Themes Group */}
        <div>
          <span className="font-bold text-zinc-900 text-sm mb-4 block uppercase tracking-wider">
            Themes
          </span>
          <div className="flex flex-col gap-2">
            {["Floral", "Palace", "Peacock"].map((theme) => {
              const isChecked = selectedThemes.includes(theme)
              return (
                <label key={theme} className="flex items-center gap-3 py-1 text-sm font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleThemeToggle(theme)}
                    className="h-5 w-5 rounded border-[#C5C5C5] text-zinc-950 focus:ring-zinc-950 accent-zinc-950 cursor-pointer"
                  />
                  <span>{theme}</span>
                </label>
              )
            })}
          </div>
        </div>

        <hr className="border-zinc-300" />

        {/* Culture/Religion Group */}
        <div>
          <span className="font-bold text-zinc-900 text-sm mb-4 block uppercase tracking-wider">
            Culture/Religion
          </span>
          <div className="flex flex-col gap-2">
            {[
              "Hindu",
              "Muslim",
              "Sikh",
              "Christian",
              "Buddhist",
              "Maharastrian",
              "Gujrati",
              "Bengali"
            ].map((culture) => {
              const isChecked = selectedCultures.includes(culture)
              return (
                <label key={culture} className="flex items-center gap-3 py-1 text-sm font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCultureToggle(culture)}
                    className="h-5 w-5 rounded border-[#C5C5C5] text-zinc-950 focus:ring-zinc-950 accent-zinc-950 cursor-pointer"
                  />
                  <span>{culture}</span>
                </label>
              )
            })}
          </div>
        </div>

        <hr className="border-zinc-300" />

        {/* Language Group */}
        <div>
          <span className="font-bold text-zinc-900 text-sm mb-4 block uppercase tracking-wider">
            Language
          </span>
          <div className="flex flex-col gap-2">
            {["Hindi", "English", "Marathi"].map((lang) => {
              const isChecked = selectedLanguages.includes(lang.toLowerCase())
              return (
                <label key={lang} className="flex items-center gap-3 py-1 text-sm font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleLanguageToggle(lang.toLowerCase())}
                    className="h-5 w-5 rounded border-[#C5C5C5] text-zinc-950 focus:ring-zinc-950 accent-zinc-950 cursor-pointer"
                  />
                  <span>{lang}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const activeFiltersCount = selectedThemes.length + selectedCultures.length + selectedLanguages.length

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto px-4 md:px-0">
          <div className="flex">
            {/* Desktop Sidebar Filter (styled exactly as mock layout, on the right) */}
            <aside className="hidden md:block w-64 bg-[#EDEDED] border-l border-[#E5E7EB] -mr-4 sm:-mr-6 lg:-mr-8 pl-6 pr-4 sm:pr-6 lg:pr-8 py-8 shrink-0 min-h-[calc(100vh-7rem)]">
              {renderFilterSidebar()}
            </aside>
            {/* Main content grid area */}
            <div className="flex-1 py-8 md:pr-8 lg:px-20">
              {/* Mobile Filter Toggle Button */}
              <div className="md:hidden flex items-center justify-between mb-4 bg-[#F3F4F6] p-3 rounded-lg border border-[#E5E7EB]">
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex items-center gap-2 bg-zinc-950 text-white rounded-full px-5 py-2 text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setSelectedThemes([])
                      setSelectedCultures([])
                      setSelectedLanguages([])
                    }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>

              {/* Empty State */}
              {filteredTemplates.length === 0 && (
                <div className="mt-12 text-center py-8 bg-white border border-[#E5E7EB] rounded-xl shadow-sm px-4">
                  <p className="text-lg font-semibold text-zinc-900">
                    No templates match your filters
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try clearing some checkboxes or choosing a different occasion.
                  </p>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => {
                        setSelectedThemes([])
                        setSelectedCultures([])
                        setSelectedLanguages([])
                      }}
                      className="mt-4 bg-zinc-950 text-white rounded-full px-6 py-2 text-xs font-semibold hover:bg-zinc-800 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Drawer Slide-over Filter Panel */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-200">
          <div className="w-80 h-full bg-white px-6 py-6 overflow-y-auto flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-900">Filters</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="text-zinc-500 hover:text-zinc-800 text-sm font-semibold p-1"
                >
                  Close
                </button>
              </div>
              {renderFilterSidebar()}
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-zinc-950 text-white py-3 rounded-md font-semibold text-center mt-8 hover:bg-zinc-800 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    }>
      <TemplatesContent />
    </Suspense>
  )
}
