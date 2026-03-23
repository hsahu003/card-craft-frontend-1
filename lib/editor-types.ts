/** Shared editor state types (SVG image zones + history snapshots). */

export interface ImageZoneState {
  b64: string
  scale: number
  offsetX: number
  offsetY: number
  imgW: number
  imgH: number
  zoneX: number
  zoneY: number
  zoneW: number
  zoneH: number
  hasClip: boolean
  existingClipId?: string | null
}
