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
  { id: "6", name: "6th Birthday", category: "Birthday", language: "english", price: 0, colors: ["#E0E7FF", "#6366F1"], emoji: "👶", svg: "/assets/cards/greeting-card-6.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-6.png", theme: "Floral", culture: "Buddhist" },
  { id: "9", name: "Happy Birthday Awesome", category: "Birthday", language: "english", price: 0, colors: ["#E0F2FE", "#0284C7"], emoji: "🎉", svg: "/assets/cards/greeting-card-9.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-9.png", theme: "Palace", culture: "Bengali" },
  { id: "12", name: "Summer Wedding Invitation", category: "Wedding", language: "hindi", price: 0, colors: ["#F0F9FF", "#38BDF8"], emoji: "❄️", svg: "/assets/cards/greeting-card-12.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-12.png", theme: "Palace", culture: "Hindu" },
  { id: "14", name: "First Birthday Wild", category: "Birthday", language: "english", price: 0, colors: ["#F0F9FF", "#38BDF8"], emoji: "❄️", svg: "/assets/cards/greeting-card-14.svg", thumbnail: "/assets/cards/thumbnails/greeting-card-14.png", theme: "Palace", culture: "Hindu" },
]

const byId = new Map(allTemplates.map((t) => [t.id, t]))

export function getTemplateById(id: string): Template | undefined {
  return byId.get(id)
}
