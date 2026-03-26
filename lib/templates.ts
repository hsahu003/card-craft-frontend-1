/**
 * Single source of truth for template metadata.
 * Used by the templates listing page and the editor.
 */

export interface Template {
  id: string
  name: string
  category: string
  price: number
  colors: [string, string]
  emoji: string
  svg: string
}

export const allTemplates: Template[] = [
  { id: "1", name: "Birthday Celebration", category: "Birthday", price: 99, colors: ["#FDE68A", "#F59E0B"], emoji: "🎂", svg: "/assets/cards/greeting-card.svg" },
  { id: "2", name: "Wedding Elegance", category: "Wedding", price: 149, colors: ["#FDF2F8", "#EC4899"], emoji: "💒", svg: "/assets/cards/greeting-card-2.svg" },
  { id: "3", name: "Thank You Blooms", category: "Thank You", price: 79, colors: ["#DCFCE7", "#22C55E"], emoji: "💐", svg: "/assets/cards/greeting-card-3.svg" },
  { id: "4", name: "Holiday Cheer", category: "Holiday", price: 99, colors: ["#FEE2E2", "#EF4444"], emoji: "🎄", svg: "/assets/cards/greeting-card-4.svg" },
  { id: "5", name: "Corporate Thanks", category: "Corporate", price: 129, colors: ["#DBEAFE", "#3B82F6"], emoji: "🤝", svg: "/assets/cards/greeting-card-5.svg" },
  { id: "6", name: "Baby Shower", category: "Birthday", price: 89, colors: ["#E0E7FF", "#6366F1"], emoji: "👶", svg: "/assets/cards/greeting-card-6.svg" },
  { id: "7", name: "Romantic Anniversary", category: "Wedding", price: 119, colors: ["#FECDD3", "#F43F5E"], emoji: "💕", svg: "/assets/cards/greeting-card-7.svg" },
  { id: "8", name: "Graduation Day", category: "Birthday", price: 99, colors: ["#FEF3C7", "#D97706"], emoji: "🎓", svg: "/assets/cards/greeting-card-8.svg" },
  { id: "9", name: "New Year Wishes", category: "Holiday", price: 89, colors: ["#E0F2FE", "#0284C7"], emoji: "🎉", svg: "/assets/cards/greeting-card-9.svg" },
  { id: "10", name: "Professional Note", category: "Corporate", price: 109, colors: ["#F1F5F9", "#475569"], emoji: "📝", svg: "/assets/cards/greeting-card-10.svg" },
  { id: "11", name: "Mother's Day Love", category: "Thank You", price: 99, colors: ["#FCE7F3", "#DB2777"], emoji: "🌸", svg: "/assets/cards/greeting-card.svg" },
  { id: "12", name: "Winter Wonderland", category: "Holiday", price: 99, colors: ["#F0F9FF", "#38BDF8"], emoji: "❄️", svg: "/assets/cards/greeting-card.svg" },
]

const byId = new Map(allTemplates.map((t) => [t.id, t]))

export function getTemplateById(id: string): Template | undefined {
  return byId.get(id)
}
