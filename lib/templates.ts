/**
 * Single source of truth for template metadata.
 * Used by the templates listing page and the editor.
 */

export interface Template {
  id: string
  name: string
  category: string
  language: TemplateLanguage
  price: number
  colors: [string, string]
  emoji: string
  svg: string
  thumbnail: string
  theme?: string
  culture?: string
}

export type TemplateLanguage = "english" | "hindi" | "marathi"

export const allTemplates: Template[] = [
  { id: "2", name: "Wedding Elegance", category: "Wedding", language: "english", price: 0, colors: ["#FDF2F8", "#EC4899"], emoji: "💒", svg: "/assets/cards/greeting-card-2.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-2.png", theme: "Palace", culture: "Hindu" },
  { id: "3", name: "Thank You Blooms", category: "Naming ceremony", language: "english", price: 79, colors: ["#DCFCE7", "#22C55E"], emoji: "💐", svg: "/assets/cards/greeting-card-3.svg", thumbnail: "", theme: "Floral", culture: "Christian" },
  { id: "4", name: "Holiday Cheer", category: "House warming", language: "english", price: 99, colors: ["#FEE2E2", "#EF4444"], emoji: "🎄", svg: "/assets/cards/greeting-card-4.svg", thumbnail: "", theme: "Floral", culture: "Christian" },
  { id: "5", name: "Corporate Thanks", category: "Wedding", language: "english", price: 129, colors: ["#DBEAFE", "#3B82F6"], emoji: "🤝", svg: "/assets/cards/greeting-card-5.svg", thumbnail: "", theme: "Palace", culture: "Sikh" },
  { id: "6", name: "Baby Shower", category: "Baby shower", language: "english", price: 89, colors: ["#E0E7FF", "#6366F1"], emoji: "👶", svg: "/assets/cards/greeting-card-6.svg", thumbnail: "", theme: "Floral", culture: "Buddhist" },
  { id: "7", name: "Romantic Anniversary", category: "Wedding", language: "english", price: 119, colors: ["#FECDD3", "#F43F5E"], emoji: "💕", svg: "/assets/cards/greeting-card-7.svg", thumbnail: "", theme: "Palace", culture: "Maharastrian" },
  { id: "8", name: "Graduation Day", category: "Naming ceremony", language: "english", price: 99, colors: ["#FEF3C7", "#D97706"], emoji: "🎓", svg: "/assets/cards/greeting-card-8.svg", thumbnail: "", theme: "Floral", culture: "Gujrati" },
  { id: "9", name: "New Year Wishes", category: "Wedding", language: "english", price: 89, colors: ["#E0F2FE", "#0284C7"], emoji: "🎉", svg: "/assets/cards/greeting-card-9.svg", thumbnail: "", theme: "Palace", culture: "Bengali" },
  { id: "10", name: "Professional Note", category: "House warming", language: "english", price: 109, colors: ["#F1F5F9", "#475569"], emoji: "📝", svg: "/assets/cards/greeting-card-10.svg", thumbnail: "", theme: "Floral", culture: "Muslim" },
  { id: "11", name: "Wedding Invitation Peacock", category: "Wedding", language: "english", price: 99, colors: ["#FCE7F3", "#DB2777"], emoji: "🌸", svg: "/assets/cards/greeting-card-11.svg", thumbnail: "", theme: "Peacock", culture: "Hindu" },
  { id: "12", name: "Winter Wonderland", category: "Naming ceremony", language: "hindi", price: 99, colors: ["#F0F9FF", "#38BDF8"], emoji: "❄️", svg: "/assets/cards/greeting-card-12.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-12.png", theme: "Palace", culture: "Hindu" },
  { id: "13", name: "First Birthday", category: "Birthday", language: "hindi", price: 99, colors: ["#F0F9FF", "#38BDF8"], emoji: "❄️", svg: "/assets/cards/greeting-card-13.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-13.png", theme: "Floral", culture: "Hindu" },
  { id: "14", name: "First Birthday Wild", category: "Birthday", language: "english", price: 99, colors: ["#F0F9FF", "#38BDF8"], emoji: "❄️", svg: "/assets/cards/greeting-card-14.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-14.png", theme: "Palace", culture: "Hindu" },
]

const byId = new Map(allTemplates.map((t) => [t.id, t]))

export function getTemplateById(id: string): Template | undefined {
  return byId.get(id)
}
