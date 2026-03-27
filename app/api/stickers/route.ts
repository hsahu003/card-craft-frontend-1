import { NextResponse } from "next/server"
import { readdir } from "node:fs/promises"
import path from "node:path"
import { DEFAULT_STICKER_CATEGORY, type StickerCategory } from "@/lib/stickers"

async function readStickerCategoriesFromPublic(): Promise<StickerCategory[]> {
  const stickersRoot = path.join(process.cwd(), "public", "assets", "stickers")
  const categoryDirents = await readdir(stickersRoot, { withFileTypes: true })
  const categories: StickerCategory[] = []

  for (const dirent of categoryDirents) {
    if (!dirent.isDirectory()) continue
    const categoryName = dirent.name
    const categoryPath = path.join(stickersRoot, categoryName)
    const stickerDirents = await readdir(categoryPath, { withFileTypes: true })
    const stickers = stickerDirents
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".svg"))
      .map((d) => ({
        name: d.name,
        path: `/assets/stickers/${categoryName}/${d.name}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    if (stickers.length > 0) {
      categories.push({ name: categoryName, stickers })
    }
  }

  categories.sort((a, b) => a.name.localeCompare(b.name))
  return categories
}

export async function GET() {
  try {
    const categories = await readStickerCategoriesFromPublic()
    const selectedDefault =
      categories.find((c) => c.name === DEFAULT_STICKER_CATEGORY)?.name || categories[0]?.name || ""

    return NextResponse.json({
      defaultCategory: selectedDefault,
      categories,
    })
  } catch {
    return NextResponse.json({
      defaultCategory: "",
      categories: [],
    })
  }
}
