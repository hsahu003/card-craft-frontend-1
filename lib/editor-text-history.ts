import type { ImageZoneState } from "@/lib/editor-types"

/** Max undo steps (each entry stores full SVG + zoneStates). */
export const MAX_EDITOR_HISTORY = 25

export type EditorHistoryEntry = {
  svg: string
  zoneStates: Record<string, ImageZoneState>
}

export function cloneZoneStates(zoneStates: Record<string, ImageZoneState>): Record<string, ImageZoneState> {
  return JSON.parse(JSON.stringify(zoneStates)) as Record<string, ImageZoneState>
}
