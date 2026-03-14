import { TemplateCard } from "@/components/template-card"

const popularTemplates = [
  {
    id: "1",
    name: "Birthday Celebration",
    category: "Birthday",
    price: 99,
    colors: ["#FDE68A", "#F59E0B"],
    emoji: "🎂",
  },
  {
    id: "2",
    name: "Wedding Elegance",
    category: "Wedding",
    price: 149,
    colors: ["#FDF2F8", "#EC4899"],
    emoji: "💒",
  },
  {
    id: "3",
    name: "Thank You Blooms",
    category: "Thank You",
    price: 79,
    colors: ["#DCFCE7", "#22C55E"],
    emoji: "💐",
  },
  {
    id: "4",
    name: "Holiday Cheer",
    category: "Holiday",
    price: 99,
    colors: ["#FEE2E2", "#EF4444"],
    emoji: "🎄",
  },
  {
    id: "5",
    name: "Corporate Thanks",
    category: "Corporate",
    price: 129,
    colors: ["#DBEAFE", "#3B82F6"],
    emoji: "🤝",
  },
  {
    id: "6",
    name: "Baby Shower",
    category: "Birthday",
    price: 89,
    colors: ["#E0E7FF", "#6366F1"],
    emoji: "👶",
  },
]

export function PopularTemplates() {
  return (
    <section className="bg-muted py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {popularTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </section>
  )
}
