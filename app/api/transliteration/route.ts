import { NextRequest, NextResponse } from "next/server"

const GOOGLE_INPUT_TOOLS_URL = "https://inputtools.google.com/request"

const ITC_BY_LANGUAGE = {
  hindi: "hi-t-i0-und",
  marathi: "mr-t-i0-und",
} as const

type SupportedTransliterationLanguage = keyof typeof ITC_BY_LANGUAGE

function toSupportedLanguage(value: string | null): SupportedTransliterationLanguage | null {
  if (!value) return null
  if (value === "hindi" || value === "marathi") return value
  return null
}

function parseSuggestions(payload: unknown): string[] {
  if (!Array.isArray(payload)) return []
  if (payload[0] !== "SUCCESS") return []
  const chunks = payload[1]
  if (!Array.isArray(chunks) || chunks.length === 0 || !Array.isArray(chunks[0])) return []
  const first = chunks[0] as unknown[]
  const values = first[1]
  if (!Array.isArray(values)) return []
  return values.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
}

export async function GET(req: NextRequest) {
  const word = (req.nextUrl.searchParams.get("word") || "").trim()
  const language = toSupportedLanguage(req.nextUrl.searchParams.get("language"))

  if (!language || word.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiUrl = new URL(GOOGLE_INPUT_TOOLS_URL)
  apiUrl.searchParams.set("text", word)
  apiUrl.searchParams.set("itc", ITC_BY_LANGUAGE[language])
  apiUrl.searchParams.set("num", "5")

  try {
    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      cache: "no-store",
    })
    if (!response.ok) return NextResponse.json({ suggestions: [] })
    const data = (await response.json()) as unknown
    const suggestions = parseSuggestions(data).slice(0, 5)
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
