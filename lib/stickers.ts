export interface StickerItem {
  name: string
  path: string
}

export interface StickerCategory {
  name: string
  stickers: StickerItem[]
}

// Global default category for sticker picker.
// Change this value to configure which category is preselected.
export const DEFAULT_STICKER_CATEGORY = "emojis"
