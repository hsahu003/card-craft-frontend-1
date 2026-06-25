"use client"

import { useState, use, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { allTemplates, getTemplateById, type TemplateLanguage } from "@/lib/templates"
import { Copy, Redo2, Trash2, Undo2, Download, Sticker, X, FlipHorizontal, ListChecks, Pencil, Type, Maximize2, MoveVertical, Loader2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import {
  getSVGSize,
  getSVGSizePx,
  getSVGSizeMm,
  getSVGElementSize,
  getTextMetrics,
  textOverlayRect,
  getClipBounds,
  applySnap,
  hideGuides,
  createGuideLine,
  cloneSvgDocument,
  rasterizeStickerSvgToPngDataUrl,
  type SnapPeerBox,
} from "@/lib/editor-svg-utils"
import type { ImageZoneState } from "@/lib/editor-types"
import type { StickerCategory, StickerItem } from "@/lib/stickers"
import {
  MAX_EDITOR_HISTORY,
  cloneZoneStates,
  type EditorHistoryEntry,
} from "@/lib/editor-text-history"
import { toast } from "sonner"


const EDITABLE_PREFIX = "editable_"
const IMAGE_ZONE_PREFIX = "image_zone_"
const STICKER_PREFIX = "sticker_"
/** Minimum sticker width/height in SVG units; enforced with uniform scale so aspect ratio is preserved. */
const MIN_STICKER_AXIS_PX = 7
// Multiplier to make image drag feel more responsive.
// 1 = geometric mapping only, >1 = faster movement.
const IMAGE_DRAG_SPEED = 1.25
const IMAGE_COMPRESS_QUALITY = 0.75
const IMAGE_COMPRESS_SKIP_BELOW_BYTES = 500 * 1024

function clampImageOffsets(
  proposedOX: number,
  proposedOY: number,
  scale: number,
  zoneW: number,
  zoneH: number,
  imgW: number,
  imgH: number
) {
  if (imgW <= 0 || imgH <= 0) return { clampedOX: 0, clampedOY: 0 }
  const sb = Math.max(zoneW / imgW, zoneH / imgH)
  const imgW2 = imgW * sb * Math.max(1, scale)
  const imgH2 = imgH * sb * Math.max(1, scale)
  const maxOX = Math.max(0, (imgW2 - zoneW) / 2)
  const maxOY = Math.max(0, (imgH2 - zoneH) / 2)
  return {
    clampedOX: Math.max(-maxOX, Math.min(maxOX, proposedOX)),
    clampedOY: Math.max(-maxOY, Math.min(maxOY, proposedOY)),
  }
}

const ROTATE_SNAP_THRESHOLD_DEG = 5
const ROTATE_SNAP_TARGETS_DEG = [0, 90, 180, 270, 360] as const
// Line spacing multiplier so line-height scales with font-size (e.g. 1.25 = 125% of font size).
const LINE_HEIGHT_RATIO = 1.25

/** Dashed overlay style for preview bounding boxes (idle / subtle / hover). */
const OVERLAY_DASH = "2 1"
const OVERLAY_OPACITY_DASH_NORMAL = 0.6
const OVERLAY_OPACITY_DASH_SUBTLE = 0.15
const OVERLAY_OPACITY_DASH_HOVER = 1

type OverlayBoundingPaintInput = {
  pointerInsidePreview: boolean
  hoveredElementId: string | null
  solidTextIds: string[]
  solidStickerIds: string[]
  solidImgId: string | null
  forceShowHint?: boolean
}

/** Stroke / dash / opacity for text, sticker, and image-zone overlay rects only. */
function paintOverlayBoundingPresentation(svg: SVGElement, input: OverlayBoundingPaintInput) {
  const solidTxt = new Set(input.solidTextIds)
  const solidStk = new Set(input.solidStickerIds)
  const hasSelection = solidTxt.size > 0 || solidStk.size > 0 || !!input.solidImgId

  const rects = Array.from(svg.querySelectorAll<SVGRectElement>("[data-text-zone],[data-sticker-zone],[data-img-zone]"))

  for (const r of rects) {
    const tid = r.getAttribute("data-text-zone")
    const sid = r.getAttribute("data-sticker-zone")
    const iid = r.getAttribute("data-img-zone")
    const id = tid ?? sid ?? iid
    if (!id) continue

    let isSolid = false
    if (tid && solidTxt.has(id)) isSolid = true
    if (sid && solidStk.has(id)) isSolid = true
    if (iid && input.solidImgId === id) isSolid = true

    const el = r as unknown as HTMLElement

    if (!input.pointerInsidePreview && !hasSelection && !input.forceShowHint) {
      el.style.display = "none"
      continue
    }

    // Selection active but pointer left the preview: only the selected solid ring(s) stay visible.
    // If we're forcing the hint, we should still show the idle ones.
    if (!input.pointerInsidePreview && hasSelection && !isSolid && !input.forceShowHint) {
      el.style.display = "none"
      continue
    }

    el.style.display = ""

    if (isSolid) {
      r.setAttribute("stroke-dasharray", "none")
      r.removeAttribute("stroke-opacity")
      continue
    }

    r.setAttribute("stroke-dasharray", OVERLAY_DASH)

    if (!hasSelection) {
      const isHinting = input.forceShowHint && !input.pointerInsidePreview
      const op = id === input.hoveredElementId ? OVERLAY_OPACITY_DASH_HOVER : (isHinting ? OVERLAY_OPACITY_DASH_HOVER : OVERLAY_OPACITY_DASH_NORMAL)
      r.setAttribute("stroke-opacity", String(op))
      continue
    }

    if (input.pointerInsidePreview && id === input.hoveredElementId) {
      r.setAttribute("stroke-opacity", String(OVERLAY_OPACITY_DASH_NORMAL))
    } else {
      const isHinting = input.forceShowHint && !input.pointerInsidePreview
      r.setAttribute("stroke-opacity", String(isHinting ? OVERLAY_OPACITY_DASH_HOVER : OVERLAY_OPACITY_DASH_SUBTLE))
    }
  }

  // Empty image zones: upload icon tint only (no dashed frame on the hit target rect).
  const DEFAULT_UPLOAD_CIRCLE_FILL = "rgba(55,138,221,0.13)"
  const DEFAULT_UPLOAD_CIRCLE_STROKE = "rgba(55,138,221,0.4)"
  const HOVER_UPLOAD_CIRCLE_FILL = "rgba(55,138,221,0.26)"
  const HOVER_UPLOAD_CIRCLE_STROKE = "rgba(55,138,221,0.72)"
  Array.from(svg.querySelectorAll<SVGRectElement>("[data-empty-upload='1']")).forEach((host) => {
    const zid = host.getAttribute("data-upload-zone")
    const hovered = !!zid && zid === input.hoveredElementId && input.pointerInsidePreview
    const circ = zid ? (svg.querySelector("#upload_icon_" + zid)?.querySelector("circle") ?? null) : null
    if (circ) {
      circ.setAttribute("fill", hovered ? HOVER_UPLOAD_CIRCLE_FILL : DEFAULT_UPLOAD_CIRCLE_FILL)
      circ.setAttribute("stroke", hovered ? HOVER_UPLOAD_CIRCLE_STROKE : DEFAULT_UPLOAD_CIRCLE_STROKE)
    }
  })
}

type OverlayHandleVisibilityInput = {
  selectedTextId: string | null
  selectedStickerId: string | null
  selectedTextIds: string[]
  selectedStickerIds: string[]
}

/** Resize / rotate handle groups: visible only when there is a real selection (not preview-hover alone). */
function paintOverlayHandleVisibility(svg: SVGElement, input: OverlayHandleVisibilityInput) {
  const isMulti = input.selectedTextIds.length + input.selectedStickerIds.length > 1
  const showText = !!input.selectedTextId && !isMulti
  const showSticker = !!input.selectedStickerId && !isMulti
  const showMulti = isMulti

  Array.from(svg.querySelectorAll<SVGGElement>('[data-text-handles="1"]')).forEach((g) => {
    ; (g as unknown as HTMLElement).style.display = showText ? "" : "none"
  })
  Array.from(svg.querySelectorAll<SVGGElement>('[data-sticker-handles="1"]')).forEach((g) => {
    ; (g as unknown as HTMLElement).style.display = showSticker ? "" : "none"
  })
  Array.from(svg.querySelectorAll<SVGGElement>('[data-multi-handles="1"]')).forEach((g) => {
    ; (g as unknown as HTMLElement).style.display = showMulti ? "" : "none"
  })
}

/** Resolve which logical zone id is under the pointer (including resize/rotate controls). */
function pickHoveredOverlayZoneId(svg: Element, clientX: number, clientY: number): string | null {
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const raw of stack) {
    const el = raw as Element
    if (!svg.contains(el)) continue
    const zt = el.closest?.("[data-text-zone]")?.getAttribute("data-text-zone")
    if (zt) return zt
    const zs = el.closest?.("[data-sticker-zone]")?.getAttribute("data-sticker-zone")
    if (zs) return zs
    const zu = el.closest?.("[data-upload-zone]")?.getAttribute("data-upload-zone")
    if (zu) return zu
    const iconG = el.closest?.("g[id^='upload_icon_']")
    if (iconG) {
      const idAttr = iconG.getAttribute("id") || ""
      const m = idAttr.match(/^upload_icon_(.+)$/)
      if (m?.[1]) return m[1]
    }
    const zi = el.closest?.("[data-img-zone]")?.getAttribute("data-img-zone")
    if (zi) return zi
    const th = el.closest?.("[data-text-handle]")?.getAttribute("data-text-id")
    if (th) return th
    const sh = el.closest?.("[data-sticker-handle]")?.getAttribute("data-sticker-id")
    if (sh) return sh
    const rh = el.closest?.("[data-rotate-handle='1']")?.getAttribute("data-rotate-id")
    if (rh) return rh
  }
  return null
}

async function fileToDataUrl(file: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string) || "")
    reader.onerror = () => reject(new Error("FileReader failed"))
    reader.readAsDataURL(file)
  })
}

async function compressImageFileToJpegDataUrl(file: File): Promise<{ dataUrl: string; w: number; h: number; outBytes: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = "async"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Image load failed"))
      img.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No canvas context")
    ctx.drawImage(img, 0, 0)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error("toBlob failed"))
          else resolve(b)
        },
        "image/jpeg",
        IMAGE_COMPRESS_QUALITY
      )
    })

    const dataUrl = await fileToDataUrl(blob)
    return { dataUrl, w: img.naturalWidth, h: img.naturalHeight, outBytes: blob.size }
  } finally {
    URL.revokeObjectURL(url)
  }
}
/** Selector for element by id (avoids template literals in JSX for Turbopack) */
function idSelector(id: string) {
  return "[id=\"" + id + "\"]"
}

/** Fixed chrome for the overlay text editor: soft dark gray on white (not harsh black). */
const INLINE_TEXT_EDITOR_CHROME =
  "color:#475569;background:#ffffff;caret-color:#475569"

function getLeafTspans(textEl: SVGElement) {
  const all = Array.from(textEl.querySelectorAll("tspan")) as SVGElement[]
  const leaf = all.filter((t) => t.querySelectorAll("tspan").length === 0)
  leaf.sort((a, b) => {
    const ay = parseFloat(a.getAttribute("y") || "0")
    const by = parseFloat(b.getAttribute("y") || "0")
    if (ay !== by) return ay - by
    const ax = parseFloat(a.getAttribute("x") || "0")
    const bx = parseFloat(b.getAttribute("x") || "0")
    return ax - bx
  })
  return leaf
}

function getLeafTspansInDomOrder(textEl: SVGElement) {
  return (Array.from(textEl.querySelectorAll("tspan")) as SVGElement[]).filter(
    (t) => t.querySelectorAll("tspan").length === 0
  )
}



function enforceWesternNumerals(value: string) {
  const devanagariDigits = "०१२३४५६७८९"
  return value.replace(/[०-९]/g, (match) => devanagariDigits.indexOf(match).toString())
}

function normalizeEditableValue(value: string) {
  let val = enforceWesternNumerals(value)
  const lines = val.split("\n")
  const hasVisibleContent = lines.some((line) => line.trim().length > 0)
  if (!hasVisibleContent) return "text here"
  return lines.map(line => line.replace(/ +$/, match => "\u00A0".repeat(match.length))).join("\n")
}

function extractMultilineText(el: SVGElement) {
  const leafTspans = getLeafTspansInDomOrder(el)
  if (leafTspans.length <= 1) {
    return el.textContent?.replace(/\u200B/g, "") ?? ""
  }
  let lastY: number | null = null
  const lines: string[] = []
  leafTspans.forEach(t => {
    const y = parseFloat(t.getAttribute("y") || "")
    const text = t.textContent?.replace(/\u200B/g, "") || ""
    if (lastY === null) {
      lines.push(text)
      lastY = Number.isFinite(y) ? y : null
    } else if (Number.isFinite(y) && Math.abs(y - lastY) > 2) {
      lines.push(text)
      lastY = y
    } else {
      lines[lines.length - 1] += text
    }
  })
  return lines.join("\n")
}

function applyEditableValueToTextEl(target: SVGElement, value: string, forceStepY?: number) {
  const normalizedVal = normalizeEditableValue(value)
  const leaf = getLeafTspansInDomOrder(target)
  const parts = normalizedVal.split("\n")
  const hasLineBreaks = parts.length > 1
  if (!hasLineBreaks && leaf.length === 0) {
    const t = target.querySelector("tspan")
    if (t) t.textContent = normalizedVal
    else target.textContent = normalizedVal
    return
  }

  // Rebuild leaf tspans deterministically in DOM order.
  // This avoids index drift when users insert empty lines repeatedly in the middle.
  const templateLeaf = leaf[0] || (target.querySelector("tspan") as SVGElement | null)
  if (!templateLeaf) {
    target.textContent = normalizedVal
    return
  }
  const firstLeafX = parseFloat(templateLeaf.getAttribute("x") || "")
  const firstLeafY = parseFloat(templateLeaf.getAttribute("y") || "")
  const baseX = Number.isFinite(firstLeafX) ? firstLeafX : parseFloat(target.getAttribute("x") || "0")
  const baseY = Number.isFinite(firstLeafY) ? firstLeafY : parseFloat(target.getAttribute("y") || "0")

  let stepY = 0
  if (Number.isFinite(forceStepY) && (forceStepY as number) > 0) {
    stepY = forceStepY as number
  } else {
    if (leaf.length >= 2) {
      for (let i = 1; i < leaf.length; i++) {
        const prevY = parseFloat(leaf[i - 1]?.getAttribute("y") || "")
        const nextY = parseFloat(leaf[i]?.getAttribute("y") || "")
        const dy = Math.abs(nextY - prevY)
        if (Number.isFinite(dy) && dy > 0) {
          stepY = dy
          break
        }
      }
    }
    const persistedStepAttr = parseFloat(target.getAttribute("data-editor-line-step") || "")
    if (!(stepY > 0) && Number.isFinite(persistedStepAttr) && persistedStepAttr > 0) {
      stepY = persistedStepAttr
    }
    if (!(stepY > 0)) {
      const leafFontSizeSvg = parseFloat(templateLeaf.getAttribute("font-size") || "")
      const targetFontSizeSvg = parseFloat(target.getAttribute("font-size") || "")
      const computedFontSvg = (() => {
        try {
          const cs = typeof window !== "undefined" ? window.getComputedStyle(templateLeaf as any) : null
          const v = cs ? parseFloat(cs.fontSize || "") : NaN
          return Number.isFinite(v) && v > 0 ? v : NaN
        } catch {
          return NaN
        }
      })()
      const fallbackFontSvg =
        Number.isFinite(leafFontSizeSvg) && leafFontSizeSvg > 0
          ? leafFontSizeSvg
          : Number.isFinite(targetFontSizeSvg) && targetFontSizeSvg > 0
            ? targetFontSizeSvg
            : Number.isFinite(computedFontSvg) && computedFontSvg > 0
              ? computedFontSvg
              : 14
      stepY = fallbackFontSvg * 1.25
    }
  }
  target.setAttribute("data-editor-line-step", String(stepY))

  // Preserve template tspan container hierarchy (common in Inkscape centered text).
  // Removing all tspans can break alignment/selection mapping for some templates.
  const leafParent = templateLeaf.parentNode
  if (!leafParent) {
    target.textContent = normalizedVal
    return
  }

  leaf.forEach((node) => {
    node.parentNode?.removeChild(node)
  })

  // Remove lingering whitespace text nodes from the entire target hierarchy.
  // Inkscape's xml:space="preserve" causes these to be rendered as trailing spaces,
  // artificially inflating the getBBox() and thus the selection box.
  const removeWhitespaceTextNodes = (el: Node) => {
    Array.from(el.childNodes).forEach((child) => {
      if (child.nodeType === 3) { // Node.TEXT_NODE
        if (!child.textContent?.trim()) {
          el.removeChild(child)
        }
      } else if (child.nodeType === 1) { // Node.ELEMENT_NODE
        removeWhitespaceTextNodes(child)
      }
    })
  }
  removeWhitespaceTextNodes(target)

  parts.forEach((line, i) => {
    const newLeaf = templateLeaf.cloneNode(false) as SVGElement
    newLeaf.removeAttribute("id")
    newLeaf.setAttribute("x", String(baseX))
    newLeaf.setAttribute("y", String(baseY + i * stepY))
    newLeaf.textContent = line || "\u200B"
    leafParent.appendChild(newLeaf)
  })
}

function getCurrentWordRange(value: string, caretIndex: number) {
  const safeCaret = Math.max(0, Math.min(caretIndex, value.length))
  const isAfterSingleSpace = safeCaret > 0 && /\s/.test(value[safeCaret - 1] || "") && (safeCaret === 1 || !/\s/.test(value[safeCaret - 2] || ""))
  const lookupCaret = isAfterSingleSpace ? safeCaret - 1 : safeCaret

  let start = lookupCaret
  while (start > 0 && !/\s/.test(value[start - 1] || "")) start -= 1
  let end = lookupCaret
  while (end < value.length && !/\s/.test(value[end] || "")) end += 1

  return { start, end, word: value.slice(start, lookupCaret), isAfterSingleSpace }
}

function resolveTransliterationLanguage(language: TemplateLanguage): "hindi" | "marathi" | null {
  if (language === "hindi" || language === "marathi") return language
  return null
}

function isRomanPhoneticWord(word: string) {
  // Transliteration should trigger only for English phonetic typing.
  return /^[A-Za-z]+$/.test(word)
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const template = getTemplateById(resolvedParams.id) ?? allTemplates[0]
  const transliterationLanguage = resolveTransliterationLanguage(template.language)

  const svgDocRef = useRef<Document | null>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({})
  const panelInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  // When starting a resize from resize handles, the inline editor overlay blurs.
  // Its blur handler calls `commit()`, which rebuilds the preview and interrupts resize dragging.
  // This flag suppresses commit during an active resize.
  const suppressEditorCommitRef = useRef(false)

  /** Undo/redo: full SVG + zoneStates (text + image zones). */
  const isApplyingHistoryRef = useRef(false)
  const historyPastRef = useRef<EditorHistoryEntry[]>([])
  const historyFutureRef = useRef<EditorHistoryEntry[]>([])
  const panelTextHistoryPushedRef = useRef(false)
  /** One undo step per zoom slider gesture (cleared on pointer up). */
  const panelImageZoomPushedRef = useRef<Record<string, boolean>>({})
  const textHistoryApiRef = useRef({
    captureHistoryEntry: (): EditorHistoryEntry => ({ svg: "", zoneStates: {} }),
    pushPastBeforeMutation: () => { },
    pushPastSnapshot: (_e: EditorHistoryEntry) => { },
    pendingDragSnapshot: null as EditorHistoryEntry | null,
  })
  const [historyTick, setHistoryTick] = useState(0)

  const [previewVersion, setPreviewVersion] = useState(0)
  const [textFields, setTextFields] = useState<{ id: string; label: string }[]>([])
  const [imageZones, setImageZones] = useState<
    { id: string; label: string; zoneX: number; zoneY: number; zoneW: number; zoneH: number; hasClip: boolean }[]
  >([])
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const [zoneStates, setZoneStates] = useState<Record<string, ImageZoneState>>({})
  const zoneStatesRef = useRef(zoneStates)
  zoneStatesRef.current = zoneStates
  const [zoneBusy, setZoneBusy] = useState<Record<string, boolean>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [svgLoaded, setSvgLoaded] = useState(false)
  const [stickerCategories, setStickerCategories] = useState<StickerCategory[]>([])
  const [isStickerDialogOpen, setIsStickerDialogOpen] = useState(false)
  const [stickerDialogPos, setStickerDialogPos] = useState({ x: 800, y: 100 })
  const draggingDialogRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null)
  const stickerDialogRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileEditTextDialog, setMobileEditTextDialog] = useState<{ isOpen: boolean; tid: string | null }>({ isOpen: false, tid: null })
  const [isMobileSizeDialogOpen, setIsMobileSizeDialogOpen] = useState(false)
  const [mobileSizeDialogY, setMobileSizeDialogY] = useState<number | null>(null)


  const draggingSizeDialogRef = useRef<{ startY: number; initY: number } | null>(null)
  const mobileDialogOpenedAtRef = useRef<number>(0)
  const [mobileTransliteration, setMobileTransliteration] = useState<{ suggestions: string[]; wordRange: { start: number; end: number; word: string; isAfterSingleSpace?: boolean } | null }>({ suggestions: [], wordRange: null })
  const mobileSuggestionDebounceRef = useRef<number>(0)
  const mobileSuggestionReqIdRef = useRef<number>(0)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const isMultiSelectModeRef = useRef(isMultiSelectMode)
  isMultiSelectModeRef.current = isMultiSelectMode

  useEffect(() => {
    // Set reasonable default position once mounted to avoid SSR issues with window
    setStickerDialogPos({ x: window.innerWidth - 320, y: 80 })
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isStickerDialogOpen &&
        stickerDialogRef.current &&
        !stickerDialogRef.current.contains(event.target as Node)
      ) {
        const target = event.target as Element
        if (
          !target.closest('[data-sticker-toggle="true"]') &&
          !(previewContainerRef.current?.querySelector("svg")?.contains(target as Node))
        ) {
          setIsStickerDialogOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isStickerDialogOpen])

  const [selectedStickerCategory, setSelectedStickerCategory] = useState("")
  const [selectedStickerIdState, setSelectedStickerIdState] = useState<string | null>(null)
  const [selectedTextIdState, setSelectedTextIdState] = useState<string | null>(null)
  const [selectedTextIdsState, setSelectedTextIdsState] = useState<string[]>([])
  const [selectedStickerIdsState, setSelectedStickerIdsState] = useState<string[]>([])
  const [selectedImageZoneIdState, setSelectedImageZoneIdState] = useState<string | null>(null)
  const [isPreviewHovering, setIsPreviewHovering] = useState(false)
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const [selectedTextFontSizeUi, setSelectedTextFontSizeUi] = useState<number>(16)
  const [multiSelectScaleUi, setMultiSelectScaleUi] = useState<number>(100)
  useEffect(() => {
    setMultiSelectScaleUi(100)
  }, [selectedTextIdsState, selectedStickerIdsState])
  const multiScaleStartRef = useRef<{
    baseSlider: number
    anchorX: number
    anchorY: number
    startTxt: Record<string, { x: number; y: number; tspanXY: { x: number; y: number }[] }>
    startTxtFontSize: Record<string, number>
    startSticker: Record<string, { x: number; y: number; w: number; h: number }>
  } | null>(null)
  const selectedTextIdRef = useRef<string | null>(null)
  selectedTextIdRef.current = selectedTextIdState
  const selectedTextIdsRef = useRef<string[]>([])
  selectedTextIdsRef.current = selectedTextIdsState
  const selectedStickerIdsRef = useRef<string[]>([])
  selectedStickerIdsRef.current = selectedStickerIdsState
  /** Synced every render so preview pointermove handlers read fresh hover without re-cloning the SVG. */
  const previewPointerRef = useRef({ pointerInside: false, hoverId: null as string | null })
  previewPointerRef.current.pointerInside = isPreviewHovering
  previewPointerRef.current.hoverId = hoveredElementId
  const showInitialHintRef = useRef(false)
  const hintTimeoutRef = useRef<number | null>(null)

  const triggerInitialHint = useCallback(() => {
    showInitialHintRef.current = true
    setPreviewVersion(v => v + 1)
    if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current)
    hintTimeoutRef.current = window.setTimeout(() => {
      showInitialHintRef.current = false
      setPreviewVersion(v => v + 1)
    }, 1500)
  }, [])

  const selectedCategoryStickers = stickerCategories.find((c) => c.name === selectedStickerCategory)?.stickers ?? []
  const selectedTextField = selectedTextIdState ? textFields.find((field) => field.id === selectedTextIdState) ?? null : null
  const selectedTextValue = selectedTextIdState ? (textValues[selectedTextIdState] ?? "") : ""
  const isSelectedTextMultiline = selectedTextValue.includes("\n") || selectedTextValue.length > 60
  const selectedImageZone = selectedImageZoneIdState ? imageZones.find((zone) => zone.id === selectedImageZoneIdState) ?? null : null
  const selectedImageState = selectedImageZone ? zoneStates[selectedImageZone.id] ?? null : null
  const selectedImageHasImage = !!selectedImageState?.b64

  useEffect(() => {
    if (isMobile && isMobileSizeDialogOpen) {
      let targetEl: Element | null = null
      if (selectedImageZoneIdState && selectedImageHasImage) {
        targetEl = document.getElementById(selectedImageZoneIdState)
      } else if (selectedTextIdState) {
        targetEl = document.getElementById(selectedTextIdState)
      }

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect()
        const cy = rect.top + rect.height / 2
        if (cy > window.innerHeight / 2) {
          // Element is in the lower half -> put dialog near top
          setMobileSizeDialogY(80)
        } else {
          // Element is in the upper half -> put dialog near bottom
          setMobileSizeDialogY(window.innerHeight - 200)
        }
      } else {
        setMobileSizeDialogY(window.innerHeight - 200)
      }
    } else {
      setMobileSizeDialogY(null)
    }
  }, [isMobile, isMobileSizeDialogOpen, selectedTextIdState, selectedImageZoneIdState, selectedImageHasImage])

  useEffect(() => {
    panelTextHistoryPushedRef.current = false
  }, [selectedTextIdState])

  useEffect(() => {
    let cancelled = false
    fetch("/api/stickers")
      .then((r) => r.json())
      .then((payload: { defaultCategory: string; categories: StickerCategory[] }) => {
        if (cancelled) return
        const categories = Array.isArray(payload?.categories) ? payload.categories : []
        setStickerCategories(categories)
        if (categories.length === 0) {
          setSelectedStickerCategory("")
          return
        }
        const preferred = payload?.defaultCategory
        const valid = categories.some((c) => c.name === preferred)
        setSelectedStickerCategory(valid ? preferred : categories[0].name)
      })
      .catch(() => {
        if (cancelled) return
        setStickerCategories([])
        setSelectedStickerCategory("")
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Load template SVG
  useEffect(() => {
    if (!template.svg) {
      setSvgLoaded(false)
      return
    }
    fetch(template.svg)
      .then((r) => r.text())
      .then((svgText) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(svgText, "image/svg+xml")
        svgDocRef.current = doc

        const fontsToLoad = new Set<string>()
        Array.from(doc.querySelectorAll("*")).forEach((el) => {
          const ff = el.getAttribute("font-family")
          if (ff) fontsToLoad.add(ff.replace(/['"]/g, "").trim())
          const style = el.getAttribute("style")
          if (style) {
            const match = style.match(/font-family:\s*([^;]+)/)
            if (match) {
              fontsToLoad.add(match[1].replace(/['"]/g, "").trim())
            }
          }
        })

        const systemFonts = new Set([
          "sans-serif", "serif", "monospace", "none",
          "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Palatino", "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact"
        ])
        const fontImports = Array.from(fontsToLoad)
          .filter((f) => f && !systemFonts.has(f))
          .map((f) => `@import url('https://fonts.googleapis.com/css2?family=${f.replace(/ /g, "+")}&display=swap');`)
          .join("\n")

        if (fontImports) {
          const styleId = `dynamic-fonts-${template.id}`
          if (!document.getElementById(styleId)) {
            const styleEl = document.createElement("style")
            styleEl.id = styleId
            styleEl.textContent = fontImports
            document.head.appendChild(styleEl)

            if (document.fonts) {
              const fontPromises = Array.from(fontsToLoad)
                .filter((f) => f && !systemFonts.has(f))
                .map((f) => document.fonts.load(`16px "${f}"`).catch(() => []))

              Promise.all(fontPromises).then(() => {
                setPreviewVersion((v) => v + 1)
              }).catch(() => {
                setPreviewVersion((v) => v + 1)
              })
            }
          }
        }

        const textEls = Array.from(doc.querySelectorAll<SVGElement>(`[id^="${EDITABLE_PREFIX}"]`))
        setTextFields(
          textEls.map((el) => ({
            id: el.getAttribute("id")!,
            label: (el.getAttribute("id") || "").replace(EDITABLE_PREFIX, "").replace(/_/g, " "),
          }))
        )
        const textVals: Record<string, string> = {}
        textEls.forEach((el) => {
          const id = el.getAttribute("id")
          if (id) {
            // Safely convert numerals in the DOM without destroying <tspan> layout
            const walk = (node: Node) => {
              if (node.nodeType === 3 && node.nodeValue) {
                node.nodeValue = enforceWesternNumerals(node.nodeValue)
              }
              node.childNodes.forEach(walk)
            }
            walk(el)

            const rawVal = extractMultilineText(el).trimEnd()
            textVals[id] = enforceWesternNumerals(rawVal)
          }
        })

        setTextValues(textVals)

        const imageEls = Array.from(doc.querySelectorAll<SVGElement>(`[id^="${IMAGE_ZONE_PREFIX}"]`))
        const zones: typeof imageZones = []
        const zStates: Record<string, ImageZoneState> = {}
        imageEls.forEach((el) => {
          const id = el.getAttribute("id")
          if (!id) return
          const clipAttr = el.getAttribute("clip-path") || ""
          const hasClip = clipAttr.includes("url(#")
          const clipBounds = hasClip ? getClipBounds(doc, clipAttr) : null
          const zoneX = clipBounds ? clipBounds.x : parseFloat(el.getAttribute("x") || "0")
          const zoneY = clipBounds ? clipBounds.y : parseFloat(el.getAttribute("y") || "0")
          const zoneW = clipBounds ? clipBounds.w : parseFloat(el.getAttribute("width") || "100")
          const zoneH = clipBounds ? clipBounds.h : parseFloat(el.getAttribute("height") || "100")
          zones.push({
            id,
            label: id.replace(IMAGE_ZONE_PREFIX, "").replace(/_/g, " "),
            zoneX,
            zoneY,
            zoneW,
            zoneH,
            hasClip,
          })
          zStates[id] = {
            b64: "",
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            imgW: 0,
            imgH: 0,
            zoneX,
            zoneY,
            zoneW,
            zoneH,
            hasClip,
            existingClipId: hasClip ? clipAttr : null,
            flipH: false,
          }
        })
        setImageZones(zones)
        setZoneStates(zStates)
        historyPastRef.current = []
        historyFutureRef.current = []
        setPreviewVersion((v) => v + 1)
        setSvgLoaded(true)
        setHistoryTick((t) => t + 1)
        triggerInitialHint()
      })
      .catch(() => setSvgLoaded(false))
  }, [template.svg, template.id, triggerInitialHint])

  const captureHistoryEntry = useCallback((): EditorHistoryEntry => {
    const doc = svgDocRef.current
    if (!doc) return { svg: "", zoneStates: {} }
    return {
      svg: new XMLSerializer().serializeToString(doc),
      zoneStates: cloneZoneStates(zoneStatesRef.current),
    }
  }, [])

  const pushPastBeforeMutation = useCallback(() => {
    if (isApplyingHistoryRef.current) return
    const entry = captureHistoryEntry()
    historyPastRef.current.push(entry)
    if (historyPastRef.current.length > MAX_EDITOR_HISTORY) historyPastRef.current.shift()
    historyFutureRef.current = []
    setHistoryTick((t) => t + 1)
  }, [captureHistoryEntry])

  const getSelectedTextFontSize = useCallback(() => {
    const tid = selectedTextIdState
    if (!tid) return null

    // Prefer the source SVG doc first so UI updates immediately when the user changes size
    // (the live preview may lag until the next rebuild).
    const doc = svgDocRef.current
    if (!doc) return null
    const el = doc.querySelector(idSelector(tid)) as SVGElement | null
    if (!el) return null
    const leaf = getLeafTspans(el)
    const fromLeafAttr = leaf[0] ? parseFloat(leaf[0].getAttribute("font-size") || "") : NaN
    if (Number.isFinite(fromLeafAttr) && fromLeafAttr > 0) return fromLeafAttr
    const fromElAttr = parseFloat(el.getAttribute("font-size") || "")
    if (Number.isFinite(fromElAttr) && fromElAttr > 0) return fromElAttr

    // Fall back to the live preview element's computed style (templates may define font on tspans via CSS).
    const liveSvg = previewContainerRef.current?.querySelector("svg") as SVGSVGElement | null
    const liveEl = liveSvg?.querySelector(idSelector(tid)) as SVGElement | null
    const leafLive = liveEl ? getLeafTspans(liveEl) : []
    const liveTarget = (leafLive[0] as any) ?? liveEl
    const liveCs = typeof window !== "undefined" && liveTarget ? window.getComputedStyle(liveTarget as any) : null
    const fromComputed = liveCs ? parseFloat(liveCs.fontSize || "") : NaN
    if (Number.isFinite(fromComputed) && fromComputed > 0) return fromComputed
    return null
  }, [selectedTextIdState])

  const setSelectedTextFontSize = useCallback((nextFontSize: number) => {
    const tids = selectedTextIdsState.length > 0 ? selectedTextIdsState : (selectedTextIdState ? [selectedTextIdState] : [])
    const doc = svgDocRef.current
    if (tids.length === 0 || !doc) return

    const newFont = Math.max(4, Math.min(200, nextFontSize))

    const applyFontSize = (target: SVGElement) => {
      let currentFont = NaN
      const leafForFont = target.querySelector("tspan") || target
      const leafFontSizeSvg = parseFloat(leafForFont.getAttribute("font-size") || "")
      if (Number.isFinite(leafFontSizeSvg) && leafFontSizeSvg > 0) {
        currentFont = leafFontSizeSvg
      } else {
        const targetFontSizeSvg = parseFloat(target.getAttribute("font-size") || "")
        if (Number.isFinite(targetFontSizeSvg) && targetFontSizeSvg > 0) {
          currentFont = targetFontSizeSvg
        } else {
          try {
            const cs = typeof window !== "undefined" ? window.getComputedStyle(leafForFont as any) : null
            const v = cs ? parseFloat(cs.fontSize || "") : NaN
            if (Number.isFinite(v) && v > 0) currentFont = v
          } catch {}
        }
      }
      if (!(currentFont > 0)) currentFont = 16

      target.setAttribute("font-size", String(newFont))
        ; (target as unknown as HTMLElement).style.fontSize = String(newFont) + "px"
      const tspans = Array.from(target.querySelectorAll("tspan")) as SVGElement[]
      tspans.forEach((t) => {
        if (t.hasAttribute("font-size")) t.setAttribute("font-size", String(newFont))
          ; (t as unknown as HTMLElement).style.fontSize = String(newFont) + "px"
        const style = t.getAttribute("style")
        if (style && style.includes("font-size")) {
          const withoutSize = style.replace(/font-size\s*:[^;]+;?/g, "")
          t.setAttribute("style", withoutSize ? `${withoutSize}font-size:${newFont}px;` : `font-size:${newFont}px;`)
        }
      })

      const leafTspans = tspans.filter((t) => t.querySelectorAll("tspan").length === 0)
      if (leafTspans.length > 1) {
        leafTspans.sort((a, b) => {
          const ay = parseFloat(a.getAttribute("y") || "0")
          const by = parseFloat(b.getAttribute("y") || "0")
          if (ay !== by) return ay - by
          const ax = parseFloat(a.getAttribute("x") || "0")
          const bx = parseFloat(b.getAttribute("x") || "0")
          return ax - bx
        })
        const firstY = parseFloat(leafTspans[0].getAttribute("y") || "0")
        const persistedStep = parseFloat(target.getAttribute("data-editor-line-step") || "")
        const stepY = Number.isFinite(persistedStep) && persistedStep > 0
          ? (persistedStep * newFont) / currentFont
          : newFont * LINE_HEIGHT_RATIO
        
        leafTspans.forEach((t, i) => {
          t.setAttribute("y", String(firstY + i * stepY))
        })
        target.setAttribute("data-editor-line-step", String(stepY))
      }
    }

    pushPastBeforeMutation()
    tids.forEach(tid => {
      const el = doc.querySelector(idSelector(tid)) as SVGElement | null
      if (el) applyFontSize(el)
    })
    setPreviewVersion((v) => v + 1)
    setSelectedTextFontSizeUi(newFont)
  }, [selectedTextIdState, selectedTextIdsState, pushPastBeforeMutation])

  const setMultiSelectScale = useCallback((val: number) => {

    if (!multiScaleStartRef.current) return
    const { anchorX, anchorY, startTxt, startTxtFontSize, startSticker, baseSlider } = multiScaleStartRef.current
    const scale = val / baseSlider

    const doc = svgDocRef.current
    const liveSvg = previewContainerRef.current?.querySelector("svg")
    if (!doc || !liveSvg) return

    pushPastBeforeMutation()

    const scalePoint = (x: number, y: number) => ({
      x: anchorX + (x - anchorX) * scale,
      y: anchorY + (y - anchorY) * scale
    })

    Object.entries(startTxt).forEach(([id, base]: [string, any]) => {
      const docEl = doc.querySelector(idSelector(id)) as SVGElement | null
      const liveEl = liveSvg.querySelector(idSelector(id)) as SVGElement | null

      const targets = [docEl, liveEl]
      targets.forEach(el => {
        if (!el) return
        const tspans = Array.from(el.querySelectorAll("tspan"))
        if (tspans.length && base.tspanXY.length) {
          tspans.forEach((t, i) => {
            const pt = base.tspanXY[i]; if (!pt) return;
            const next = scalePoint(pt.x, pt.y)
            t.setAttribute("x", String(next.x))
            t.setAttribute("y", String(next.y))
          })
        } else {
          const next = scalePoint(base.x, base.y)
          el.setAttribute("x", String(next.x))
          el.setAttribute("y", String(next.y))
        }

        const bFont = startTxtFontSize[id]
        if (bFont) {
          const newFont = Math.max(4, Math.min(200, bFont * scale))

          el.setAttribute("font-size", String(newFont))
            ; (el as any).style.fontSize = `${newFont}px`
          tspans.forEach(t => {
            if (t.hasAttribute("font-size")) {
              t.setAttribute("font-size", String(newFont))
                ; (t as any).style.fontSize = `${newFont}px`
            }
            const style = t.getAttribute("style")
            if (style && style.includes("font-size")) {
              const withoutSize = style.replace(/font-size\s*:[^;]+;?/g, "")
              t.setAttribute("style", withoutSize ? `${withoutSize}font-size:${newFont}px;` : `font-size:${newFont}px;`)
            }
          })
        }
      })

    })

    Object.entries(startSticker).forEach(([id, b]: [string, any]) => {
      const liveEl = liveSvg.querySelector(idSelector(id)) as SVGImageElement | null
      const docEl = doc.querySelector(idSelector(id)) as SVGImageElement | null
      const targets = [liveEl, docEl]

      targets.forEach(el => {
        if (!el) return
        const image = el.tagName.toLowerCase() === "image" ? el : el.querySelector("image")
        if (!image) return
        const next = scalePoint(b.x, b.y)
        image.setAttribute("x", String(next.x))
        image.setAttribute("y", String(next.y))
        image.setAttribute("width", String(b.w * scale))
        image.setAttribute("height", String(b.h * scale))
      })
    })

    setPreviewVersion(v => v + 1)
  }, [pushPastBeforeMutation])

  const nudgeSelectedTextFontSize = useCallback((delta: number) => {
    const current = getSelectedTextFontSize()
    const base = Number.isFinite(current ?? NaN) && (current ?? 0) > 0 ? (current as number) : 16
    setSelectedTextFontSize(base + delta)
  }, [getSelectedTextFontSize, setSelectedTextFontSize])

  useEffect(() => {
    const fs = getSelectedTextFontSize()
    if (Number.isFinite(fs ?? NaN) && (fs ?? 0) > 0) setSelectedTextFontSizeUi(fs as number)
    else setSelectedTextFontSizeUi(16)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextIdState, previewVersion])

  const duplicateSelected = useCallback(() => {
    const doc = svgDocRef.current
    if (!doc) return

    const container = previewContainerRef.current
    const svgLive = container?.querySelector("svg") as SVGSVGElement | null

    const selectedTid = selectedTextIdState
    const selectedSid = selectedStickerIdState
    const multiTxt = selectedTextIdsRef.current
    const multiStickers = selectedStickerIdsRef.current
    const hasMulti = multiTxt.length + multiStickers.length > 1
    if (!selectedTid && !selectedSid && !hasMulti) return

    pushPastBeforeMutation()

    const nextIdSuffix = Date.now() + "_" + Math.floor(Math.random() * 10000)

    const getOffsetFromLiveOverlay = (selector: string, fallbackW: number, fallbackH: number) => {
      const ov = svgLive?.querySelector(selector) as SVGRectElement | null
      const w = Math.max(1, parseFloat(ov?.getAttribute("width") || "") || fallbackW || 32)
      const h = Math.max(1, parseFloat(ov?.getAttribute("height") || "") || fallbackH || 32)
      const dx = Math.max(4, w * 0.18)
      const dy = Math.max(4, h * 0.18)
      return { dx, dy }
    }

    const shiftTextEl = (el: SVGElement, dx: number, dy: number) => {
      const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
      if (tspans.length) {
        tspans.forEach((t) => {
          const ox = parseFloat(t.getAttribute("x") || "0")
          const oy = parseFloat(t.getAttribute("y") || "0")
          t.setAttribute("x", String(ox + dx))
          t.setAttribute("y", String(oy + dy))
        })
      } else {
        const ox = parseFloat(el.getAttribute("x") || "0")
        const oy = parseFloat(el.getAttribute("y") || "0")
        el.setAttribute("x", String(ox + dx))
        el.setAttribute("y", String(oy + dy))
      }
    }

    if (hasMulti) {
      const nextTextFields: { id: string; label: string }[] = []
      const nextTextValues: Record<string, string> = {}
      const newTextIds: string[] = []
      const newStickerIds: string[] = []

      multiStickers.forEach((id, idx) => {
        const src = doc.querySelector(idSelector(id)) as SVGImageElement | null
        if (!src) return
        const clone = src.cloneNode(true) as SVGImageElement
        const newId = STICKER_PREFIX + "copy_" + nextIdSuffix + "_" + idx
        clone.setAttribute("id", newId)
        const w = Math.max(1, parseFloat(src.getAttribute("width") || "0") || 32)
        const h = Math.max(1, parseFloat(src.getAttribute("height") || "0") || 32)
        const { dx, dy } = getOffsetFromLiveOverlay("#sticker_overlay_" + id, w, h)
        const x = (parseFloat(src.getAttribute("x") || "0") || 0) + dx
        const y = (parseFloat(src.getAttribute("y") || "0") || 0) + dy
        clone.setAttribute("x", String(x))
        clone.setAttribute("y", String(y))
        const angle = parseFloat(src.getAttribute("data-rotation-angle") || "")
        if (Number.isFinite(angle) && Math.abs(angle) > 0.0001) {
          const pivotX = x + w / 2
          const pivotY = y + h / 2
          clone.setAttribute("data-rotation-angle", String(angle))
          clone.setAttribute("transform", `rotate(${angle} ${pivotX} ${pivotY})`)
        } else {
          clone.removeAttribute("data-rotation-angle")
          clone.removeAttribute("transform")
        }
        src.parentNode?.appendChild(clone)
        newStickerIds.push(newId)
      })

      multiTxt.forEach((id, idx) => {
        const src = doc.querySelector(idSelector(id)) as SVGElement | null
        if (!src) return
        const clone = src.cloneNode(true) as SVGElement
        const newId = EDITABLE_PREFIX + "copy_" + nextIdSuffix + "_" + idx
        clone.setAttribute("id", newId)
        clone.removeAttribute("transform")
        clone.removeAttribute("data-rotation-angle")
        const ov = svgLive?.querySelector("#overlay_" + id) as SVGRectElement | null
        const fallbackW = Math.max(1, parseFloat(ov?.getAttribute("width") || "") || 120)
        const fallbackH = Math.max(1, parseFloat(ov?.getAttribute("height") || "") || 32)
        const { dx, dy } = getOffsetFromLiveOverlay("#overlay_" + id, fallbackW, fallbackH)
        shiftTextEl(clone, dx, dy)
        src.parentNode?.appendChild(clone)
        nextTextFields.push({ id: newId, label: "copy" })
        nextTextValues[newId] = (textValues[id] ?? src.textContent?.replace(/\u200B/g, "") ?? "").toString()
        newTextIds.push(newId)
      })

      if (nextTextFields.length > 0) {
        setTextFields((prev) => [...prev, ...nextTextFields])
        setTextValues((prev) => ({ ...prev, ...nextTextValues }))
      }
      setSelectedImageZoneIdState(null)
      setSelectedTextIdState(null)
      setSelectedStickerIdState(null)
      setSelectedTextIdsState(newTextIds)
      setSelectedStickerIdsState(newStickerIds)
      setPreviewVersion((v) => v + 1)
      return
    }

    if (selectedSid) {
      const src = doc.querySelector(idSelector(selectedSid)) as SVGImageElement | null
      if (!src) return
      const clone = src.cloneNode(true) as SVGImageElement
      const newId = STICKER_PREFIX + nextIdSuffix
      clone.setAttribute("id", newId)

      const w = Math.max(1, parseFloat(src.getAttribute("width") || "0") || 32)
      const h = Math.max(1, parseFloat(src.getAttribute("height") || "0") || 32)
      const { dx, dy } = getOffsetFromLiveOverlay("#sticker_overlay_" + selectedSid, w, h)
      const x = (parseFloat(src.getAttribute("x") || "0") || 0) + dx
      const y = (parseFloat(src.getAttribute("y") || "0") || 0) + dy
      clone.setAttribute("x", String(x))
      clone.setAttribute("y", String(y))

      const angle = parseFloat(src.getAttribute("data-rotation-angle") || "")
      if (Number.isFinite(angle) && Math.abs(angle) > 0.0001) {
        const pivotX = x + w / 2
        const pivotY = y + h / 2
        clone.setAttribute("data-rotation-angle", String(angle))
        clone.setAttribute("transform", `rotate(${angle} ${pivotX} ${pivotY})`)
      } else {
        clone.removeAttribute("data-rotation-angle")
        clone.removeAttribute("transform")
      }

      src.parentNode?.appendChild(clone)
      setSelectedTextIdState(null)
      setSelectedImageZoneIdState(null)
      setSelectedStickerIdState(newId)
      setPreviewVersion((v) => v + 1)
      return
    }

    if (selectedTid) {
      const src = doc.querySelector(idSelector(selectedTid)) as SVGElement | null
      if (!src) return
      const clone = src.cloneNode(true) as SVGElement
      const newId = EDITABLE_PREFIX + "copy_" + nextIdSuffix
      clone.setAttribute("id", newId)
      clone.removeAttribute("transform")
      clone.removeAttribute("data-rotation-angle")

      const ov = svgLive?.querySelector("#overlay_" + selectedTid) as SVGRectElement | null
      const fallbackW = Math.max(1, parseFloat(ov?.getAttribute("width") || "") || 120)
      const fallbackH = Math.max(1, parseFloat(ov?.getAttribute("height") || "") || 32)
      const { dx, dy } = getOffsetFromLiveOverlay("#overlay_" + selectedTid, fallbackW, fallbackH)
      shiftTextEl(clone, dx, dy)

      src.parentNode?.appendChild(clone)

      const val = (textValues[selectedTid] ?? src.textContent?.replace(/\u200B/g, "") ?? "").toString()
      setTextFields((prev) => [...prev, { id: newId, label: "copy" }])
      setTextValues((prev) => ({ ...prev, [newId]: val }))
      setSelectedStickerIdState(null)
      setSelectedImageZoneIdState(null)
      setSelectedTextIdState(newId)
      setPreviewVersion((v) => v + 1)
    }
  }, [pushPastBeforeMutation, selectedStickerIdState, selectedTextIdState, textValues])

  const deleteSelected = useCallback(() => {
    const doc = svgDocRef.current
    if (!doc) return
    const sid = selectedStickerIdState
    const tid = selectedTextIdState
    const zid = selectedImageZoneIdState
    const multiTxt = selectedTextIdsRef.current
    const multiStickers = selectedStickerIdsRef.current
    const hasMulti = multiTxt.length + multiStickers.length > 0
    if (!sid && !tid && !zid && !hasMulti) return

    if (hasMulti) {
      // Delete multi-selected text and stickers.
      const txtIds = [...multiTxt]
      const stIds = [...multiStickers]
      if (txtIds.length === 0 && stIds.length === 0) return
      pushPastBeforeMutation()
      stIds.forEach((id) => {
        const el = doc.querySelector(idSelector(id))
        if (el?.parentNode) el.parentNode.removeChild(el)
      })
      txtIds.forEach((id) => {
        const el = doc.querySelector(idSelector(id))
        if (el?.parentNode) el.parentNode.removeChild(el)
      })
      if (txtIds.length) {
        setTextFields((prev) => prev.filter((f) => !txtIds.includes(f.id)))
        setTextValues((prev) => {
          const next = { ...prev }
          txtIds.forEach((id) => delete next[id])
          return next
        })
      }
      setSelectedTextIdsState([])
      setSelectedStickerIdsState([])
      setSelectedTextIdState(null)
      setSelectedStickerIdState(null)
      setSelectedImageZoneIdState(null)
      setPreviewVersion((v) => v + 1)
      return
    }

    if (sid) {
      const el = doc.querySelector(idSelector(sid))
      if (!el?.parentNode) return
      pushPastBeforeMutation()
      el.parentNode.removeChild(el)
      setSelectedStickerIdState(null)
      setPreviewVersion((v) => v + 1)
      return
    }

    if (tid) {
      const el = doc.querySelector(idSelector(tid))
      if (!el?.parentNode) return
      pushPastBeforeMutation()
      el.parentNode.removeChild(el)
      panelInputRef.current = null
      panelTextHistoryPushedRef.current = false
      setTextFields((prev) => prev.filter((f) => f.id !== tid))
      setTextValues((prev) => {
        const next = { ...prev }
        delete next[tid]
        return next
      })
      setSelectedTextIdState(null)
      setPreviewVersion((v) => v + 1)
      return
    }

    if (zid) {
      const st = zoneStatesRef.current[zid]
      if (!st?.b64) return
      const zone = imageZones.find((z) => z.id === zid)
      if (!zone) return
      pushPastBeforeMutation()
      setZoneStates((prev) => ({
        ...prev,
        [zid]: {
          ...prev[zid],
          b64: "",
          imgW: 0,
          imgH: 0,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          flipH: false,
        },
      }))
      const el = svgDocRef.current?.querySelector(idSelector(zid)) as SVGImageElement | null
      if (el) {
        el.removeAttribute("href")
        el.removeAttribute("xlink:href")
        el.setAttribute("x", String(zone.zoneX))
        el.setAttribute("y", String(zone.zoneY))
        el.setAttribute("width", String(zone.zoneW))
        el.setAttribute("height", String(zone.zoneH))
        el.removeAttribute("transform")
      }
      setPreviewVersion((v) => v + 1)
      toast.success("Image removed")
    }
  }, [pushPastBeforeMutation, selectedStickerIdState, selectedTextIdState, selectedImageZoneIdState, imageZones])

  const nudgeSelected = useCallback((dx: number, dy: number) => {
    const doc = svgDocRef.current
    if (!doc) return
    const multiTxt = selectedTextIdsRef.current
    const multiStickers = selectedStickerIdsRef.current
    if (multiTxt.length + multiStickers.length > 1) {
      pushPastBeforeMutation()
      const shiftTextEl = (el: SVGElement, ddx: number, ddy: number) => {
        const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
        if (tspans.length) {
          tspans.forEach((t) => {
            const ox = parseFloat(t.getAttribute("x") || "0")
            const oy = parseFloat(t.getAttribute("y") || "0")
            t.setAttribute("x", String(ox + ddx))
            t.setAttribute("y", String(oy + ddy))
          })
        } else {
          const ox = parseFloat(el.getAttribute("x") || "0")
          const oy = parseFloat(el.getAttribute("y") || "0")
          el.setAttribute("x", String(ox + ddx))
          el.setAttribute("y", String(oy + ddy))
        }
      }

      multiTxt.forEach((id) => {
        const el = doc.querySelector(idSelector(id)) as SVGElement | null
        if (el) shiftTextEl(el, dx, dy)
      })
      multiStickers.forEach((id) => {
        const el = doc.querySelector(idSelector(id)) as SVGElement | null
        if (!el) return
        const ox = parseFloat(el.getAttribute("x") || "0")
        const oy = parseFloat(el.getAttribute("y") || "0")
        el.setAttribute("x", String(ox + dx))
        el.setAttribute("y", String(oy + dy))
      })

      setPreviewVersion((v) => v + 1)
      return
    }
    const sid = selectedStickerIdState
    const tid = selectedTextIdState
    const zid = selectedImageZoneIdState
    if (!sid && !tid && !zid) return

    const shiftTextEl = (el: SVGElement, ddx: number, ddy: number) => {
      const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
      if (tspans.length) {
        tspans.forEach((t) => {
          const ox = parseFloat(t.getAttribute("x") || "0")
          const oy = parseFloat(t.getAttribute("y") || "0")
          t.setAttribute("x", String(ox + ddx))
          t.setAttribute("y", String(oy + ddy))
        })
      } else {
        const ox = parseFloat(el.getAttribute("x") || "0")
        const oy = parseFloat(el.getAttribute("y") || "0")
        el.setAttribute("x", String(ox + ddx))
        el.setAttribute("y", String(oy + ddy))
      }
    }

    if (sid) {
      const el = doc.querySelector(idSelector(sid)) as SVGElement | null
      if (!el) return
      pushPastBeforeMutation()
      const x = parseFloat(el.getAttribute("x") || "0")
      const y = parseFloat(el.getAttribute("y") || "0")
      const nx = x + dx
      const ny = y + dy
      el.setAttribute("x", String(nx))
      el.setAttribute("y", String(ny))
      const w = Math.max(parseFloat(el.getAttribute("width") || "0"), 0)
      const h = Math.max(parseFloat(el.getAttribute("height") || "0"), 0)
      const angle = parseFloat(el.getAttribute("data-rotation-angle") || "")
      if (w > 0 && h > 0 && Number.isFinite(angle) && Math.abs(angle) > 0.0001) {
        const pivotX = nx + w / 2
        const pivotY = ny + h / 2
        el.setAttribute("transform", `rotate(${angle} ${pivotX} ${pivotY})`)
      }
      setPreviewVersion((v) => v + 1)
      return
    }

    if (tid) {
      const el = doc.querySelector(idSelector(tid)) as SVGElement | null
      if (!el) return
      pushPastBeforeMutation()
      shiftTextEl(el, dx, dy)
      setPreviewVersion((v) => v + 1)
      return
    }

    if (zid) {
      const st = zoneStatesRef.current[zid]
      if (!st?.b64) return
      pushPastBeforeMutation()
      const nextOX = (st.offsetX || 0) + dx
      const nextOY = (st.offsetY || 0) + dy
      const { clampedOX, clampedOY } = clampImageOffsets(nextOX, nextOY, st.scale || 1, st.zoneW, st.zoneH, st.imgW, st.imgH)
      setZoneStates((prev) => ({
        ...prev,
        [zid]: { ...prev[zid], offsetX: clampedOX, offsetY: clampedOY },
      }))
      const imgEl = doc.querySelector(idSelector(zid)) as SVGImageElement | null
      if (imgEl) {
        const x = parseFloat(imgEl.getAttribute("x") || "0")
        const y = parseFloat(imgEl.getAttribute("y") || "0")
        imgEl.setAttribute("x", String(x + dx))
        imgEl.setAttribute("y", String(y + dy))
      }
      setPreviewVersion((v) => v + 1)
    }
  }, [pushPastBeforeMutation, selectedStickerIdState, selectedTextIdState, selectedImageZoneIdState])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable='true']")) return
      const hasMultiSelection = selectedTextIdsRef.current.length + selectedStickerIdsRef.current.length > 0
      if (!selectedStickerIdState && !selectedTextIdState && !selectedImageZoneIdState && !hasMultiSelection) return
      e.preventDefault()
      deleteSelected()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [deleteSelected, selectedStickerIdState, selectedTextIdState, selectedImageZoneIdState])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return
      const hasMultiSelection = selectedTextIdsRef.current.length + selectedStickerIdsRef.current.length > 0
      if (!selectedStickerIdState && !selectedTextIdState && !selectedImageZoneIdState && !hasMultiSelection) return
      e.preventDefault()
      const step = e.shiftKey ? 10 : 0.5
      if (e.key === "ArrowUp") nudgeSelected(0, -step)
      if (e.key === "ArrowDown") nudgeSelected(0, step)
      if (e.key === "ArrowLeft") nudgeSelected(-step, 0)
      if (e.key === "ArrowRight") nudgeSelected(step, 0)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [nudgeSelected, selectedStickerIdState, selectedTextIdState, selectedImageZoneIdState])

  const pushPastSnapshot = useCallback((entry: EditorHistoryEntry) => {
    if (isApplyingHistoryRef.current) return
    historyPastRef.current.push(entry)
    if (historyPastRef.current.length > MAX_EDITOR_HISTORY) historyPastRef.current.shift()
    historyFutureRef.current = []
    setHistoryTick((t) => t + 1)
  }, [])

  const addStickerToSvg = useCallback((sticker: StickerItem, at?: { x: number; y: number }) => {
    const doc = svgDocRef.current
    if (!doc) return
    pushPastBeforeMutation()
    const svgRoot = doc.documentElement
    const ns = "http://www.w3.org/2000/svg"
    const nextId = STICKER_PREFIX + Date.now() + "_" + Math.floor(Math.random() * 10000)
    const { w: svgW, h: svgH } = getSVGSize(doc)
    const side = Math.max(32, Math.min(svgW, svgH) * 0.14)
    const x = (at?.x ?? svgW / 2) - side / 2
    const y = (at?.y ?? svgH / 2) - side / 2
    const img = doc.createElementNS(ns, "image")
    img.setAttribute("id", nextId)
    img.setAttribute("href", sticker.path)
    img.setAttribute("xlink:href", sticker.path)
    img.setAttribute("x", String(x))
    img.setAttribute("y", String(y))
    img.setAttribute("width", String(side))
    img.setAttribute("height", String(side))
    img.setAttribute("preserveAspectRatio", "xMidYMid meet")
    svgRoot.appendChild(img)
    setSelectedStickerIdState(nextId)
    if (isMobile) setIsStickerDialogOpen(false)
    setPreviewVersion((v) => v + 1)
  }, [pushPastBeforeMutation, isMobile])

  const applyImageToZone = useCallback(async (zoneId: string, file: File) => {
    pushPastBeforeMutation()
    setZoneBusy((prev) => ({ ...prev, [zoneId]: true }))
    try {
      let b64 = ""
      let iw = 0
      let ih = 0

      if (file.size >= IMAGE_COMPRESS_SKIP_BELOW_BYTES) {
        const c = await compressImageFileToJpegDataUrl(file)
        b64 = c.dataUrl
        iw = c.w
        ih = c.h
      } else {
        b64 = await fileToDataUrl(file)
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Image load failed"))
          img.src = b64
        })
        iw = img.naturalWidth
        ih = img.naturalHeight
      }

      setZoneStates((prev) => ({
        ...prev,
        [zoneId]: {
          ...prev[zoneId],
          b64,
          imgW: iw,
          imgH: ih,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          flipH: false,
        },
      }))
      setSelectedTextIdState(null)
      setSelectedStickerIdState(null)
      setSelectedImageZoneIdState(zoneId)
      setPreviewVersion((v) => v + 1)
    } catch {
      try {
        const b64 = await fileToDataUrl(file)
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Image load failed"))
          img.src = b64
        })
        setZoneStates((prev) => ({
          ...prev,
          [zoneId]: {
            ...prev[zoneId],
            b64,
            imgW: img.naturalWidth,
            imgH: img.naturalHeight,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            flipH: false,
          },
        }))
        setSelectedTextIdState(null)
        setSelectedStickerIdState(null)
        setSelectedImageZoneIdState(zoneId)
        setPreviewVersion((v) => v + 1)
      } catch {
        toast.error("Image upload failed")
      }
    } finally {
      setZoneBusy((prev) => ({ ...prev, [zoneId]: false }))
    }
  }, [pushPastBeforeMutation])

  const removeImageFromZone = useCallback((zone: { id: string; zoneX: number; zoneY: number; zoneW: number; zoneH: number }) => {
    pushPastBeforeMutation()
    setZoneStates((prev) => ({
      ...prev,
      [zone.id]: {
        ...prev[zone.id],
        b64: "",
        imgW: 0,
        imgH: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        flipH: false,
      },
    }))
    const el = svgDocRef.current?.querySelector(idSelector(zone.id)) as SVGImageElement | null
    if (el) {
      el.removeAttribute("href")
      el.removeAttribute("xlink:href")
      el.setAttribute("x", String(zone.zoneX))
      el.setAttribute("y", String(zone.zoneY))
      el.setAttribute("width", String(zone.zoneW))
      el.setAttribute("height", String(zone.zoneH))
      el.removeAttribute("transform")
    }
    setPreviewVersion((v) => v + 1)
    toast.success("Image removed")
  }, [pushPastBeforeMutation])

  const getSvgDropPointFromClient = useCallback((clientX: number, clientY: number) => {
    const container = previewContainerRef.current
    if (!container) return null
    const svgEl = container.querySelector("svg") as SVGSVGElement | null
    if (!svgEl) return null
    const rect = svgEl.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
    if (vb.length < 4 || !Number.isFinite(vb[2]) || !Number.isFinite(vb[3])) return null
    const relX = (clientX - rect.left) / rect.width
    const relY = (clientY - rect.top) / rect.height
    const clampedX = Math.max(0, Math.min(1, relX))
    const clampedY = Math.max(0, Math.min(1, relY))
    return {
      x: vb[0] + clampedX * vb[2],
      y: vb[1] + clampedY * vb[3],
    }
  }, [])

  const applyHistoryEntry = useCallback((entry: EditorHistoryEntry, isInitialLoad = false) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(entry.svg, "image/svg+xml")
    svgDocRef.current = doc
    setZoneStates(cloneZoneStates(entry.zoneStates))
    const textEls = Array.from(doc.querySelectorAll<SVGElement>(`[id^="${EDITABLE_PREFIX}"]`))
    setTextFields(
      textEls.map((el) => ({
        id: el.getAttribute("id")!,
        label: (el.getAttribute("id") || "").replace(EDITABLE_PREFIX, "").replace(/_/g, " "),
      }))
    )
    const textVals: Record<string, string> = {}
    textEls.forEach((el) => {
      const id = el.getAttribute("id")
      if (id) {
        const walk = (node: Node) => {
          if (node.nodeType === 3 && node.nodeValue) {
            node.nodeValue = enforceWesternNumerals(node.nodeValue)
          }
          node.childNodes.forEach(walk)
        }
        walk(el)

        const rawVal = extractMultilineText(el).trimEnd()
        textVals[id] = enforceWesternNumerals(rawVal)
      }
    })
    setTextValues(textVals)
    setPreviewVersion((v) => v + 1)
    if (isInitialLoad) triggerInitialHint()
  }, [triggerInitialHint])

  const undo = useCallback(() => {
    if (isApplyingHistoryRef.current) return
    if (historyPastRef.current.length === 0) return
    const current = captureHistoryEntry()
    const previous = historyPastRef.current.pop()!
    historyFutureRef.current.push(current)
    isApplyingHistoryRef.current = true
    try {
      previewContainerRef.current?.querySelector("#txt-editor-overlay")?.remove()
      applyHistoryEntry(previous, false)
    } finally {
      isApplyingHistoryRef.current = false
    }
    setHistoryTick((t) => t + 1)
  }, [captureHistoryEntry, applyHistoryEntry])

  const redo = useCallback(() => {
    if (isApplyingHistoryRef.current) return
    if (historyFutureRef.current.length === 0) return
    const current = captureHistoryEntry()
    const next = historyFutureRef.current.pop()!
    historyPastRef.current.push(current)
    isApplyingHistoryRef.current = true
    try {
      previewContainerRef.current?.querySelector("#txt-editor-overlay")?.remove()
      applyHistoryEntry(next, false)
    } finally {
      isApplyingHistoryRef.current = false
    }
    setHistoryTick((t) => t + 1)
  }, [captureHistoryEntry, applyHistoryEntry])

  useEffect(() => {
    textHistoryApiRef.current.captureHistoryEntry = captureHistoryEntry
    textHistoryApiRef.current.pushPastBeforeMutation = pushPastBeforeMutation
    textHistoryApiRef.current.pushPastSnapshot = pushPastSnapshot
  }, [captureHistoryEntry, pushPastBeforeMutation, pushPastSnapshot])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      if (el.closest("input, textarea, [contenteditable='true']")) return
      // Shift+Z reports key "Z" in many browsers; use case-insensitive check.
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  // Apply image zone data into svgDoc (so serialized preview shows images)
  useEffect(() => {
    const doc = svgDocRef.current
    if (!doc) return
    const ns = "http://www.w3.org/2000/svg"
    Object.keys(zoneStates).forEach((zoneId) => {
      const st = zoneStates[zoneId]
      let el = doc.querySelector(idSelector(zoneId)) as SVGElement
      if (!el) return
      if (!st?.b64) {
        if (el.tagName?.toLowerCase() === "image") {
          (el as SVGImageElement).setAttribute("href", "")
            ; (el as SVGImageElement).setAttribute("xlink:href", "")
          el.removeAttribute("transform")
        }
        return
      }
      // If zone element is not an image (e.g. rect placeholder), create image and replace
      if (el.tagName?.toLowerCase() !== "image") {
        const img = doc.createElementNS(ns, "image")
        img.setAttribute("id", zoneId)
        el.parentNode?.replaceChild(img, el)
        el = img
      }
      const imgEl = el as SVGImageElement

      // Wrap the image in a <g> to isolate the clip-path from the transform
      let wrapper = imgEl.parentNode as SVGGElement | null
      if (wrapper?.tagName?.toLowerCase() !== "g" || wrapper.getAttribute("data-clip-wrapper") !== "true") {
        wrapper = doc.createElementNS(ns, "g")
        wrapper.setAttribute("data-clip-wrapper", "true")
        imgEl.parentNode?.insertBefore(wrapper, imgEl)
        wrapper.appendChild(imgEl)
      }

      const { zoneX, zoneY, zoneW, zoneH, scale, offsetX, offsetY, imgW, imgH } = st
      const sb = Math.max(zoneW / imgW, zoneH / imgH)
      const imgW2 = imgW * sb * scale
      const imgH2 = imgH * sb * scale
      const cx = zoneX + (zoneW - imgW2) / 2 + offsetX
      const cy = zoneY + (zoneH - imgH2) / 2 + offsetY
      imgEl.setAttribute("href", st.b64)
      imgEl.setAttribute("xlink:href", st.b64)
      imgEl.setAttribute("x", String(cx))
      imgEl.setAttribute("y", String(cy))
      imgEl.setAttribute("width", String(imgW2))
      imgEl.setAttribute("height", String(imgH2))
      imgEl.setAttribute("preserveAspectRatio", "none")
      if (st.flipH) {
        imgEl.setAttribute("transform", `translate(${cx * 2 + imgW2}, 0) scale(-1, 1)`)
      } else {
        imgEl.removeAttribute("transform")
      }
      if (st.hasClip && st.existingClipId) {
        wrapper.setAttribute("clip-path", st.existingClipId)
        imgEl.removeAttribute("clip-path")
      } else {
        // Create clipPath for zone bounds so image is clipped to zone
        const clipId = "clip_" + zoneId.replace(/[^a-z0-9_-]/gi, "_")
        let defs = doc.querySelector("defs")
        if (!defs) {
          defs = doc.createElementNS(ns, "defs")
          doc.documentElement.insertBefore(defs, doc.documentElement.firstChild)
        }
        if (!doc.getElementById(clipId)) {
          const clip = doc.createElementNS(ns, "clipPath")
          clip.setAttribute("id", clipId)
          const r = doc.createElementNS(ns, "rect")
          r.setAttribute("x", String(zoneX))
          r.setAttribute("y", String(zoneY))
          r.setAttribute("width", String(zoneW))
          r.setAttribute("height", String(zoneH))
          clip.appendChild(r)
          defs.appendChild(clip)
        }
        wrapper.setAttribute("clip-path", `url(#${clipId})`)
        imgEl.removeAttribute("clip-path")
      }
    })
  }, [zoneStates])

  // Render preview and attach handlers
  useEffect(() => {
    const container = previewContainerRef.current
    const doc = svgDocRef.current
    if (!container || !doc || previewVersion === 0) return

    // Rotation is supported for stickers only; strip any saved transforms on editable text.
    textFields.forEach(({ id }) => {
      const el = doc.querySelector(idSelector(id)) as SVGElement | null
      if (!el) return
      el.removeAttribute("transform")
      el.removeAttribute("data-rotation-angle")
    })

    const previewDoc = cloneSvgDocument(doc)
    if (!previewDoc) return
    const svgEl = previewDoc.documentElement as unknown as SVGElement
    svgEl.setAttribute("style", "max-width:100%;max-height:100%;display:block;border-radius:var(--rounded-md);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;overflow:hidden;")
    const { w: svgW, h: svgH } = getSVGElementSize(svgEl)
    // const { w: svgElW, h: svgElH } = getSVGElementSize(svgEl)
    if (!svgEl.getAttribute("viewBox")) {
      svgEl.setAttribute("viewBox", "0 0 " + svgW + " " + svgH)
    }

    const ns = "http://www.w3.org/2000/svg"

    const parseRotate = (transformAttr: string | null): { angle: number; px: number; py: number; raw: string } | null => {
      if (!transformAttr) return null
      const m = transformAttr.match(/rotate\(\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\)/)
      if (!m) return null
      const angle = parseFloat(m[1] || "")
      const px = parseFloat(m[2] || "")
      const py = parseFloat(m[3] || "")
      if (!Number.isFinite(angle) || !Number.isFinite(px) || !Number.isFinite(py)) return null
      return { angle, px, py, raw: `rotate(${angle} ${px} ${py})` }
    }

    // Center crosshair guide (thin cross through SVG center)
    const centerGuideVId = "center-guide-v"
    const centerGuideHId = "center-guide-h"
    let centerV = previewDoc.getElementById(centerGuideVId) as SVGLineElement | null
    if (!centerV) {
      centerV = previewDoc.createElementNS(ns, "line")
      centerV.setAttribute("id", centerGuideVId)
      centerV.setAttribute("x1", String(svgW / 2))
      centerV.setAttribute("y1", "0")
      centerV.setAttribute("x2", String(svgW / 2))
      centerV.setAttribute("y2", String(svgH))
      centerV.setAttribute("stroke", "#378ADD")
      centerV.setAttribute("stroke-width", "0.8")
      centerV.setAttribute("stroke-dasharray", "3 3")
      centerV.setAttribute("pointer-events", "none")
      svgEl.insertBefore(centerV, svgEl.firstChild)
    }
    let centerH = previewDoc.getElementById(centerGuideHId) as SVGLineElement | null
    if (!centerH) {
      centerH = previewDoc.createElementNS(ns, "line")
      centerH.setAttribute("id", centerGuideHId)
      centerH.setAttribute("x1", "0")
      centerH.setAttribute("y1", String(svgH / 2))
      centerH.setAttribute("x2", String(svgW))
      centerH.setAttribute("y2", String(svgH / 2))
      centerH.setAttribute("stroke", "#378ADD")
      centerH.setAttribute("stroke-width", "0.8")
      centerH.setAttribute("stroke-dasharray", "3 3")
      centerH.setAttribute("pointer-events", "none")
      svgEl.insertBefore(centerH, svgEl.firstChild)
    }

    // Image zone overlays
    Object.entries(zoneStates).forEach(([zoneId, st]) => {
      const clipBounds = st.hasClip && st.existingClipId ? getClipBounds(previewDoc, st.existingClipId) : null
      const zoneX = clipBounds ? clipBounds.x : st.zoneX
      const zoneY = clipBounds ? clipBounds.y : st.zoneY
      const zoneW = clipBounds ? clipBounds.w : st.zoneW
      const zoneH = clipBounds ? clipBounds.h : st.zoneH
      if (!st.b64) {
        const cx = zoneX + zoneW / 2
        const cy = zoneY + zoneH / 2
        const r = Math.min(zoneW, zoneH) * 0.09
        const is = r * 0.52
        const g = previewDoc.createElementNS(ns, "g")
        g.setAttribute("id", "upload_icon_" + zoneId)
        g.setAttribute("pointer-events", "none")
        const circ = previewDoc.createElementNS(ns, "circle")
        circ.setAttribute("cx", String(cx))
        circ.setAttribute("cy", String(cy))
        circ.setAttribute("r", String(r))
        circ.setAttribute("fill", "rgba(55,138,221,0.13)")
        circ.setAttribute("stroke", "rgba(55,138,221,0.4)")
        circ.setAttribute("stroke-width", "1")
        g.appendChild(circ)
          ;[
            [cx, cy + is * 0.35, cx, cy - is * 0.45],
            [cx, cy - is * 0.45, cx - is * 0.32, cy - is * 0.13],
            [cx, cy - is * 0.45, cx + is * 0.32, cy - is * 0.13],
            [cx - is * 0.38, cy + is * 0.38, cx + is * 0.38, cy + is * 0.38],
          ].forEach(([x1, y1, x2, y2]) => {
            const l = previewDoc.createElementNS(ns, "line")
            l.setAttribute("x1", String(x1))
            l.setAttribute("y1", String(y1))
            l.setAttribute("x2", String(x2))
            l.setAttribute("y2", String(y2))
            l.setAttribute("stroke", "#378ADD")
            l.setAttribute("stroke-width", "1.5")
            l.setAttribute("stroke-linecap", "round")
            g.appendChild(l)
          })
        const hotspot = previewDoc.createElementNS(ns, "rect")
        hotspot.setAttribute("x", String(zoneX))
        hotspot.setAttribute("y", String(zoneY))
        hotspot.setAttribute("width", String(zoneW))
        hotspot.setAttribute("height", String(zoneH))
        hotspot.setAttribute("fill", "transparent")
        hotspot.setAttribute("data-upload-zone", zoneId)
        hotspot.setAttribute("data-empty-upload", "1")
        hotspot.setAttribute("pointer-events", "all")
        hotspot.setAttribute("style", "cursor:pointer")
        if (st.hasClip && st.existingClipId) hotspot.setAttribute("clip-path", st.existingClipId)
        const zoneEl = svgEl.querySelector('#' + CSS.escape(zoneId))
        const next = zoneEl ? zoneEl.nextSibling : null
        if (zoneEl && next) {
          zoneEl.parentNode?.insertBefore(g, next)
          zoneEl.parentNode?.insertBefore(hotspot, next)
        } else if (zoneEl) {
          zoneEl.parentNode?.appendChild(g)
          zoneEl.parentNode?.appendChild(hotspot)
        } else {
          svgEl.appendChild(g)
          svgEl.appendChild(hotspot)
        }
      } else {
        const rect = previewDoc.createElementNS(ns, "rect")
        rect.setAttribute("x", String(zoneX))
        rect.setAttribute("y", String(zoneY))
        rect.setAttribute("width", String(zoneW))
        rect.setAttribute("height", String(zoneH))
        rect.setAttribute("fill", "transparent")
        // Selection box for image zones: draw around the effective clip bounds when clip-path exists.
        rect.setAttribute("stroke", "#378ADD")
        rect.setAttribute("stroke-width", ".5")
        rect.setAttribute("stroke-dasharray", OVERLAY_DASH)
        rect.setAttribute("rx", "2")
        rect.setAttribute("data-img-zone", zoneId)
        rect.setAttribute("style", "cursor:grab")

        svgEl.appendChild(rect)
      }
    })

    // Sticker overlays
    Array.from(svgEl.querySelectorAll<SVGElement>(`[id^="${STICKER_PREFIX}"]`)).forEach((stickerEl) => {
      const sid = stickerEl.getAttribute("id")
      if (!sid) return
      let x = parseFloat(stickerEl.getAttribute("x") || "0")
      let y = parseFloat(stickerEl.getAttribute("y") || "0")
      let w = parseFloat(stickerEl.getAttribute("width") || "0")
      let h = parseFloat(stickerEl.getAttribute("height") || "0")
      if (!(w > 0 && h > 0)) {
        try {
          const b = (stickerEl as unknown as SVGGraphicsElement).getBBox?.()
          if (b && b.width > 0 && b.height > 0) {
            x = b.x
            y = b.y
            w = b.width
            h = b.height
          }
        } catch { }
      }
      if (!(w > 0 && h > 0)) {
        // Keep an overlay node so bounds can be fixed after DOM insertion via getBBox.
        w = 1
        h = 1
      }
      const ov = previewDoc.createElementNS(ns, "rect")
      ov.setAttribute("x", String(x))
      ov.setAttribute("y", String(y))
      ov.setAttribute("width", String(w))
      ov.setAttribute("height", String(h))
      ov.setAttribute("fill", "transparent")
      ov.setAttribute("stroke", "#378ADD")
      ov.setAttribute("stroke-width", ".5")
      ov.setAttribute("stroke-dasharray", OVERLAY_DASH)
      ov.setAttribute("rx", "1")
      ov.setAttribute("style", "cursor:grab")
      ov.setAttribute("data-sticker-zone", sid)
      ov.setAttribute("id", "sticker_overlay_" + sid)
      const rot = parseRotate(stickerEl.getAttribute("transform"))
      if (rot && Math.abs(rot.angle) > 0.0001) ov.setAttribute("transform", rot.raw)
      svgEl.appendChild(ov)
    })

    // Text zone overlays
    textFields.forEach(({ id: tid }) => {
      const tel = svgEl.querySelector(idSelector(tid)) as SVGElement | null
      if (!tel) return
      const { rx, ry, rw, rh } = textOverlayRect(tel)
      const ov = previewDoc.createElementNS(ns, "rect")
      ov.setAttribute("x", String(rx))
      ov.setAttribute("y", String(ry))
      ov.setAttribute("width", String(rw))
      ov.setAttribute("height", String(rh))
      ov.setAttribute("fill", "transparent")
      ov.setAttribute("stroke", "#378ADD")
      ov.setAttribute("stroke-width", ".5")
      ov.setAttribute("stroke-dasharray", OVERLAY_DASH)
      ov.setAttribute("rx", "2")
      ov.setAttribute("style", "cursor:grab")
      ov.setAttribute("data-text-zone", tid)
      ov.setAttribute("id", "overlay_" + tid)
      svgEl.appendChild(ov)
    })

    // Selection state
    let selectedTextId: string | null = null
    let selectedStickerId: string | null = selectedStickerIdState
    let selectedImageZoneId: string | null = selectedImageZoneIdState

    const applySelectionStrokeStyle = (opts?: { txtIds?: string[]; stickerIds?: string[]; imgId?: string | null }) => {
      const txtIds = opts?.txtIds ?? []
      const stickerIds = opts?.stickerIds ?? []
      const imgId = opts?.imgId ?? null
      const ptr = previewPointerRef.current
      paintOverlayBoundingPresentation(svgEl, {
        pointerInsidePreview: ptr.pointerInside,
        hoveredElementId: ptr.hoverId,
        solidTextIds: txtIds,
        solidStickerIds: stickerIds,
        solidImgId: imgId,
        forceShowHint: showInitialHintRef.current
      })
    }

    const renderTextHandles = (tid: string | null) => {
      selectedTextId = tid
      setSelectedTextIdState(tid)
      if (tid) {
        selectedStickerId = null
        selectedImageZoneId = null
        setSelectedStickerIdState(null)
        setSelectedImageZoneIdState(null)
      }
      applySelectionStrokeStyle({ txtIds: tid ? [tid] : [], stickerIds: [], imgId: null })
      // Remove any handles not belonging to this selection
      Array.from(svgEl.querySelectorAll<SVGGElement>('[data-text-handles="1"],[data-multi-handles="1"],[data-sticker-handles="1"]')).forEach((grp) => {
        if (grp.id !== "handles_" + tid) grp.parentNode?.removeChild(grp)
      })
      if (!tid) return
      const ov = svgEl.querySelector("#overlay_" + tid) as SVGRectElement | null
      if (!ov) return
      const x = parseFloat(ov.getAttribute("x") || "0")
      const y = parseFloat(ov.getAttribute("y") || "0")
      const w = parseFloat(ov.getAttribute("width") || "0")
      const h = parseFloat(ov.getAttribute("height") || "0")
      if (!w || !h) return

      let g = svgEl.querySelector("#handles_" + tid) as SVGGElement | null
      const isNew = !g
      if (!g) {
        g = previewDoc.createElementNS(ns, "g")
        g.setAttribute("id", "handles_" + tid)
        g.setAttribute("data-text-handles", "1")
        g.setAttribute("pointer-events", "none")
      }

      const HANDLE_SIZE = Math.max(Math.min(Math.min(w, h) * 0.12, 12), 5)
      const R = HANDLE_SIZE / 2

      const corners: { key: "tl" | "tr" | "bl" | "br"; cx: number; cy: number; cursor: string }[] = [
        { key: "tl", cx: x, cy: y, cursor: "nwse-resize" },
        { key: "tr", cx: x + w, cy: y, cursor: "nesw-resize" },
        { key: "bl", cx: x, cy: y + h, cursor: "nesw-resize" },
        { key: "br", cx: x + w, cy: y + h, cursor: "nwse-resize" },
      ]

      const HIT_PADDING = isMobile ? 3 : 2
      corners.forEach(({ key, cx, cy, cursor }) => {
        let visibleR = g!.querySelector(`rect.visible-handle[data-key="${key}"]`) as SVGRectElement | null
        let hitR = g!.querySelector(`rect.hit-handle[data-text-handle="${key}"]`) as SVGRectElement | null

        if (!visibleR || !hitR) {
          const old = g!.querySelector(`[data-text-handle="${key}"]`)
          if (old && !old.classList.contains("hit-handle")) old.parentNode?.removeChild(old)

          visibleR = previewDoc.createElementNS(ns, "rect")
          visibleR.setAttribute("class", "visible-handle")
          visibleR.setAttribute("data-key", key)
          visibleR.setAttribute("fill", "#ffffff")
          visibleR.setAttribute("stroke", "#378ADD")
          visibleR.setAttribute("stroke-width", "0.8")
          visibleR.setAttribute("pointer-events", "none")
          g!.appendChild(visibleR)

          hitR = previewDoc.createElementNS(ns, "rect")
          hitR.setAttribute("class", "hit-handle")
          hitR.setAttribute("fill", "transparent")
          hitR.setAttribute("pointer-events", "all")
          hitR.setAttribute("data-text-handle", key)
          hitR.setAttribute("data-text-id", tid)
          g!.appendChild(hitR)
        }

        visibleR.setAttribute("x", String(cx - R))
        visibleR.setAttribute("y", String(cy - R))
        visibleR.setAttribute("width", String(HANDLE_SIZE))
        visibleR.setAttribute("height", String(HANDLE_SIZE))
        visibleR.setAttribute("rx", String(Math.max(1, HANDLE_SIZE * 0.25)))

        hitR.setAttribute("x", String(cx - R - HIT_PADDING))
        hitR.setAttribute("y", String(cy - R - HIT_PADDING))
        hitR.setAttribute("width", String(HANDLE_SIZE + HIT_PADDING * 2))
        hitR.setAttribute("height", String(HANDLE_SIZE + HIT_PADDING * 2))
        hitR.setAttribute("style", "cursor:" + cursor)
      })

      if (isMobile) {
        const mx = x + w / 2
        const my = y + h + 25

        let line = g!.querySelector("line[data-drag-line='1']") as SVGLineElement | null
        if (!line) {
          line = previewDoc.createElementNS(ns, "line")
          line.setAttribute("data-drag-line", "1")
          line.setAttribute("stroke", "#378ADD")
          line.setAttribute("stroke-width", "1.5")
          line.setAttribute("stroke-dasharray", "3 3")
          g!.appendChild(line)
        }
        line.setAttribute("x1", String(mx))
        line.setAttribute("y1", String(y + h + R))
        line.setAttribute("x2", String(mx))
        line.setAttribute("y2", String(my))

        let dragG = g!.querySelector("[data-drag-handle='1']") as SVGGElement | null
        if (!dragG) {
          dragG = previewDoc.createElementNS(ns, "g")
          dragG.setAttribute("data-drag-handle", "1")
          dragG.setAttribute("data-drag-type", "txt")
          dragG.setAttribute("data-drag-id", tid)
          dragG.setAttribute("style", "cursor: move; pointer-events: all;")

          const innerG = previewDoc.createElementNS(ns, "g")
          innerG.setAttribute("class", "mobile-drag-icon")
          innerG.setAttribute("style", "transform-origin: 0px 0px;")

          const circ = previewDoc.createElementNS(ns, "circle")
          circ.setAttribute("cx", "0")
          circ.setAttribute("cy", "0")
          circ.setAttribute("r", "10")
          circ.setAttribute("fill", "rgba(255, 255, 255, 0.75)")
          circ.setAttribute("stroke", "#378ADD")
          circ.setAttribute("stroke-width", ".8")
          innerG.appendChild(circ)

          const iconPath = previewDoc.createElementNS(ns, "path")
          iconPath.setAttribute("d", "M-4 -2 L-6 0 L-4 2 M-2 -4 L0 -6 L2 -4 M-2 4 L0 6 L2 4 M4 -2 L6 0 L4 2 M-6 0 L6 0 M0 -6 L0 6")
          iconPath.setAttribute("fill", "none")
          iconPath.setAttribute("stroke", "#378ADD")
          iconPath.setAttribute("stroke-width", ".8")
          iconPath.setAttribute("stroke-linecap", "round")
          iconPath.setAttribute("stroke-linejoin", "round")
          innerG.appendChild(iconPath)

          dragG.appendChild(innerG)
          g!.appendChild(dragG)
        }
        dragG.setAttribute("transform", `translate(${mx}, ${my})`)
      }

      if (isNew) {
        svgEl.appendChild(g!)
      }
    }

    const renderStickerHandles = (sid: string | null) => {
      selectedStickerId = sid
      setSelectedStickerIdState(sid)
      if (sid) {
        selectedTextId = null
        selectedImageZoneId = null
        setSelectedTextIdState(null)
        setSelectedImageZoneIdState(null)
      }
      applySelectionStrokeStyle({ txtIds: [], stickerIds: sid ? [sid] : [], imgId: null })
      Array.from(svgEl.querySelectorAll<SVGGElement>('[data-text-handles="1"],[data-multi-handles="1"],[data-sticker-handles="1"]')).forEach((grp) => {
        if (grp.id !== "handles_sticker_" + sid) grp.parentNode?.removeChild(grp)
      })
      if (!sid) return
      const ov = svgEl.querySelector("#sticker_overlay_" + sid) as SVGRectElement | null
      if (!ov) return
      const x = parseFloat(ov.getAttribute("x") || "0")
      const y = parseFloat(ov.getAttribute("y") || "0")
      const w = parseFloat(ov.getAttribute("width") || "0")
      const h = parseFloat(ov.getAttribute("height") || "0")
      if (!w || !h) return

      const liveSticker = svgEl.querySelector(idSelector(sid)) as SVGElement | null
      const pivotX = x + w / 2
      const pivotY = y + h / 2
      const angleDeg = liveSticker ? parseFloat(liveSticker.getAttribute("data-rotation-angle") || "") : NaN
      const angle = Number.isFinite(angleDeg) ? angleDeg : 0
      if (Math.abs(angle) > 0.0001) {
        ov.setAttribute("transform", `rotate(${angle} ${pivotX} ${pivotY})`)
      } else {
        ov.removeAttribute("transform")
      }

      let g = svgEl.querySelector("#handles_sticker_" + sid) as SVGGElement | null
      const isNew = !g
      if (!g) {
        g = previewDoc.createElementNS(ns, "g")
        g.setAttribute("id", "handles_sticker_" + sid)
        g.setAttribute("data-sticker-handles", "1")
        g.setAttribute("pointer-events", "none")
      }

      const handleSize = Math.max(Math.min(Math.min(w, h) * 0.12, 12), 5)
      const r = handleSize / 2
      const corners: { key: "tl" | "tr" | "bl" | "br"; cx: number; cy: number; cursor: string }[] = [
        { key: "tl", cx: x, cy: y, cursor: "nwse-resize" },
        { key: "tr", cx: x + w, cy: y, cursor: "nesw-resize" },
        { key: "bl", cx: x, cy: y + h, cursor: "nesw-resize" },
        { key: "br", cx: x + w, cy: y + h, cursor: "nwse-resize" },
      ]
      const HIT_PADDING = isMobile ? 2 : 2
      corners.forEach(({ key, cx, cy, cursor }) => {
        let visibleR = g!.querySelector(`rect.visible-handle[data-key="${key}"]`) as SVGRectElement | null
        let hitR = g!.querySelector(`rect.hit-handle[data-sticker-handle="${key}"]`) as SVGRectElement | null

        if (!visibleR || !hitR) {
          const old = g!.querySelector(`[data-sticker-handle="${key}"]`)
          if (old && !old.classList.contains("hit-handle")) old.parentNode?.removeChild(old)

          visibleR = previewDoc.createElementNS(ns, "rect")
          visibleR.setAttribute("class", "visible-handle")
          visibleR.setAttribute("data-key", key)
          visibleR.setAttribute("fill", "#ffffff")
          visibleR.setAttribute("stroke", "#378ADD")
          visibleR.setAttribute("stroke-width", "0.8")
          visibleR.setAttribute("pointer-events", "none")
          g!.appendChild(visibleR)

          hitR = previewDoc.createElementNS(ns, "rect")
          hitR.setAttribute("class", "hit-handle")
          hitR.setAttribute("fill", "transparent")
          hitR.setAttribute("pointer-events", "all")
          hitR.setAttribute("data-sticker-handle", key)
          hitR.setAttribute("data-sticker-id", sid)
          g!.appendChild(hitR)
        }

        visibleR.setAttribute("x", String(cx - r))
        visibleR.setAttribute("y", String(cy - r))
        visibleR.setAttribute("width", String(handleSize))
        visibleR.setAttribute("height", String(handleSize))
        visibleR.setAttribute("rx", String(Math.max(1, handleSize * 0.25)))

        hitR.setAttribute("x", String(cx - r - HIT_PADDING))
        hitR.setAttribute("y", String(cy - r - HIT_PADDING))
        hitR.setAttribute("width", String(handleSize + HIT_PADDING * 2))
        hitR.setAttribute("height", String(handleSize + HIT_PADDING * 2))
        hitR.setAttribute("style", "cursor:" + cursor)
      })

      // Rotation handle (free rotation).
      const ROT_SIZE = Math.max(Math.min(handleSize * 0.95, 14), 6)
      const rotR = ROT_SIZE / 2
      const rotCx = pivotX
      const rotCy = y - ROT_SIZE * 0.7
      let visibleRot = g!.querySelector("rect.visible-handle[data-rotate-handle='1']") as SVGRectElement | null
      let hitRot = g!.querySelector("rect.hit-handle[data-rotate-handle='1']") as SVGRectElement | null

      if (!visibleRot || !hitRot) {
        const old = g!.querySelector("rect[data-rotate-handle='1']")
        if (old && !old.classList.contains("hit-handle")) old.parentNode?.removeChild(old)

        visibleRot = previewDoc.createElementNS(ns, "rect")
        visibleRot.setAttribute("class", "visible-handle")
        visibleRot.setAttribute("fill", "#ffffff")
        visibleRot.setAttribute("stroke", "#378ADD")
        visibleRot.setAttribute("stroke-width", "0.8")
        visibleRot.setAttribute("pointer-events", "none")
        visibleRot.setAttribute("data-rotate-handle", "1")
        g!.appendChild(visibleRot)

        hitRot = previewDoc.createElementNS(ns, "rect")
        hitRot.setAttribute("class", "hit-handle")
        hitRot.setAttribute("fill", "transparent")
        hitRot.setAttribute("pointer-events", "all")
        hitRot.setAttribute("data-rotate-handle", "1")
        hitRot.setAttribute("data-rotate-kind", "sticker")
        hitRot.setAttribute("data-rotate-id", sid)
        hitRot.setAttribute("style", "cursor:grab")
        g!.appendChild(hitRot)
      }

      visibleRot.setAttribute("x", String(rotCx - rotR))
      visibleRot.setAttribute("y", String(rotCy - rotR))
      visibleRot.setAttribute("width", String(ROT_SIZE))
      visibleRot.setAttribute("height", String(ROT_SIZE))
      visibleRot.setAttribute("rx", String(Math.max(1, ROT_SIZE * 0.5))) // circular

      hitRot.setAttribute("x", String(rotCx - rotR - HIT_PADDING))
      hitRot.setAttribute("y", String(rotCy - rotR - HIT_PADDING))
      hitRot.setAttribute("width", String(ROT_SIZE + HIT_PADDING * 2))
      hitRot.setAttribute("height", String(ROT_SIZE + HIT_PADDING * 2))

      if (isMobile) {
        const mx = x + w / 2
        const my = y + h + 25

        let line = g!.querySelector("line[data-drag-line='1']") as SVGLineElement | null
        if (!line) {
          line = previewDoc.createElementNS(ns, "line")
          line.setAttribute("data-drag-line", "1")
          line.setAttribute("stroke", "#378ADD")
          line.setAttribute("stroke-width", "1.5")
          line.setAttribute("stroke-dasharray", "3 3")
          g!.appendChild(line)
        }
        line.setAttribute("x1", String(mx))
        line.setAttribute("y1", String(y + h + r))
        line.setAttribute("x2", String(mx))
        line.setAttribute("y2", String(my))

        let dragG = g!.querySelector("[data-drag-handle='1']") as SVGGElement | null
        if (!dragG) {
          dragG = previewDoc.createElementNS(ns, "g")
          dragG.setAttribute("data-drag-handle", "1")
          dragG.setAttribute("data-drag-type", "sticker")
          dragG.setAttribute("data-drag-id", sid)
          dragG.setAttribute("style", "cursor: move; pointer-events: all;")

          const innerG = previewDoc.createElementNS(ns, "g")
          innerG.setAttribute("class", "mobile-drag-icon")
          innerG.setAttribute("style", "transform-origin: 0px 0px;")

          const circ = previewDoc.createElementNS(ns, "circle")
          circ.setAttribute("cx", "0")
          circ.setAttribute("cy", "0")
          circ.setAttribute("r", "10")
          circ.setAttribute("fill", "rgba(255, 255, 255, 0.75)")
          circ.setAttribute("stroke", "#378ADD")
          circ.setAttribute("stroke-width", "0.8")
          innerG.appendChild(circ)

          const iconPath = previewDoc.createElementNS(ns, "path")
          iconPath.setAttribute("d", "M-4 -2 L-6 0 L-4 2 M-2 -4 L0 -6 L2 -4 M-2 4 L0 6 L2 4 M4 -2 L6 0 L4 2 M-6 0 L6 0 M0 -6 L0 6")
          iconPath.setAttribute("fill", "none")
          iconPath.setAttribute("stroke", "#378ADD")
          iconPath.setAttribute("stroke-width", "0.8")
          iconPath.setAttribute("stroke-linecap", "round")
          iconPath.setAttribute("stroke-linejoin", "round")
          innerG.appendChild(iconPath)

          dragG.appendChild(innerG)
          g!.appendChild(dragG)
        }
        dragG.setAttribute("transform", `translate(${mx}, ${my})`)
      }

      if (Math.abs(angle) > 0.0001) {
        g!.setAttribute("transform", `rotate(${angle} ${pivotX} ${pivotY})`)
      } else {
        g!.removeAttribute("transform")
      }

      if (isNew) {
        svgEl.appendChild(g!)
      }
    }

    const getMultiSelectionBox = (idsTxt: string[], idsSticker: string[]) => {
      const txtBoxes = idsTxt
        .map((id) => {
          const ov = svgEl.querySelector("#overlay_" + id) as SVGRectElement | null
          if (!ov) return null
          const x = parseFloat(ov.getAttribute("x") || "")
          const y = parseFloat(ov.getAttribute("y") || "")
          const w = parseFloat(ov.getAttribute("width") || "")
          const h = parseFloat(ov.getAttribute("height") || "")
          if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
          return { x, y, w, h }
        })
        .filter((b): b is { x: number; y: number; w: number; h: number } => Boolean(b))

      const stickerBoxes = idsSticker
        .map((id) => {
          const ov = svgEl.querySelector("#sticker_overlay_" + id) as SVGRectElement | null
          if (!ov) return null
          const x = parseFloat(ov.getAttribute("x") || "")
          const y = parseFloat(ov.getAttribute("y") || "")
          const w = parseFloat(ov.getAttribute("width") || "")
          const h = parseFloat(ov.getAttribute("height") || "")
          if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
          return { x, y, w, h }
        })
        .filter((b): b is { x: number; y: number; w: number; h: number } => Boolean(b))

      const all = [...txtBoxes, ...stickerBoxes]
      if (all.length === 0) return null
      const left = Math.min(...all.map((b) => b.x))
      const top = Math.min(...all.map((b) => b.y))
      const right = Math.max(...all.map((b) => b.x + b.w))
      const bottom = Math.max(...all.map((b) => b.y + b.h))
      return { x: left, y: top, w: right - left, h: bottom - top }
    }

    const renderMultiSelectionHandles = (
      idsTxt: string[],
      idsSticker: string[],
      boxOverride?: { x: number; y: number; w: number; h: number } | null
    ) => {
      Array.from(
        svgEl.querySelectorAll<SVGGElement>('[data-text-handles="1"],[data-sticker-handles="1"],[data-multi-handles="1"]')
      ).forEach((grp) => {
        if (grp.id !== "handles_multi") grp.parentNode?.removeChild(grp)
      })
      if (idsTxt.length + idsSticker.length <= 1) return
      const box = boxOverride || getMultiSelectionBox(idsTxt, idsSticker)
      if (!box || !box.w || !box.h) return

      let g = svgEl.querySelector("#handles_multi") as SVGGElement | null
      const isNew = !g
      if (!g) {
        g = previewDoc.createElementNS(ns, "g")
        g.setAttribute("id", "handles_multi")
        g.setAttribute("data-multi-handles", "1")
        g.setAttribute("pointer-events", "none")
      }

      const handleSize = Math.max(Math.min(Math.min(box.w, box.h) * 0.12, 14), 6)
      const r = handleSize / 2
      const corners: { key: "tl" | "tr" | "bl" | "br"; cx: number; cy: number; cursor: string }[] = [
        { key: "tl", cx: box.x, cy: box.y, cursor: "nwse-resize" },
        { key: "tr", cx: box.x + box.w, cy: box.y, cursor: "nesw-resize" },
        { key: "bl", cx: box.x, cy: box.y + box.h, cursor: "nesw-resize" },
        { key: "br", cx: box.x + box.w, cy: box.y + box.h, cursor: "nwse-resize" },
      ]
      const HIT_PADDING = isMobile ? 2 : 2
      corners.forEach(({ key, cx, cy, cursor }) => {
        let visibleR = g!.querySelector(`rect.visible-handle[data-key="${key}"]`) as SVGRectElement | null
        let hitR = g!.querySelector(`rect.hit-handle[data-multi-handle="${key}"]`) as SVGRectElement | null

        if (!visibleR || !hitR) {
          const old = g!.querySelector(`[data-multi-handle="${key}"]`)
          if (old && !old.classList.contains("hit-handle")) old.parentNode?.removeChild(old)

          visibleR = previewDoc.createElementNS(ns, "rect")
          visibleR.setAttribute("class", "visible-handle")
          visibleR.setAttribute("data-key", key)
          visibleR.setAttribute("fill", "#ffffff")
          visibleR.setAttribute("stroke", "#378ADD")
          visibleR.setAttribute("stroke-width", "0.9")
          visibleR.setAttribute("pointer-events", "none")
          g!.appendChild(visibleR)

          hitR = previewDoc.createElementNS(ns, "rect")
          hitR.setAttribute("class", "hit-handle")
          hitR.setAttribute("fill", "transparent")
          hitR.setAttribute("pointer-events", "all")
          hitR.setAttribute("data-multi-handle", key)
          g!.appendChild(hitR)
        }

        visibleR.setAttribute("x", String(cx - r))
        visibleR.setAttribute("y", String(cy - r))
        visibleR.setAttribute("width", String(handleSize))
        visibleR.setAttribute("height", String(handleSize))
        visibleR.setAttribute("rx", String(Math.max(1, handleSize * 0.25)))

        hitR.setAttribute("x", String(cx - r - HIT_PADDING))
        hitR.setAttribute("y", String(cy - r - HIT_PADDING))
        hitR.setAttribute("width", String(handleSize + HIT_PADDING * 2))
        hitR.setAttribute("height", String(handleSize + HIT_PADDING * 2))
        hitR.setAttribute("style", "cursor:" + cursor)
      })

      if (isMobile) {
        const mx = box.x + box.w / 2
        const my = box.y + box.h + 25

        let line = g!.querySelector("line[data-drag-line='1']") as SVGLineElement | null
        if (!line) {
          line = previewDoc.createElementNS(ns, "line")
          line.setAttribute("data-drag-line", "1")
          line.setAttribute("stroke", "#378ADD")
          line.setAttribute("stroke-width", "1.5")
          line.setAttribute("stroke-dasharray", "3 3")
          g!.appendChild(line)
        }
        line.setAttribute("x1", String(mx))
        line.setAttribute("y1", String(box.y + box.h + r))
        line.setAttribute("x2", String(mx))
        line.setAttribute("y2", String(my))

        let dragG = g!.querySelector("[data-drag-handle='1']") as SVGGElement | null
        if (!dragG) {
          dragG = previewDoc.createElementNS(ns, "g")
          dragG.setAttribute("data-drag-handle", "1")
          dragG.setAttribute("data-drag-type", "multi")
          dragG.setAttribute("data-drag-id", "multi")
          dragG.setAttribute("style", "cursor: move; pointer-events: all;")

          const innerG = previewDoc.createElementNS(ns, "g")
          innerG.setAttribute("class", "mobile-drag-icon")
          innerG.setAttribute("style", "transform-origin: 0px 0px;")

          const circ = previewDoc.createElementNS(ns, "circle")
          circ.setAttribute("cx", "0")
          circ.setAttribute("cy", "0")
          circ.setAttribute("r", "10")
          circ.setAttribute("fill", "rgba(255, 255, 255, 0.75)")
          circ.setAttribute("stroke", "#378ADD")
          circ.setAttribute("stroke-width", "0.8")
          innerG.appendChild(circ)

          const iconPath = previewDoc.createElementNS(ns, "path")
          iconPath.setAttribute("d", "M-4 -2 L-6 0 L-4 2 M-2 -4 L0 -6 L2 -4 M-2 4 L0 6 L2 4 M4 -2 L6 0 L4 2 M-6 0 L6 0 M0 -6 L0 6")
          iconPath.setAttribute("fill", "none")
          iconPath.setAttribute("stroke", "#378ADD")
          iconPath.setAttribute("stroke-width", "0.8")
          iconPath.setAttribute("stroke-linecap", "round")
          iconPath.setAttribute("stroke-linejoin", "round")
          innerG.appendChild(iconPath)

          dragG.appendChild(innerG)
          g!.appendChild(dragG)
        }
        dragG.setAttribute("transform", `translate(${mx}, ${my})`)
      }

      if (isNew) {
        svgEl.appendChild(g!)
      }
    }

    const buildMultiSelectionDragState = (
      idsTxt: string[],
      idsSticker: string[],
      overlayEl: Element,
      startClientX: number,
      startClientY: number
    ): Extract<DragState, { type: "multi" }> | null => {
      const { sx, sy } = getScale()
      Array.from(svgEl.querySelectorAll<SVGGElement>('[data-text-handles="1"],[data-sticker-handles="1"],[data-multi-handles="1"]')).forEach((g) => {
        if (g.id !== "handles_multi") g.parentNode?.removeChild(g)
      })
      const startTxt: Record<string, { tspanXY: { x: number; y: number }[]; x: number; y: number }> = {}
      const startTxtOverlay: Record<string, { x: number; y: number; w: number; h: number }> = {}
      const startSticker: Record<string, { x: number; y: number; w: number; h: number; angle: number | null }> = {}
      const startStickerOverlay: Record<string, { x: number; y: number; w: number; h: number }> = {}

      idsTxt.forEach((id) => {
        const live = svgEl.querySelector(idSelector(id)) as SVGElement | null
        if (!live) return
        const tspans = Array.from(live.querySelectorAll("tspan")) as SVGElement[]
        if (tspans.length) {
          startTxt[id] = {
            tspanXY: tspans.map((t) => ({ x: parseFloat(t.getAttribute("x") || "0"), y: parseFloat(t.getAttribute("y") || "0") })),
            x: 0,
            y: 0,
          }
        } else {
          startTxt[id] = {
            tspanXY: [],
            x: parseFloat(live.getAttribute("x") || "0"),
            y: parseFloat(live.getAttribute("y") || "0"),
          }
        }
        const ov = svgEl.querySelector("#overlay_" + id) as SVGRectElement | null
        if (ov) {
          startTxtOverlay[id] = {
            x: parseFloat(ov.getAttribute("x") || "0"),
            y: parseFloat(ov.getAttribute("y") || "0"),
            w: parseFloat(ov.getAttribute("width") || "0"),
            h: parseFloat(ov.getAttribute("height") || "0"),
          }
        }
      })

      idsSticker.forEach((id) => {
        const live = svgEl.querySelector(idSelector(id)) as SVGElement | null
        if (!live) return
        startSticker[id] = {
          x: parseFloat(live.getAttribute("x") || "0"),
          y: parseFloat(live.getAttribute("y") || "0"),
          w: parseFloat(live.getAttribute("width") || "0"),
          h: parseFloat(live.getAttribute("height") || "0"),
          angle: (() => {
            const angle = parseFloat(live.getAttribute("data-rotation-angle") || "")
            return Number.isFinite(angle) ? angle : null
          })(),
        }
        const ov = svgEl.querySelector("#sticker_overlay_" + id) as SVGRectElement | null
        if (ov) {
          startStickerOverlay[id] = {
            x: parseFloat(ov.getAttribute("x") || "0"),
            y: parseFloat(ov.getAttribute("y") || "0"),
            w: parseFloat(ov.getAttribute("width") || "0"),
            h: parseFloat(ov.getAttribute("height") || "0"),
          }
        }
      })

      const allBoxes = [...Object.values(startTxtOverlay), ...Object.values(startStickerOverlay)]
      if (allBoxes.length === 0) return null
      const left = Math.min(...allBoxes.map((b) => b.x))
      const top = Math.min(...allBoxes.map((b) => b.y))
      const right = Math.max(...allBoxes.map((b) => b.x + b.w))
      const bottom = Math.max(...allBoxes.map((b) => b.y + b.h))

      return {
        type: "multi",
        idsTxt: [...idsTxt],
        idsSticker: [...idsSticker],
        overlay: overlayEl,
        sx,
        sy,
        startX: startClientX,
        startY: startClientY,
        startTxt,
        startTxtOverlay,
        startSticker,
        startStickerOverlay,
        groupBox: {
          x: left,
          y: top,
          w: right - left,
          h: bottom - top,
        },
        moved: false,
      }
    }

    const buildMultiSelectionResizeState = (
      idsTxt: string[],
      idsSticker: string[],
      handleEl: Element,
      startClientX: number,
      startClientY: number,
      corner: "tl" | "tr" | "bl" | "br"
    ): Extract<DragState, { type: "multiResize" }> | null => {
      const base = buildMultiSelectionDragState(idsTxt, idsSticker, handleEl, startClientX, startClientY)
      if (!base) return null
      const startTxtFontSize: Record<string, number> = {}
      idsTxt.forEach((id) => {
        const live = svgEl.querySelector(idSelector(id)) as SVGElement | null
        if (!live) return
        const leaf = getLeafTspans(live)[0]
        const fromLeaf = leaf ? parseFloat(leaf.getAttribute("font-size") || "") : NaN
        const fromEl = parseFloat(live.getAttribute("font-size") || "")
        const cs = typeof window !== "undefined" ? window.getComputedStyle((leaf || live) as any) : null
        const fromComputed = cs ? parseFloat(cs.fontSize || "") : NaN
        const next = Number.isFinite(fromLeaf) && fromLeaf > 0 ? fromLeaf : Number.isFinite(fromEl) && fromEl > 0 ? fromEl : fromComputed
        if (Number.isFinite(next) && next > 0) startTxtFontSize[id] = next
      })
      const gx = base.groupBox.x
      const gy = base.groupBox.y
      const gw = base.groupBox.w
      const gh = base.groupBox.h
      const anchors: Record<"tl" | "tr" | "bl" | "br", { x: number; y: number; cx: number; cy: number }> = {
        tl: { x: gx + gw, y: gy + gh, cx: gx, cy: gy },
        tr: { x: gx, y: gy + gh, cx: gx + gw, cy: gy },
        bl: { x: gx + gw, y: gy, cx: gx, cy: gy + gh },
        br: { x: gx, y: gy, cx: gx + gw, cy: gy + gh },
      }
      const c = anchors[corner]
      return {
        ...base,
        type: "multiResize",
        startTxtFontSize,
        corner,
        anchorX: c.x,
        anchorY: c.y,
        startCornerX: c.cx,
        startCornerY: c.cy,
      }
    }

    container.innerHTML = ""
    container.appendChild(svgEl)

    // After inserting into DOM, recompute text overlays using getBBox() (needed for multiline tspans)
    // so that selection/handles use accurate geometry.
    textFields.forEach(({ id: tid }) => {
      const tel = svgEl.querySelector(idSelector(tid)) as SVGElement | null
      const ov = svgEl.querySelector("#overlay_" + tid) as SVGRectElement | null
      if (!tel || !ov) return
      const r = textOverlayRect(tel)
      ov.removeAttribute("transform")
      ov.setAttribute("x", String(r.rx))
      ov.setAttribute("y", String(r.ry))
      ov.setAttribute("width", String(r.rw))
      ov.setAttribute("height", String(r.rh))
    })

    // Recompute sticker overlays from rendered bounds so template stickers that are groups/paths
    // (without x/y/width/height attrs on the root element) still get a correct selector box.
    Array.from(svgEl.querySelectorAll<SVGRectElement>("[data-sticker-zone]")).forEach((ov) => {
      const sid = ov.getAttribute("data-sticker-zone")
      if (!sid) return
      const sel = svgEl.querySelector(idSelector(sid)) as SVGGraphicsElement | null
      if (!sel || typeof sel.getBBox !== "function") return
      try {
        const b = sel.getBBox()
        if (b.width <= 0 || b.height <= 0) return
        ov.setAttribute("x", String(b.x))
        ov.setAttribute("y", String(b.y))
        ov.setAttribute("width", String(b.width))
        ov.setAttribute("height", String(b.height))
      } catch { }
    })

    // Keep latest selection visuals across preview rebuilds.
    const multiTxt = selectedTextIdsRef.current
    const multiStickers = selectedStickerIdsRef.current
    const isMulti = multiTxt.length + multiStickers.length > 1
    if (isMulti) {
      applySelectionStrokeStyle({ txtIds: multiTxt, stickerIds: multiStickers, imgId: null })
      renderMultiSelectionHandles(multiTxt, multiStickers)
    } else if (selectedTextIdState && svgEl.querySelector("#overlay_" + selectedTextIdState)) {
      renderTextHandles(selectedTextIdState)
    } else if (selectedStickerIdState && svgEl.querySelector("#sticker_overlay_" + selectedStickerIdState)) {
      renderStickerHandles(selectedStickerIdState)
    } else if (selectedImageZoneIdState && svgEl.querySelector(`[data-img-zone="${selectedImageZoneIdState}"]`)) {
      selectedImageZoneId = selectedImageZoneIdState
      applySelectionStrokeStyle({ txtIds: [], stickerIds: [], imgId: selectedImageZoneIdState })
    } else {
      applySelectionStrokeStyle({ txtIds: [], stickerIds: [], imgId: null })
    }

    type DragState =
      | {
        type: "img"
        id: string
        overlay: Element
        sx: number
        sy: number
        startX: number
        startY: number
        startOX?: number
        startOY?: number
        startImgX?: number
        startImgY?: number
        moved: boolean
      }
      | {
        type: "txt"
        id: string
        overlay: Element
        sx: number
        sy: number
        startX: number
        startY: number
        startTX?: number
        startTY?: number
        startOverlayX?: number
        startOverlayY?: number
        startOverlayW?: number
        startOverlayH?: number
        moved: boolean
        /** True when this text was already selected before mousedown (second click opens caret). */
        openEditorOnClick: boolean
      }
      | {
        type: "resize"
        id: string
        overlay: Element
        sx: number
        sy: number
        startX: number
        startY: number
        startMouseX: number
        startMouseY: number
        corner: "tl" | "tr" | "bl" | "br"
        anchorX: number
        anchorY: number
        startCornerX: number
        startCornerY: number
        startFontSizePx: number
        startLineStep: number
        startBBox: { x: number; y: number; width: number; height: number }
        startFirstTspanX: number
        startFirstTspanY: number
        startOverlayX: number
        startOverlayY: number
        startOverlayW: number
        startOverlayH: number
        moved: boolean
      }
      | {
        type: "sticker"
        id: string
        overlay: Element
        sx: number
        sy: number
        startX: number
        startY: number
        startStickerX: number
        startStickerY: number
        moved: boolean
      }
      | {
        type: "stickerResize"
        id: string
        overlay: Element
        sx: number
        sy: number
        startX: number
        startY: number
        corner: "tl" | "tr" | "bl" | "br"
        anchorX: number
        anchorY: number
        startCornerX: number
        startCornerY: number
        startW: number
        startH: number
        moved: boolean
      }
      | {
        type: "rotate-sticker"
        id: string
        overlay: Element
        startX: number
        startY: number
        pivotX: number
        pivotY: number
        startAngleDeg: number
        startMouseAngleRad: number
        moved: boolean
      }
      | {
        type: "multi"
        idsTxt: string[]
        idsSticker: string[]
        overlay: Element
        sx: number
        sy: number
        startX: number
        startY: number
        startTxt: Record<string, { tspanXY: { x: number; y: number }[]; x: number; y: number }>
        startTxtOverlay: Record<string, { x: number; y: number; w: number; h: number }>
        startSticker: Record<string, { x: number; y: number; w: number; h: number; angle: number | null }>
        startStickerOverlay: Record<string, { x: number; y: number; w: number; h: number }>
        groupBox: { x: number; y: number; w: number; h: number }
        moved: boolean
      }
      | {
        type: "multiResize"
        idsTxt: string[]
        idsSticker: string[]
        overlay: Element
        sx: number
        sy: number
        startX: number
        startY: number
        startTxt: Record<string, { tspanXY: { x: number; y: number }[]; x: number; y: number }>
        startTxtOverlay: Record<string, { x: number; y: number; w: number; h: number }>
        startTxtFontSize: Record<string, number>
        startSticker: Record<string, { x: number; y: number; w: number; h: number; angle: number | null }>
        startStickerOverlay: Record<string, { x: number; y: number; w: number; h: number }>
        groupBox: { x: number; y: number; w: number; h: number }
        corner: "tl" | "tr" | "bl" | "br"
        anchorX: number
        anchorY: number
        startCornerX: number
        startCornerY: number
        moved: boolean
      }
      | {
        type: "marquee"
        overlay: Element
        startX: number
        startY: number
        startSvgX: number
        startSvgY: number
        rectEl: SVGRectElement
        idsTxt: string[]
        idsSticker: string[]
        moved: boolean
      }

    let drag: DragState | null = null
    let hiddenTextEditorOverlay: HTMLElement | null = null
    let hiddenTextEditorForTid: string | null = null
    let activeInlineEditor: null | { tid: string; commit: (opts?: { bumpPreview?: boolean }) => void } = null



    function getScale() {
      const bbox = svgEl.getBoundingClientRect()
      const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
      return { sx: vb[2] / bbox.width, sy: vb[3] / bbox.height }
    }

    function clientToSvgPoint(clientX: number, clientY: number) {
      const svgRect = svgEl.getBoundingClientRect()
      const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
      const relX = (clientX - svgRect.left) / Math.max(svgRect.width, 1)
      const relY = (clientY - svgRect.top) / Math.max(svgRect.height, 1)
      return { x: vb[0] + relX * vb[2], y: vb[1] + relY * vb[3] }
    }

    function openEditor(tid: string) {
      if (activeInlineEditor) {
        activeInlineEditor.commit()
        activeInlineEditor = null
      }
      let inlineHistoryPushed = false
      const docEl = svgDocRef.current?.querySelector(idSelector(tid))
      if (!docEl) return
      const liveText = svgEl.querySelector(idSelector(tid)) as SVGElement
      if (!liveText) return
      const ov = svgEl.querySelector("#overlay_" + tid)
      const bbox = svgEl.getBoundingClientRect()
      const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
      const ctm = (liveText as unknown as SVGGraphicsElement).getScreenCTM?.()
      const scaleX = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : (bbox.width / vb[2])
      const scaleY = ctm ? Math.sqrt(ctm.c * ctm.c + ctm.d * ctm.d) : (bbox.height / vb[3])
      const st = textOverlayRect(liveText)
      const cs = typeof window !== "undefined" ? window.getComputedStyle(liveText as any) : (null as any)

      const leafTspans = getLeafTspans(liveText)
      // If a template has at least one leaf <tspan>, open a multiline editor so the user can add more lines.
      const isMultiline = leafTspans.length >= 1
      const lines = leafTspans.map((t) => (t.textContent || "").replace(/\u200B/g, ""))
      const txt = isMultiline ? lines.join("\n") : (lines[0] || (liveText.textContent || "").replace(/\u200B/g, ""))
      // Match the effective font-size of the visible SVG text.
      // Many Inkscape templates define font-size on leaf <tspan>s, so parent <text> can differ.
      const firstLeaf = leafTspans[0]
      const leafCs = typeof window !== "undefined" && firstLeaf ? window.getComputedStyle(firstLeaf as any) : null
      const fontFamily = (leafCs?.fontFamily || cs?.fontFamily || "").trim() || st.ff
      const fontWeight = (leafCs?.fontWeight || cs?.fontWeight || "").trim() || st.fw
      const fontStyle = (leafCs?.fontStyle || cs?.fontStyle || "").trim() || "normal"
      const caretColor = (leafCs?.fill || cs?.fill || leafCs?.color || cs?.color || "").trim() || "#000"
      const leafFontSizePx = leafCs ? parseFloat(leafCs.fontSize || "") : NaN
      const textAlign = leafCs?.textAlign || cs?.textAlign || "start"
      // `getComputedStyle(...).fontSize` for SVG text often represents the SVG user-unit size.
      // We need to convert it to CSS pixels using the same scale factors we use for overlay positioning.
      const baseSvgFontSize = parseFloat(cs?.fontSize || "") || st.fs
      const svgFontSizeForOverlay = Number.isFinite(leafFontSizePx) && leafFontSizePx > 0 ? leafFontSizePx : baseSvgFontSize
      const screenFs = svgFontSizeForOverlay * scaleX
      const getOverlayLineHeight = (textEl: SVGElement, leafStyle: CSSStyleDeclaration | null, textStyle: CSSStyleDeclaration | null) => {
        const raw = (leafStyle?.lineHeight || textStyle?.lineHeight || "").trim()
        if (raw && raw !== "normal") return raw
        const leaves = getLeafTspans(textEl)
        if (leaves.length >= 2) {
          const y0 = parseFloat(leaves[0].getAttribute("y") || "")
          const y1 = parseFloat(leaves[1].getAttribute("y") || "")
          if (Number.isFinite(y0) && Number.isFinite(y1)) {
            const dy = Math.abs(y1 - y0)
            if (dy > 0) return dy * scaleY + "px"
          }
        }
        return Math.max(screenFs * 1.25, 1) + "px"
      }

      const editorEl = document.createElement(isMultiline ? "textarea" : "input")
      if (!isMultiline) {
        (editorEl as HTMLInputElement).type = "text"
      } else {
        (editorEl as HTMLTextAreaElement).rows = 1
      }
      editorEl.value = txt
      const supportsTransliteration = transliterationLanguage !== null
      let suggestionItems: string[] = []
      let suggestionItemsWord = ""
      let activeSuggestionIndex = 0
      let transliterationWordRange = { start: 0, end: 0, word: "" }
      let isApplyingSuggestion = false
      let suggestionDebounce: number | null = null
      let suggestionRequestId = 0
      const suggestionsEl = document.createElement("div")
      suggestionsEl.style.cssText =
        "position:fixed;display:none;max-width:420px;padding:8px;background:rgba(255,255,255,0.98);border:1px solid rgb(203 213 225);border-radius:10px;box-shadow:0 8px 20px rgba(15,23,42,0.16);pointer-events:auto;z-index:120;gap:6px;flex-wrap:wrap;align-items:center"
      const liveRect = liveText.getBoundingClientRect()
      const overlayLineHeight = getOverlayLineHeight(liveText, leafCs, cs)
      const csLetterSpacing = cs?.letterSpacing || "normal"

      const closeSuggestions = () => {
        suggestionItems = []
        suggestionItemsWord = ""
        activeSuggestionIndex = 0
        suggestionsEl.style.display = "none"
        suggestionsEl.replaceChildren()
      }

      const syncSuggestionsRect = () => {
        if (suggestionsEl.style.display === "none") return
        const r = editorEl.getBoundingClientRect()
        suggestionsEl.style.left = r.left + "px"
        suggestionsEl.style.top = r.bottom + 6 + "px"
      }

      const syncModelFromEditor = () => {
        if (!inlineHistoryPushed) {
          textHistoryApiRef.current.pushPastBeforeMutation()
          inlineHistoryPushed = true
        }
        const val = normalizeEditableValue(editorEl.value)
        // Call liveText first (in DOM) so getComputedStyle gives real SVG font size → correct stepY.
        // Then pass that stepY to docEl2 (off-DOM) to prevent it from using browser default 16px.
        applyEditableValueToTextEl(liveText, val)
        const liveStep = parseFloat(liveText.getAttribute("data-editor-line-step") || "")
        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid)) as SVGElement | null
        if (docEl2) {
          applyEditableValueToTextEl(docEl2, val, Number.isFinite(liveStep) && liveStep > 0 ? liveStep : undefined)
        }
        updateEditorRect()
        syncSuggestionsRect()
        if (ov) {
          const r = textOverlayRect(liveText)
          const editorHeightPx = editorEl.getBoundingClientRect().height
          const editorHeightSvg = editorHeightPx / Math.max(scaleY, 0.0001)
          const nextHeight = Math.max(r.rh, editorHeightSvg)
            ; (ov as SVGRectElement).setAttribute("x", String(r.rx))
            ; (ov as SVGRectElement).setAttribute("y", String(r.ry))
            ; (ov as SVGRectElement).setAttribute("width", String(r.rw))
            ; (ov as SVGRectElement).setAttribute("height", String(nextHeight))
          renderTextHandles(tid)
        }
        setTextValues((prev) => ({ ...prev, [tid]: val }))
        const panel = panelInputRef.current
        if (panel && selectedTextIdState === tid) panel.value = val
      }

      const applySuggestion = (index: number) => {
        const suggestion = suggestionItems[index]
        if (!suggestion) return
        const value = editorEl.value
        const isAfterSingleSpace = (transliterationWordRange as any).isAfterSingleSpace
        const actualEnd = isAfterSingleSpace ? transliterationWordRange.end + 1 : transliterationWordRange.end
        const nextValue = value.slice(0, transliterationWordRange.start) + suggestion + value.slice(actualEnd)
        const nextCaret = transliterationWordRange.start + suggestion.length
        isApplyingSuggestion = true
        editorEl.value = nextValue
        editorEl.setSelectionRange(nextCaret, nextCaret)
        closeSuggestions()
        syncModelFromEditor()
      }

      const renderSuggestions = () => {
        if (!supportsTransliteration || suggestionItems.length === 0) {
          closeSuggestions()
          return
        }
        suggestionsEl.replaceChildren()
        suggestionItems.forEach((item, idx) => {
          const chip = document.createElement("button")
          chip.type = "button"
          chip.textContent = item
          chip.className =
            "rounded-full border px-2.5 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          chip.style.borderColor = idx === activeSuggestionIndex ? "rgb(59 130 246)" : "rgb(203 213 225)"
          chip.style.background = idx === activeSuggestionIndex ? "rgb(219 234 254)" : "white"
          chip.style.color = "rgb(15 23 42)"
          chip.addEventListener("pointerdown", (evt) => {
            evt.preventDefault()
            applySuggestion(idx)
            editorEl.focus()
          })
          suggestionsEl.appendChild(chip)
        })
        suggestionsEl.style.display = "flex"
        syncSuggestionsRect()
      }

      const scheduleSuggestionLookup = () => {
        if (!supportsTransliteration) return
        if (suggestionDebounce) window.clearTimeout(suggestionDebounce)
        const caret = editorEl.selectionStart ?? editorEl.value.length
        transliterationWordRange = getCurrentWordRange(editorEl.value, caret)
        const word = transliterationWordRange.word.trim()
        if (!word || !isRomanPhoneticWord(word)) {
          closeSuggestions()
          return
        }

        suggestionDebounce = window.setTimeout(async () => {
          const currentReq = ++suggestionRequestId
          const currentWord = transliterationWordRange.word
          try {
            const params = new URLSearchParams({
              word: currentWord,
              language: transliterationLanguage!,
            })
            const response = await fetch("/api/transliteration?" + params.toString(), { cache: "no-store" })
            const payload = (await response.json()) as { suggestions?: string[] }
            if (currentReq !== suggestionRequestId) return
            const apiSuggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : []
            const topSuggestions = Array.from(new Set(apiSuggestions.filter((s) => s !== currentWord))).slice(0, 5)
            suggestionItems = [...topSuggestions, currentWord]
            suggestionItemsWord = currentWord
            activeSuggestionIndex = 0
            renderSuggestions()
          } catch {
            if (currentReq !== suggestionRequestId) return
            closeSuggestions()
          }
        }, 300)
      }

      const updateEditorRect = () => {
        const r = liveText.getBoundingClientRect()
        editorEl.style.transform = ""
        editorEl.style.transformOrigin = ""
        editorEl.style.left = r.left + "px"
        editorEl.style.top = r.top + "px"
        editorEl.style.width = Math.max(r.width, 40) + "px"
        const baseHeight = Math.max(r.height, 1)

        if (isMultiline && editorEl instanceof HTMLTextAreaElement) {
          editorEl.style.height = "auto"
          const contentHeight = Math.max(editorEl.scrollHeight, 1)
          editorEl.style.height = Math.max(baseHeight, contentHeight) + "px"
        } else {
          editorEl.style.height = baseHeight + "px"
        }
        syncSuggestionsRect()
      }

      const onContainerScroll = () => updateEditorRect()
      if (container) container.addEventListener("scroll", onContainerScroll, { passive: true })
      const onGlobalScrollOrResize = () => updateEditorRect()
      window.addEventListener("scroll", onGlobalScrollOrResize, { passive: true, capture: true })
      window.addEventListener("resize", onGlobalScrollOrResize)
      document.addEventListener("scroll", onGlobalScrollOrResize, { passive: true, capture: true })
      const scrollParents: Element[] = []
      let parentEl: Element | null = container?.parentElement || null
      while (parentEl) {
        const ps = window.getComputedStyle(parentEl)
        const isScrollable = /(auto|scroll|overlay)/.test(ps.overflowY) || /(auto|scroll|overlay)/.test(ps.overflowX)
        if (isScrollable) {
          parentEl.addEventListener("scroll", onGlobalScrollOrResize, { passive: true })
          scrollParents.push(parentEl)
        }
        parentEl = parentEl.parentElement
      }
      if (isMultiline) {
        editorEl.style.cssText = `position:fixed;left:${liveRect.left}px;top:${liveRect.top}px;width:${Math.max(liveRect.width, 40)}px;height:${Math.max(liveRect.height, 1)}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};font-style:${fontStyle};line-height:${overlayLineHeight};letter-spacing:${csLetterSpacing};text-align:${textAlign};background:transparent;border:none;outline:none;color:transparent;-webkit-text-fill-color:transparent;caret-color:${caretColor};box-shadow:none;resize:none;z-index:100;padding:0;margin:0;overflow:hidden;white-space:pre;`
      } else {
        editorEl.style.cssText = `position:fixed;left:${liveRect.left}px;top:${liveRect.top}px;width:${Math.max(liveRect.width, 40)}px;height:${Math.max(liveRect.height, 1)}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};font-style:${fontStyle};line-height:${overlayLineHeight};letter-spacing:${csLetterSpacing};text-align:${textAlign};background:transparent;border:none;outline:none;color:transparent;-webkit-text-fill-color:transparent;caret-color:${caretColor};box-shadow:none;resize:none;z-index:100;padding:0;margin:0;overflow:hidden;white-space:pre;`
      }

      // Apply correct position immediately.
      updateEditorRect()

      editorEl.addEventListener("input", () => {
        if (template.language === "hindi" && editorEl.value.includes("|")) {
          editorEl.value = editorEl.value.replace(/\|/g, "।")
        }
        syncModelFromEditor()
        if (!supportsTransliteration) return
        if (isApplyingSuggestion) {
          isApplyingSuggestion = false
          return
        }
        scheduleSuggestionLookup()
      })
      const overlayDiv = document.createElement("div")
      overlayDiv.id = "txt-editor-overlay"
      overlayDiv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;"

      overlayDiv.appendChild(editorEl)
      overlayDiv.appendChild(suggestionsEl)
      let committed = false
      const commit = (opts?: { bumpPreview?: boolean }) => {
        if (suppressEditorCommitRef.current) return
        if (committed) return
        committed = true
        closeSuggestions()
        if (suggestionDebounce) {
          window.clearTimeout(suggestionDebounce)
          suggestionDebounce = null
        }
        suggestionRequestId += 1
        const bumpPreview = opts?.bumpPreview !== false
        if (container) container.removeEventListener("scroll", onContainerScroll)
        window.removeEventListener("scroll", onGlobalScrollOrResize, true)
        window.removeEventListener("resize", onGlobalScrollOrResize)
        document.removeEventListener("scroll", onGlobalScrollOrResize, true)
        scrollParents.forEach((el) => el.removeEventListener("scroll", onGlobalScrollOrResize))
        if (overlayDiv.parentNode) overlayDiv.parentNode.removeChild(overlayDiv)
        const val = normalizeEditableValue(editorEl.value)
        // Apply to liveText (in DOM) first so getComputedStyle gives real SVG font size.
        // Then forward the correct stepY to docEl2 (off-DOM) to keep both in sync.
        if (liveText) {
          applyEditableValueToTextEl(liveText, val)
          liveText.style.display = ""
        }
        const liveStep = liveText ? parseFloat(liveText.getAttribute("data-editor-line-step") || "") : NaN
        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid)) as SVGElement | null
        if (docEl2) {
          applyEditableValueToTextEl(docEl2, val, Number.isFinite(liveStep) && liveStep > 0 ? liveStep : undefined)
        }
        setTextValues((prev) => ({ ...prev, [tid]: val }))
        const panel = panelInputRef.current
        if (panel && selectedTextIdState === tid) panel.value = val
        if (ov && liveText) {
          const r = textOverlayRect(liveText)
            ; (ov as SVGRectElement).setAttribute("x", String(r.rx))
            ; (ov as SVGRectElement).setAttribute("y", String(r.ry))
            ; (ov as SVGRectElement).setAttribute("width", String(r.rw))
            ; (ov as SVGRectElement).setAttribute("height", String(r.rh))
            ; (ov as HTMLElement).style.display = ""
        }
        if (bumpPreview) setPreviewVersion((v) => v + 1)
      }
      activeInlineEditor = { tid, commit }
      editorEl.addEventListener("keydown", async (e) => {
        const ke = e as unknown as KeyboardEvent

        // Intercept fast Enter/Space before suggestions load
        // Intercept fast Enter/Space before suggestions load
        const caret = editorEl.selectionStart ?? editorEl.value.length;
        const range = getCurrentWordRange(editorEl.value, caret);
        const word = range.word.trim();
        const isStale = suggestionItemsWord === "" || word !== suggestionItemsWord.trim();

        if (supportsTransliteration && (suggestionItems.length === 0 || isStale) && (ke.key === "Enter" || ke.key === " ")) {
           if (word && isRomanPhoneticWord(word)) {
               e.preventDefault();
               try {
                   const params = new URLSearchParams({ word, language: transliterationLanguage! });
                   const response = await fetch("/api/transliteration?" + params.toString(), { cache: "no-store" });
                   const payload = await response.json();
                   const apiSuggestions: string[] = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
                   if (apiSuggestions.length > 0) {
                       const suggestion = apiSuggestions[0];
                       const actualEnd = (range as any).isAfterSingleSpace ? range.end + 1 : range.end;
                       editorEl.value = editorEl.value.slice(0, range.start) + suggestion + editorEl.value.slice(actualEnd);
                       editorEl.setSelectionRange(range.start + suggestion.length, range.start + suggestion.length);
                       syncModelFromEditor();
                   }
               } catch (err) {}
               
               if (ke.key === "Enter") {
                   if (!isMultiline) {
                       commit();
                   } else if (ke.metaKey || ke.ctrlKey) {
                       commit();
                   } else {
                       const c = editorEl.selectionStart ?? editorEl.value.length;
                       editorEl.value = editorEl.value.slice(0, c) + "\n" + editorEl.value.slice(c);
                       editorEl.setSelectionRange(c + 1, c + 1);
                       syncModelFromEditor();
                   }
               } else if (ke.key === " ") {
                   const c = editorEl.selectionStart ?? editorEl.value.length;
                   editorEl.value = editorEl.value.slice(0, c) + " " + editorEl.value.slice(c);
                   editorEl.setSelectionRange(c + 1, c + 1);
                   syncModelFromEditor();
               }
               return;
           }
        }

        if (supportsTransliteration && suggestionItems.length > 0) {
          if (ke.key === "ArrowDown") {
            e.preventDefault()
            activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestionItems.length) % suggestionItems.length
            renderSuggestions()
            return
          }
          if (ke.key === "ArrowUp") {
            e.preventDefault()
            activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestionItems.length
            renderSuggestions()
            return
          }
          if (ke.key === "Enter" || ke.key === "Tab") {
            e.preventDefault()
            applySuggestion(activeSuggestionIndex)
            return
          }
          if (ke.key === " ") {
            e.preventDefault()
            applySuggestion(activeSuggestionIndex)
            const caret = editorEl.selectionStart ?? editorEl.value.length
            editorEl.value = editorEl.value.slice(0, caret) + " " + editorEl.value.slice(caret)
            const nextCaret = caret + 1
            editorEl.setSelectionRange(nextCaret, nextCaret)
            syncModelFromEditor()
            return
          }
        }
        if (supportsTransliteration && ke.key === " ") {
          closeSuggestions()
        }
        if (ke.key === "Escape") {
          if (supportsTransliteration && suggestionItems.length > 0) {
            e.preventDefault()
            closeSuggestions()
            return
          }
          e.preventDefault()
          commit()
          return
        }
        if (!isMultiline && ke.key === "Enter") {
          e.preventDefault()
          commit()
        }
        if (isMultiline && (ke.metaKey || ke.ctrlKey) && ke.key === "Enter") {
          e.preventDefault()
          commit()
        }
      })
      editorEl.addEventListener("blur", () =>
        setTimeout(() => {
          closeSuggestions()
          commit()
        }, 80)
      )
      // Show the SVG text; the editor is caret-only and has transparent text.
      liveText.style.display = ""
      if (ov) (ov as HTMLElement).style.display = ""
      if (container) container.appendChild(overlayDiv)
      editorEl.style.pointerEvents = "auto"
      editorEl.focus()
    }

    const onMouseDown = (e: MouseEvent | PointerEvent) => {

      const target = e.target as Element
      let isMultiToggle = e.ctrlKey || e.metaKey || isMultiSelectModeRef.current
      const handle = target.closest("[data-text-handle]") as SVGElement | null
      const stickerHandle = target.closest("[data-sticker-handle]") as SVGElement | null
      const multiHandle = target.closest("[data-multi-handle]") as SVGElement | null
      const rotateHandle = target.closest("[data-rotate-handle='1']") as SVGElement | null
      let imgOv = target.closest("[data-img-zone]")
      let txtOv = target.closest("[data-text-zone]")
      let stickerOv = target.closest("[data-sticker-zone]")

      const dragHandle = target.closest("[data-drag-handle='1']") as SVGElement | null
      if (dragHandle) {
        const type = dragHandle.getAttribute("data-drag-type") || "txt"
        const id = dragHandle.getAttribute("data-drag-id") || dragHandle.getAttribute("data-text-id")

        if (type === "txt" && id) {
          txtOv = svgEl.querySelector(`[data-text-zone="${id}"]`)
        } else if (type === "sticker" && id) {
          stickerOv = svgEl.querySelector(`[data-sticker-zone="${id}"]`)
        } else if (type === "multi") {
          const firstTxt = selectedTextIdsRef.current[0]
          const firstSticker = selectedStickerIdsRef.current[0]
          if (firstTxt) txtOv = svgEl.querySelector(`[data-text-zone="${firstTxt}"]`)
          else if (firstSticker) stickerOv = svgEl.querySelector(`[data-sticker-zone="${firstSticker}"]`)
        }
      }

      // On touch devices without hover, overlays might be hidden. Fallback to actual elements.
      if (!txtOv) {
        const textEl = target.closest('text') || target.closest('tspan') || target.closest('[id^="editable_"]')
        if (textEl) {
          const tid = textEl.id || textEl.closest('[id^="editable_"]')?.id
          if (tid && tid.startsWith("editable_")) {
            txtOv = svgEl.querySelector(`[data-text-zone="${tid}"]`)
          }
        }
      }
      if (!stickerOv) {
        const imgEl = target.closest('image[id^="sticker_"]')
        if (imgEl && imgEl.id) {
          stickerOv = svgEl.querySelector(`[data-sticker-zone="${imgEl.id}"]`)
        }
      }
      if (!imgOv) {
        const imgZoneEl = target.closest('[id^="image_zone_"]')
        if (imgZoneEl && imgZoneEl.id) {
          imgOv = svgEl.querySelector(`[data-img-zone="${imgZoneEl.id}"]`)
        }
      }

      if (isMultiSelectModeRef.current) {
        if (dragHandle || multiHandle || handle || stickerHandle || rotateHandle) {
          setIsMultiSelectMode(false)
          isMultiSelectModeRef.current = false
          isMultiToggle = e.ctrlKey || e.metaKey
        }
      }

      const up = target.closest("[data-upload-zone]")
      if (up) {
        const zoneId = up.getAttribute("data-upload-zone")
        if (zoneId && fileInputRefs.current[zoneId]) fileInputRefs.current[zoneId].click()
        return
      }
      if (rotateHandle) {
        const kind = rotateHandle.getAttribute("data-rotate-kind")
        const rid = rotateHandle.getAttribute("data-rotate-id") || ""
        if (!kind || !rid || kind !== "sticker") return

        const ov = svgEl.querySelector("#sticker_overlay_" + rid) as SVGRectElement | null
        if (!ov) return
        const x = parseFloat(ov.getAttribute("x") || "0")
        const y = parseFloat(ov.getAttribute("y") || "0")
        const w = parseFloat(ov.getAttribute("width") || "0")
        const h = parseFloat(ov.getAttribute("height") || "0")
        if (!w || !h) return

        const pivotX = x + w / 2
        const pivotY = y + h / 2

        const liveEl = svgEl.querySelector(idSelector(rid)) as SVGElement | null
        const startAngleDegRaw = liveEl ? parseFloat(liveEl.getAttribute("data-rotation-angle") || "") : NaN
        const startAngleDeg = Number.isFinite(startAngleDegRaw) ? startAngleDegRaw : 0

        const svgRect = svgEl.getBoundingClientRect()
        const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
        const relX = (e.clientX - svgRect.left) / svgRect.width
        const relY = (e.clientY - svgRect.top) / svgRect.height
        const mouseSvgX = vb[0] + relX * vb[2]
        const mouseSvgY = vb[1] + relY * vb[3]
        const startMouseAngleRad = Math.atan2(mouseSvgY - pivotY, mouseSvgX - pivotX)

        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
          ; (rotateHandle as unknown as HTMLElement).style.cursor = "grabbing"

        drag = {
          type: "rotate-sticker",
          id: rid,
          overlay: rotateHandle,
          startX: e.clientX,
          startY: e.clientY,
          pivotX,
          pivotY,
          startAngleDeg,
          startMouseAngleRad,
          moved: false,
        }
        return
      }
      if (!imgOv && !txtOv && !handle && !stickerOv && !stickerHandle && !multiHandle) {
        // Clicked empty SVG area -> start marquee selection.
        if (isMultiSelectModeRef.current) {
          setIsMultiSelectMode(false)
          isMultiSelectModeRef.current = false
          isMultiToggle = e.ctrlKey || e.metaKey
        }
        if (activeInlineEditor) {
          activeInlineEditor.commit({ bumpPreview: false })
          activeInlineEditor = null
        }
        const p = clientToSvgPoint(e.clientX, e.clientY)
        const marquee = previewDoc.createElementNS(ns, "rect")
        marquee.setAttribute("x", String(p.x))
        marquee.setAttribute("y", String(p.y))
        marquee.setAttribute("width", "0")
        marquee.setAttribute("height", "0")
        marquee.setAttribute("fill", "rgba(55,138,221,0.12)")
        marquee.setAttribute("stroke", "#378ADD")
        marquee.setAttribute("stroke-width", "1")
        marquee.setAttribute("stroke-dasharray", "4 3")
        marquee.setAttribute("pointer-events", "none")
        marquee.setAttribute("data-marquee-selection", "1")
        svgEl.appendChild(marquee)
        drag = {
          type: "marquee",
          overlay: svgEl,
          startX: e.clientX,
          startY: e.clientY,
          startSvgX: p.x,
          startSvgY: p.y,
          rectEl: marquee,
          idsTxt: [],
          idsSticker: [],
          moved: false,
        }
        return
      }
      // If user clicks a different text while inline editing, close current editor without rebuilding preview
      // so the new editor stays focused (avoids caret/handles disappearing due to rebuild).
      if (txtOv) {
        const nextTid = txtOv.getAttribute("data-text-zone") || ""
        if (activeInlineEditor && nextTid && activeInlineEditor.tid !== nextTid) {
          activeInlineEditor.commit({ bumpPreview: false })
          activeInlineEditor = null
        }
      } else if (activeInlineEditor) {
        // Selecting any non-text element should exit inline text editing immediately.
        activeInlineEditor.commit({ bumpPreview: false })
        activeInlineEditor = null
      }
      e.preventDefault()
      const { sx, sy } = getScale()
      if (multiHandle) {
        const corner = multiHandle.getAttribute("data-multi-handle") as "tl" | "tr" | "bl" | "br" | null
        const multiTxt = selectedTextIdsRef.current
        const multiStickers = selectedStickerIdsRef.current
        if (!corner || multiTxt.length + multiStickers.length <= 1) return
        const nextDrag = buildMultiSelectionResizeState(multiTxt, multiStickers, multiHandle, e.clientX, e.clientY, corner)
        if (!nextDrag) return
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
        drag = nextDrag
          ; (multiHandle as unknown as HTMLElement).style.cursor = getComputedStyle(multiHandle).cursor || "nwse-resize"
        applySelectionStrokeStyle({ txtIds: multiTxt, stickerIds: multiStickers, imgId: null })
        renderMultiSelectionHandles(multiTxt, multiStickers, nextDrag.groupBox)
        return
      }
      if (stickerHandle) {
        const sid = stickerHandle.getAttribute("data-sticker-id")
        const corner = stickerHandle.getAttribute("data-sticker-handle") as "tl" | "tr" | "bl" | "br" | null
        if (!sid || !corner) return
        const stickerEl = svgEl.querySelector(idSelector(sid)) as SVGImageElement | null
        const ov = svgEl.querySelector("#sticker_overlay_" + sid) as SVGRectElement | null
        if (!stickerEl || !ov) return
        // Match overlay (handle positions); template `<image>` x/y/wh can differ from getBBox-synced overlay.
        const x = parseFloat(ov.getAttribute("x") || stickerEl.getAttribute("x") || "0")
        const y = parseFloat(ov.getAttribute("y") || stickerEl.getAttribute("y") || "0")
        const w = Math.max(parseFloat(ov.getAttribute("width") || stickerEl.getAttribute("width") || "0"), 1)
        const h = Math.max(parseFloat(ov.getAttribute("height") || stickerEl.getAttribute("height") || "0"), 1)
        const corners: Record<"tl" | "tr" | "bl" | "br", { x: number; y: number }> = {
          tl: { x, y },
          tr: { x: x + w, y },
          bl: { x, y: y + h },
          br: { x: x + w, y: y + h },
        }
        const opposite: Record<"tl" | "tr" | "bl" | "br", "br" | "bl" | "tr" | "tl"> = {
          tl: "br",
          tr: "bl",
          bl: "tr",
          br: "tl",
        }
        drag = {
          type: "stickerResize",
          id: sid,
          overlay: ov,
          sx,
          sy,
          startX: e.clientX,
          startY: e.clientY,
          corner,
          anchorX: corners[opposite[corner]].x,
          anchorY: corners[opposite[corner]].y,
          startCornerX: corners[corner].x,
          startCornerY: corners[corner].y,
          startW: w,
          startH: h,
          moved: false,
        }
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
        renderStickerHandles(sid)
        return
      }
      if (handle) {
        const tid = handle.getAttribute("data-text-id")
        const cornerAttr = handle.getAttribute("data-text-handle") as "tl" | "tr" | "bl" | "br" | null
        if (!tid || !cornerAttr) return
        const liveText = svgEl.querySelector(idSelector(tid)) as SVGElement | null
        const docEl = svgDocRef.current?.querySelector(idSelector(tid)) as SVGElement | null
        const ov = svgEl.querySelector("#overlay_" + tid) as SVGRectElement | null
        if (!liveText || !docEl || !ov) return

        suppressEditorCommitRef.current = true

        // Hide the inline typing overlay during resize so resizing is visible live.
        // The overlay itself already uses absolute positioning over the SVG.
        if (container) {
          const existingOverlay = container.querySelector("#txt-editor-overlay") as HTMLElement | null
          if (existingOverlay) {
            hiddenTextEditorOverlay = existingOverlay
            hiddenTextEditorForTid = tid
            existingOverlay.style.display = "none"
          }
        }

        // Inline editor hides live text and overlay; restore so getBBox() returns valid bounds.
        ; (liveText as unknown as HTMLElement).style.display = ""
          ; (ov as unknown as HTMLElement).style.display = ""

        let bbox: { x: number; y: number; width: number; height: number } | null = null
        try {
          const b = (liveText as unknown as SVGGraphicsElement).getBBox?.()
          if (b && b.width > 0 && b.height > 0) {
            bbox = { x: b.x, y: b.y, width: b.width, height: b.height }
          }
        } catch { }
        if (!bbox) {
          suppressEditorCommitRef.current = false
          return
        }

        const firstTspan = liveText.querySelector("tspan") as SVGElement | null
        const startFirstTspanX = parseFloat(firstTspan?.getAttribute("x") || liveText.getAttribute("x") || "0")
        const startFirstTspanY = parseFloat(firstTspan?.getAttribute("y") || liveText.getAttribute("y") || "0")

        const cs = typeof window !== "undefined" ? window.getComputedStyle(liveText as any) : null
        const fsAttr = cs?.fontSize || liveText.getAttribute("font-size") || docEl.getAttribute("font-size") || "16"
        const startFontSizePx = parseFloat(fsAttr)
        const startLineStep = parseFloat(liveText.getAttribute("data-editor-line-step") || "")

        const corners: Record<"tl" | "tr" | "bl" | "br", { x: number; y: number }> = {
          tl: { x: bbox.x, y: bbox.y },
          tr: { x: bbox.x + bbox.width, y: bbox.y },
          bl: { x: bbox.x, y: bbox.y + bbox.height },
          br: { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
        }

        const startCorner = corners[cornerAttr]
        if (!startCorner) {
          suppressEditorCommitRef.current = false
          return
        }

        const opposite: Record<"tl" | "tr" | "bl" | "br", "br" | "bl" | "tr" | "tl"> = {
          tl: "br",
          tr: "bl",
          bl: "tr",
          br: "tl",
        }
        const anchorCorner = corners[opposite[cornerAttr]]

        drag = {
          type: "resize",
          id: tid,
          overlay: ov,
          sx,
          sy,
          startX: e.clientX,
          startY: e.clientY,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          corner: cornerAttr,
          anchorX: anchorCorner.x,
          anchorY: anchorCorner.y,
          startCornerX: startCorner.x,
          startCornerY: startCorner.y,
          startFontSizePx,
          startLineStep,
          startBBox: bbox,
          startFirstTspanX,
          startFirstTspanY,
          startOverlayX: parseFloat(ov.getAttribute("x") || "0"),
          startOverlayY: parseFloat(ov.getAttribute("y") || "0"),
          startOverlayW: parseFloat(ov.getAttribute("width") || "0"),
          startOverlayH: parseFloat(ov.getAttribute("height") || "0"),
          moved: false,
        }

        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
          ; (handle as unknown as HTMLElement).style.cursor = getComputedStyle(handle).cursor || "nwse-resize"
        return
      }
      if (imgOv) {
        renderStickerHandles(null)
        setSelectedTextIdsState([])
        setSelectedStickerIdsState([])
        const zoneId = imgOv.getAttribute("data-img-zone")!
        selectedImageZoneId = zoneId
        setSelectedImageZoneIdState(zoneId)
        selectedTextId = null
        selectedStickerId = null
        setSelectedTextIdState(null)
        setSelectedStickerIdState(null)
        applySelectionStrokeStyle({ txtIds: [], stickerIds: [], imgId: zoneId })
        const st = zoneStates[zoneId]
        if (!st?.b64) return
        const liveImage = svgEl.querySelector(idSelector(zoneId)) as SVGImageElement | null
        const startImgX = parseFloat(liveImage?.getAttribute("x") || "0")
        const startImgY = parseFloat(liveImage?.getAttribute("y") || "0")
        drag = {
          type: "img",
          id: zoneId,
          overlay: imgOv,
          sx,
          sy,
          startX: e.clientX,
          startY: e.clientY,
          startOX: st.offsetX,
          startOY: st.offsetY,
          startImgX,
          startImgY,
          moved: false,
        }
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
          ; (imgOv as HTMLElement).style.cursor = "grabbing"
      }
      if (txtOv) {
        const tid = txtOv.getAttribute("data-text-zone")!
        const prevSelected = selectedTextId
        const multiTxt = selectedTextIdsRef.current
        const multiStickers = selectedStickerIdsRef.current
        const isInExistingMultiSelection =
          multiTxt.length + multiStickers.length > 1 && multiTxt.includes(tid)

        if (isMultiToggle && !isInExistingMultiSelection) {
          e.preventDefault()
          setSelectedImageZoneIdState(null)
          setSelectedStickerIdState(null)

          setSelectedTextIdsState((prev) => {
            const set = new Set(prev)
            if (set.has(tid)) set.delete(tid)
            else set.add(tid)
            const next = Array.from(set)
            // When multi-select is active, suppress single selection states.
            if (next.length + selectedStickerIdsRef.current.length > 1) {
              setSelectedTextIdState(null)
              setSelectedStickerIdState(null)
              selectedTextId = null
              selectedStickerId = null
              applySelectionStrokeStyle({ txtIds: next, stickerIds: selectedStickerIdsRef.current, imgId: null })
              renderMultiSelectionHandles(next, selectedStickerIdsRef.current)
            } else if (next.length === 1 && selectedStickerIdsRef.current.length === 0) {
              renderTextHandles(next[0]!)
              setSelectedStickerIdsState([])
            } else if (next.length === 0 && selectedStickerIdsRef.current.length === 1) {
              renderStickerHandles(selectedStickerIdsRef.current[0]!)
              setSelectedTextIdsState([])
            } else {
              applySelectionStrokeStyle({ txtIds: next, stickerIds: selectedStickerIdsRef.current, imgId: null })
            }
            return next
          })
          return
        }


        if (isInExistingMultiSelection) {
          e.preventDefault()
          textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
          drag = buildMultiSelectionDragState(multiTxt, multiStickers, txtOv as Element, e.clientX, e.clientY)
          if (!drag) return
          if (isMultiToggle) {
            ; (drag as any).isToggleCandidate = true
              ; (drag as any).toggleId = tid
              ; (drag as any).toggleType = "txt"
          }
          ; (txtOv as HTMLElement).style.cursor = "grabbing"
          applySelectionStrokeStyle({ txtIds: multiTxt, stickerIds: multiStickers, imgId: null })
          renderMultiSelectionHandles(multiTxt, multiStickers)
          return
        }

        setSelectedTextIdsState([tid])
        setSelectedStickerIdsState([])
        renderTextHandles(tid)
        const docEl = svgDocRef.current?.querySelector(idSelector(tid))
        if (!docEl) {
          return
        }
        const firstTspan = (docEl as SVGElement).querySelector("tspan") as SVGElement | null
        const startTX = parseFloat(firstTspan?.getAttribute("x") || docEl.getAttribute("x") || "0")
        const startTY = parseFloat(firstTspan?.getAttribute("y") || docEl.getAttribute("y") || "0")
        const startOverlayX = parseFloat((txtOv as SVGRectElement).getAttribute("x") || "0")
        const startOverlayY = parseFloat((txtOv as SVGRectElement).getAttribute("y") || "0")
        const startOverlayW = parseFloat((txtOv as SVGRectElement).getAttribute("width") || "0")
        const startOverlayH = parseFloat((txtOv as SVGRectElement).getAttribute("height") || "0")
        drag = {
          type: "txt",
          id: tid,
          overlay: txtOv,
          sx,
          sy,
          startX: e.clientX,
          startY: e.clientY,
          startTX,
          startTY,
          startOverlayX,
          startOverlayY,
          startOverlayW,
          startOverlayH,
          moved: false,
          openEditorOnClick: prevSelected === tid,
        }
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
          ; (txtOv as HTMLElement).style.cursor = "grabbing"
      }
      if (stickerOv) {
        const sid = stickerOv.getAttribute("data-sticker-zone")!
        const multiTxt = selectedTextIdsRef.current
        const multiStickers = selectedStickerIdsRef.current
        const isInExistingMultiSelection =
          multiTxt.length + multiStickers.length > 1 && multiStickers.includes(sid)
        if (isMultiToggle && !isInExistingMultiSelection) {
          e.preventDefault()
          setSelectedImageZoneIdState(null)
          setSelectedTextIdState(null)

          setSelectedStickerIdsState((prev) => {
            const set = new Set(prev)
            if (set.has(sid)) set.delete(sid)
            else set.add(sid)
            const next = Array.from(set)
            if (next.length + selectedTextIdsRef.current.length > 1) {
              setSelectedTextIdState(null)
              setSelectedStickerIdState(null)
              selectedTextId = null
              selectedStickerId = null
              applySelectionStrokeStyle({ txtIds: selectedTextIdsRef.current, stickerIds: next, imgId: null })
              renderMultiSelectionHandles(selectedTextIdsRef.current, next)
            } else if (next.length === 1 && selectedTextIdsRef.current.length === 0) {
              setSelectedTextIdsState([])
              renderStickerHandles(next[0]!)
            } else if (next.length === 0 && selectedTextIdsRef.current.length === 1) {
              setSelectedStickerIdsState([])
              renderTextHandles(selectedTextIdsRef.current[0]!)
            } else {
              applySelectionStrokeStyle({ txtIds: selectedTextIdsRef.current, stickerIds: next, imgId: null })
            }
            return next
          })
          return
        }


        if (isInExistingMultiSelection) {
          e.preventDefault()
          textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
          drag = buildMultiSelectionDragState(multiTxt, multiStickers, stickerOv as Element, e.clientX, e.clientY)
          if (!drag) return
          if (isMultiToggle) {
            ; (drag as any).isToggleCandidate = true
              ; (drag as any).toggleId = sid
              ; (drag as any).toggleType = "sticker"
          }
          ; (stickerOv as HTMLElement).style.cursor = "grabbing"
          applySelectionStrokeStyle({ txtIds: multiTxt, stickerIds: multiStickers, imgId: null })
          renderMultiSelectionHandles(multiTxt, multiStickers)
          return
        }

        const stickerEl = svgEl.querySelector(idSelector(sid)) as SVGImageElement | null
        if (!stickerEl) return
        setSelectedStickerIdsState([sid])
        setSelectedTextIdsState([])
        drag = {
          type: "sticker",
          id: sid,
          overlay: stickerOv,
          sx,
          sy,
          startX: e.clientX,
          startY: e.clientY,
          startStickerX: parseFloat(stickerEl.getAttribute("x") || "0"),
          startStickerY: parseFloat(stickerEl.getAttribute("y") || "0"),
          moved: false,
        }
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
          ; (stickerOv as HTMLElement).style.cursor = "grabbing"
        renderStickerHandles(sid)
      }

      // Multi-drag: clicking a selected element when multi-selected drags the whole selection.
      const multiTxt = selectedTextIdsRef.current
      const multiStickers = selectedStickerIdsRef.current
      if (!isMultiToggle && multiTxt.length + multiStickers.length > 1 && (txtOv || stickerOv)) {
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
        drag = buildMultiSelectionDragState(multiTxt, multiStickers, (txtOv || stickerOv) as Element, e.clientX, e.clientY)
        if (!drag) return
          ; ((txtOv || stickerOv) as HTMLElement).style.cursor = "grabbing"
        return
      }
    }

    const onMouseMove = (e: MouseEvent | PointerEvent) => {
      if (!drag) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        drag.moved = true
        if (isMultiSelectModeRef.current) {
          setIsMultiSelectMode(false)
          isMultiSelectModeRef.current = false
        }
      }
      if (!drag.moved) return

      if (drag.type === "marquee") {
        const p = clientToSvgPoint(e.clientX, e.clientY)
        const x = Math.min(drag.startSvgX, p.x)
        const y = Math.min(drag.startSvgY, p.y)
        const w = Math.abs(p.x - drag.startSvgX)
        const h = Math.abs(p.y - drag.startSvgY)
        drag.rectEl.setAttribute("x", String(x))
        drag.rectEl.setAttribute("y", String(y))
        drag.rectEl.setAttribute("width", String(w))
        drag.rectEl.setAttribute("height", String(h))

        const intersects = (bx: number, by: number, bw: number, bh: number) =>
          bx < x + w && bx + bw > x && by < y + h && by + bh > y

        const txtIds = Array.from(svgEl.querySelectorAll<SVGRectElement>("[data-text-zone]"))
          .map((ov) => {
            const id = ov.getAttribute("data-text-zone")
            if (!id) return null
            const ox = parseFloat(ov.getAttribute("x") || "")
            const oy = parseFloat(ov.getAttribute("y") || "")
            const ow = parseFloat(ov.getAttribute("width") || "")
            const oh = parseFloat(ov.getAttribute("height") || "")
            if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(ow) || !Number.isFinite(oh) || ow <= 0 || oh <= 0) return null
            return intersects(ox, oy, ow, oh) ? id : null
          })
          .filter((id): id is string => Boolean(id))

        const stickerIds = Array.from(svgEl.querySelectorAll<SVGRectElement>("[data-sticker-zone]"))
          .map((ov) => {
            const id = ov.getAttribute("data-sticker-zone")
            if (!id) return null
            const ox = parseFloat(ov.getAttribute("x") || "")
            const oy = parseFloat(ov.getAttribute("y") || "")
            const ow = parseFloat(ov.getAttribute("width") || "")
            const oh = parseFloat(ov.getAttribute("height") || "")
            if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(ow) || !Number.isFinite(oh) || ow <= 0 || oh <= 0) return null
            return intersects(ox, oy, ow, oh) ? id : null
          })
          .filter((id): id is string => Boolean(id))

        drag.idsTxt = txtIds
        drag.idsSticker = stickerIds
        applySelectionStrokeStyle({ txtIds, stickerIds, imgId: null })
        Array.from(svgEl.querySelectorAll<SVGGElement>('[data-text-handles="1"],[data-sticker-handles="1"],[data-multi-handles="1"]')).forEach((g) => {
          g.parentNode?.removeChild(g)
        })
        if (txtIds.length + stickerIds.length > 1) renderMultiSelectionHandles(txtIds, stickerIds)
        return
      }

      if (drag.type === "multi") {
        const multiDrag = drag
        const rawDxSvg = (e.clientX - multiDrag.startX) * multiDrag.sx
        const rawDySvg = (e.clientY - multiDrag.startY) * multiDrag.sy

        const rawLeft = multiDrag.groupBox.x + rawDxSvg
        const rawTop = multiDrag.groupBox.y + rawDySvg
        const cx = rawLeft + multiDrag.groupBox.w / 2
        const cy = rawTop

        const peerBoxes: SnapPeerBox[] = [
          ...textFields
            .filter((f) => !multiDrag.idsTxt.includes(f.id))
            .map((f) => {
              const ovPeer = svgEl.querySelector("#overlay_" + f.id) as SVGRectElement | null
              if (!ovPeer) return null
              const x = parseFloat(ovPeer.getAttribute("x") || "")
              const y = parseFloat(ovPeer.getAttribute("y") || "")
              const w = parseFloat(ovPeer.getAttribute("width") || "")
              const h = parseFloat(ovPeer.getAttribute("height") || "")
              if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
              return { id: f.id, x, y, w, h }
            })
            .filter((b): b is SnapPeerBox => Boolean(b)),
          ...Array.from(svgEl.querySelectorAll<SVGRectElement>("[data-sticker-zone]"))
            .map((ovPeer) => {
              const pid = ovPeer.getAttribute("data-sticker-zone") || ""
              if (!pid || multiDrag.idsSticker.includes(pid)) return null
              const x = parseFloat(ovPeer.getAttribute("x") || "")
              const y = parseFloat(ovPeer.getAttribute("y") || "")
              const w = parseFloat(ovPeer.getAttribute("width") || "")
              const h = parseFloat(ovPeer.getAttribute("height") || "")
              if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
              return { id: pid, x, y, w, h }
            })
            .filter((b): b is SnapPeerBox => Boolean(b)),
        ]

        const { nx, ny, guides, frameX, frameY, frameW, frameH, guideVx, guideHy } = applySnap(
          svgEl as unknown as SVGElement,
          cx,
          cy,
          multiDrag.groupBox.w,
          multiDrag.groupBox.h,
          peerBoxes
        )

        hideGuides(svgEl as unknown as SVGElement)
        if (guideVx !== null) {
          const id = guides.includes("cx") ? "guide-cx" : guides.includes("left") ? "guide-left" : "guide-right"
          createGuideLine(svgEl as unknown as SVGElement, id, guideVx, frameY, guideVx, frameY + frameH)
        }
        if (guideHy !== null) {
          const id = guides.includes("cy") ? "guide-cy" : guides.includes("top") ? "guide-top" : "guide-bottom"
          createGuideLine(svgEl as unknown as SVGElement, id, frameX, guideHy, frameX + frameW, guideHy)
        }

        const dxSvg = nx - multiDrag.groupBox.w / 2 - multiDrag.groupBox.x
        const dySvg = ny - multiDrag.groupBox.y

        const shiftTextEl = (el: SVGElement, ddx: number, ddy: number) => {
          const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
          if (tspans.length) {
            tspans.forEach((t, i) => {
              const base = multiDrag.startTxt[el.getAttribute("id") || ""]?.tspanXY[i]
              if (!base) return
              t.setAttribute("x", String(base.x + ddx))
              t.setAttribute("y", String(base.y + ddy))
            })
          } else {
            const id = el.getAttribute("id") || ""
            const base = multiDrag.startTxt[id]
            if (!base) return
            el.setAttribute("x", String(base.x + ddx))
            el.setAttribute("y", String(base.y + ddy))
          }
        }

        multiDrag.idsTxt.forEach((id) => {
          const live = svgEl.querySelector(idSelector(id)) as SVGElement | null
          const docEl = svgDocRef.current?.querySelector(idSelector(id)) as SVGElement | null
          if (live) shiftTextEl(live, dxSvg, dySvg)
          if (docEl) shiftTextEl(docEl, dxSvg, dySvg)
          const ov = svgEl.querySelector("#overlay_" + id) as SVGRectElement | null
          if (ov) {
            const base = multiDrag.startTxtOverlay[id]
            if (base) {
              ov.setAttribute("x", String(base.x + dxSvg))
              ov.setAttribute("y", String(base.y + dySvg))
              ov.setAttribute("width", String(base.w))
              ov.setAttribute("height", String(base.h))
            }
          }
        })

        multiDrag.idsSticker.forEach((id) => {
          const base = multiDrag.startSticker[id]
          if (!base) return
          const nx = base.x + dxSvg
          const ny = base.y + dySvg
          const live = svgEl.querySelector(idSelector(id)) as SVGElement | null
          const docEl = svgDocRef.current?.querySelector(idSelector(id)) as SVGElement | null
            ;[live, docEl].forEach((el) => {
              if (!el) return
              el.setAttribute("x", String(nx))
              el.setAttribute("y", String(ny))
              if (base.w > 0 && base.h > 0 && base.angle !== null && Math.abs(base.angle) > 0.0001) {
                const pivotX = nx + base.w / 2
                const pivotY = ny + base.h / 2
                el.setAttribute("transform", `rotate(${base.angle} ${pivotX} ${pivotY})`)
              }
            })
          const ov = svgEl.querySelector("#sticker_overlay_" + id) as SVGRectElement | null
          if (ov) {
            const baseOv = multiDrag.startStickerOverlay[id]
            if (baseOv) {
              ov.setAttribute("x", String(baseOv.x + dxSvg))
              ov.setAttribute("y", String(baseOv.y + dySvg))
              ov.setAttribute("width", String(baseOv.w))
              ov.setAttribute("height", String(baseOv.h))
              if (base.angle !== null && Math.abs(base.angle) > 0.0001) {
                const pivotX = nx + base.w / 2
                const pivotY = ny + base.h / 2
                ov.setAttribute("transform", `rotate(${base.angle} ${pivotX} ${pivotY})`)
              }
            } else {
              ov.setAttribute("x", String(nx))
              ov.setAttribute("y", String(ny))
            }
          }
        })

        applySelectionStrokeStyle({ txtIds: multiDrag.idsTxt, stickerIds: multiDrag.idsSticker, imgId: null })
        renderMultiSelectionHandles(multiDrag.idsTxt, multiDrag.idsSticker, {
          x: multiDrag.groupBox.x + dxSvg,
          y: multiDrag.groupBox.y + dySvg,
          w: multiDrag.groupBox.w,
          h: multiDrag.groupBox.h,
        })
        return
      }

      if (drag.type === "multiResize") {
        const multiDrag = drag
        const { sx, sy } = getScale()
        const dxSvg = (e.clientX - multiDrag.startX) * sx
        const dySvg = (e.clientY - multiDrag.startY) * sy
        const newCornerX = multiDrag.startCornerX + dxSvg
        const newCornerY = multiDrag.startCornerY + dySvg
        const startDiag = Math.hypot(multiDrag.startCornerX - multiDrag.anchorX, multiDrag.startCornerY - multiDrag.anchorY)
        const newDiag = Math.hypot(newCornerX - multiDrag.anchorX, newCornerY - multiDrag.anchorY)
        if (!startDiag || !Number.isFinite(startDiag)) return
        let scale = newDiag / startDiag
        if (!Number.isFinite(scale) || scale <= 0) scale = 1
        scale = Math.max(0.1, Math.min(5, scale))
        let minStickerScale = 0
        multiDrag.idsSticker.forEach((id) => {
          const b = multiDrag.startSticker[id]
          if (!b || !(b.w > 0) || !(b.h > 0)) return
          minStickerScale = Math.max(minStickerScale, MIN_STICKER_AXIS_PX / b.w, MIN_STICKER_AXIS_PX / b.h)
        })
        scale = Math.max(scale, minStickerScale)

        const scalePoint = (x: number, y: number) => ({
          x: multiDrag.anchorX + (x - multiDrag.anchorX) * scale,
          y: multiDrag.anchorY + (y - multiDrag.anchorY) * scale,
        })

        const applyScaledFont = (el: SVGElement, font: number) => {
          el.setAttribute("font-size", String(font))
            ; (el as unknown as HTMLElement).style.fontSize = String(font) + "px"
          const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
          tspans.forEach((t) => {
            if (t.hasAttribute("font-size")) t.setAttribute("font-size", String(font))
              ; (t as unknown as HTMLElement).style.fontSize = String(font) + "px"
            const style = t.getAttribute("style")
            if (style && style.includes("font-size")) {
              const withoutSize = style.replace(/font-size\s*:[^;]+;?/g, "")
              t.setAttribute("style", withoutSize ? `${withoutSize}font-size:${font}px;` : `font-size:${font}px;`)
            }
          })
        }

        multiDrag.idsTxt.forEach((id) => {
          const base = multiDrag.startTxt[id]
          if (!base) return
          const live = svgEl.querySelector(idSelector(id)) as SVGElement | null
          const docEl = svgDocRef.current?.querySelector(idSelector(id)) as SVGElement | null
          const targets = [live, docEl]
          targets.forEach((el) => {
            if (!el) return
            const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
            if (tspans.length && base.tspanXY.length) {
              tspans.forEach((t, i) => {
                const point = base.tspanXY[i]
                if (!point) return
                const next = scalePoint(point.x, point.y)
                t.setAttribute("x", String(next.x))
                t.setAttribute("y", String(next.y))
              })
            } else {
              const next = scalePoint(base.x, base.y)
              el.setAttribute("x", String(next.x))
              el.setAttribute("y", String(next.y))
            }
            const baseFont = multiDrag.startTxtFontSize[id]
            if (Number.isFinite(baseFont) && baseFont > 0) {
              const newFont = Math.max(4, Math.min(200, baseFont * scale))
              applyScaledFont(el, newFont)
            }
          })
          const ov = svgEl.querySelector("#overlay_" + id) as SVGRectElement | null
          const baseOv = multiDrag.startTxtOverlay[id]
          if (ov && baseOv) {
            const tl = scalePoint(baseOv.x, baseOv.y)
            const br = scalePoint(baseOv.x + baseOv.w, baseOv.y + baseOv.h)
            ov.setAttribute("x", String(Math.min(tl.x, br.x)))
            ov.setAttribute("y", String(Math.min(tl.y, br.y)))
            ov.setAttribute("width", String(Math.abs(br.x - tl.x)))
            ov.setAttribute("height", String(Math.abs(br.y - tl.y)))
          }
        })

        multiDrag.idsSticker.forEach((id) => {
          const base = multiDrag.startSticker[id]
          if (!base) return
          const tl = scalePoint(base.x, base.y)
          const br = scalePoint(base.x + base.w, base.y + base.h)
          const nx = Math.min(tl.x, br.x)
          const ny = Math.min(tl.y, br.y)
          const nw = Math.max(Math.abs(br.x - tl.x), 1)
          const nh = Math.max(Math.abs(br.y - tl.y), 1)
          const live = svgEl.querySelector(idSelector(id)) as SVGElement | null
          const docEl = svgDocRef.current?.querySelector(idSelector(id)) as SVGElement | null
            ;[live, docEl].forEach((el) => {
              if (!el) return
              el.setAttribute("x", String(nx))
              el.setAttribute("y", String(ny))
              el.setAttribute("width", String(nw))
              el.setAttribute("height", String(nh))
              if (base.angle !== null && Math.abs(base.angle) > 0.0001) {
                const pivotX = nx + nw / 2
                const pivotY = ny + nh / 2
                el.setAttribute("transform", `rotate(${base.angle} ${pivotX} ${pivotY})`)
                el.setAttribute("data-rotation-angle", String(base.angle))
              }
            })
          const ov = svgEl.querySelector("#sticker_overlay_" + id) as SVGRectElement | null
          if (ov) {
            ov.setAttribute("x", String(nx))
            ov.setAttribute("y", String(ny))
            ov.setAttribute("width", String(nw))
            ov.setAttribute("height", String(nh))
            if (base.angle !== null && Math.abs(base.angle) > 0.0001) {
              const pivotX = nx + nw / 2
              const pivotY = ny + nh / 2
              ov.setAttribute("transform", `rotate(${base.angle} ${pivotX} ${pivotY})`)
            } else {
              ov.removeAttribute("transform")
            }
          }
        })

        const box = {
          x: Math.min(multiDrag.anchorX, multiDrag.anchorX + (multiDrag.groupBox.x - multiDrag.anchorX) * scale),
          y: Math.min(multiDrag.anchorY, multiDrag.anchorY + (multiDrag.groupBox.y - multiDrag.anchorY) * scale),
          w: Math.max(Math.abs(multiDrag.groupBox.w * scale), 1),
          h: Math.max(Math.abs(multiDrag.groupBox.h * scale), 1),
        }
        applySelectionStrokeStyle({ txtIds: multiDrag.idsTxt, stickerIds: multiDrag.idsSticker, imgId: null })
        renderMultiSelectionHandles(multiDrag.idsTxt, multiDrag.idsSticker, box)
        return
      }

      if (drag.type === "rotate-sticker") {
        const normalizeAngle = (a: number) => ((a % 360) + 360) % 360
        const shortestDeltaDeg = (fromDeg: number, toDeg: number) => (((toDeg - fromDeg + 540) % 360) - 180)

        const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
        const svgRect = svgEl.getBoundingClientRect()
        const relX = (e.clientX - svgRect.left) / svgRect.width
        const relY = (e.clientY - svgRect.top) / svgRect.height
        const mouseSvgX = vb[0] + relX * vb[2]
        const mouseSvgY = vb[1] + relY * vb[3]

        const currMouseAngleRad = Math.atan2(mouseSvgY - drag.pivotY, mouseSvgX - drag.pivotX)
        const rawAngleDeg = drag.startAngleDeg + ((currMouseAngleRad - drag.startMouseAngleRad) * 180) / Math.PI
        const normalizedRaw = normalizeAngle(rawAngleDeg)
        const targets = ROTATE_SNAP_TARGETS_DEG.map((t) => (t === 360 ? 0 : t))
        let nearestTarget = targets[0]
        let nearestDiff = Math.abs(shortestDeltaDeg(normalizedRaw, nearestTarget))
        targets.forEach((t) => {
          const d = Math.abs(shortestDeltaDeg(normalizedRaw, t))
          if (d < nearestDiff) {
            nearestDiff = d
            nearestTarget = t
          }
        })
        const snapped = nearestDiff <= ROTATE_SNAP_THRESHOLD_DEG
        const nextAngleDeg = snapped ? rawAngleDeg + shortestDeltaDeg(normalizedRaw, nearestTarget) : rawAngleDeg
        const rot = `rotate(${nextAngleDeg} ${drag.pivotX} ${drag.pivotY})`

        const el = svgEl.querySelector(idSelector(drag.id)) as SVGElement | null
        const docEl = svgDocRef.current?.querySelector(idSelector(drag.id)) as SVGElement | null
          ;[el, docEl].forEach((target) => {
            if (!target) return
            target.setAttribute("data-rotation-angle", String(nextAngleDeg))
            target.setAttribute("transform", rot)
          })

        const ov = svgEl.querySelector("#sticker_overlay_" + drag.id) as SVGRectElement | null
        ov?.setAttribute("transform", rot)

        const handles = svgEl.querySelector("#handles_sticker_" + drag.id) as SVGGElement | null
        handles?.setAttribute("transform", rot)
        return
      }

      if (drag.type === "img") {
        // Capture drag fields; React may run state updaters after drag is cleared.
        const dragId = drag.id
        const startOX = drag.startOX ?? 0
        const startOY = drag.startOY ?? 0
        const sx = drag.sx
        const sy = drag.sy
        const newOX = startOX + dx * sx * IMAGE_DRAG_SPEED
        const newOY = startOY + dy * sy * IMAGE_DRAG_SPEED
        const st = zoneStatesRef.current[dragId]
        if (st) {
          const { clampedOX, clampedOY } = clampImageOffsets(newOX, newOY, st.scale || 1, st.zoneW, st.zoneH, st.imgW, st.imgH)
          const liveImage = svgEl.querySelector(idSelector(dragId)) as SVGImageElement | null
          if (liveImage) {
            const sx0 = drag.startImgX ?? parseFloat(liveImage.getAttribute("x") || "0")
            const sy0 = drag.startImgY ?? parseFloat(liveImage.getAttribute("y") || "0")
            const newX = sx0 + (clampedOX - startOX)
            liveImage.setAttribute("x", String(newX))
            liveImage.setAttribute("y", String(sy0 + (clampedOY - startOY)))
            if (st.flipH) {
              const imgW2 = parseFloat(liveImage.getAttribute("width") || "0")
              liveImage.setAttribute("transform", `translate(${newX * 2 + imgW2}, 0) scale(-1, 1)`)
            }
          }
        }
      }
      if (drag.type === "sticker") {
        const sid = drag.id
        const live = svgEl.querySelector(idSelector(sid)) as SVGImageElement | null
        const docEl = svgDocRef.current?.querySelector(idSelector(sid)) as SVGImageElement | null
        const w = Math.max(parseFloat(live?.getAttribute("width") || docEl?.getAttribute("width") || "0"), 1)
        const h = Math.max(parseFloat(live?.getAttribute("height") || docEl?.getAttribute("height") || "0"), 1)
        const rawLeft = drag.startStickerX + dx * drag.sx
        const rawTop = drag.startStickerY + dy * drag.sy
        // applySnap uses: cx=centerX, cy=topY
        const cx = rawLeft + w / 2
        const cy = rawTop

        const peerBoxes: SnapPeerBox[] = [
          // Text overlays
          ...textFields
            .map((f) => {
              const ovPeer = svgEl.querySelector("#overlay_" + f.id) as SVGRectElement | null
              if (!ovPeer) return null
              const x = parseFloat(ovPeer.getAttribute("x") || "")
              const y = parseFloat(ovPeer.getAttribute("y") || "")
              const w = parseFloat(ovPeer.getAttribute("width") || "")
              const h = parseFloat(ovPeer.getAttribute("height") || "")
              if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
                return null
              return { id: f.id, x, y, w, h }
            })
            .filter((b): b is SnapPeerBox => Boolean(b)),
          // Other sticker overlays
          ...Array.from(svgEl.querySelectorAll<SVGRectElement>("[data-sticker-zone]"))
            .map((ovPeer) => {
              const pid = ovPeer.getAttribute("data-sticker-zone") || ovPeer.getAttribute("id") || ""
              if (pid === sid) return null
              const x = parseFloat(ovPeer.getAttribute("x") || "")
              const y = parseFloat(ovPeer.getAttribute("y") || "")
              const w = parseFloat(ovPeer.getAttribute("width") || "")
              const h = parseFloat(ovPeer.getAttribute("height") || "")
              if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
                return null
              return { id: pid, x, y, w, h }
            })
            .filter((b): b is SnapPeerBox => Boolean(b)),
        ]

        const { nx, ny, guides, frameX, frameY, frameW, frameH, guideVx, guideHy } = applySnap(
          svgEl as unknown as SVGElement,
          cx,
          cy,
          w,
          h,
          peerBoxes
        )

        hideGuides(svgEl as unknown as SVGElement)
        if (guideVx !== null) {
          const id = guides.includes("cx") ? "guide-cx" : guides.includes("left") ? "guide-left" : "guide-right"
          createGuideLine(svgEl as unknown as SVGElement, id, guideVx, frameY, guideVx, frameY + frameH)
        }
        if (guideHy !== null) {
          const id = guides.includes("cy") ? "guide-cy" : guides.includes("top") ? "guide-top" : "guide-bottom"
          createGuideLine(svgEl as unknown as SVGElement, id, frameX, guideHy, frameX + frameW, guideHy)
        }

        const left = nx - w / 2
        const top = ny
        if (live) {
          live.setAttribute("x", String(left))
          live.setAttribute("y", String(top))
        }
        if (docEl) {
          docEl.setAttribute("x", String(left))
          docEl.setAttribute("y", String(top))
        }
        const ov = svgEl.querySelector("#sticker_overlay_" + sid) as SVGRectElement | null
        if (ov) {
          ov.setAttribute("x", String(left))
          ov.setAttribute("y", String(top))
        }

        // Keep rotation pivot synced after sticker drag (prevents drift).
        const angleRaw = live?.getAttribute("data-rotation-angle") || docEl?.getAttribute("data-rotation-angle") || ""
        const angle = parseFloat(angleRaw)
        if (Number.isFinite(angle) && Math.abs(angle) > 0.0001) {
          const pivotX = left + w / 2
          const pivotY = top + h / 2
          const rot = `rotate(${angle} ${pivotX} ${pivotY})`
          live?.setAttribute("transform", rot)
          docEl?.setAttribute("transform", rot)
        }

        renderStickerHandles(sid)
      }
      if (drag.type === "stickerResize") {
        const sid = drag.id
        const dxSvg = (e.clientX - drag.startX) * drag.sx
        const dySvg = (e.clientY - drag.startY) * drag.sy
        const newCornerX = drag.startCornerX + dxSvg
        const newCornerY = drag.startCornerY + dySvg
        const startDiag = Math.hypot(drag.startCornerX - drag.anchorX, drag.startCornerY - drag.anchorY)
        if (!startDiag) return
        let scale = Math.hypot(newCornerX - drag.anchorX, newCornerY - drag.anchorY) / startDiag
        if (!Number.isFinite(scale) || scale <= 0) scale = 1
        const minScale = Math.max(MIN_STICKER_AXIS_PX / drag.startW, MIN_STICKER_AXIS_PX / drag.startH)
        scale = Math.max(scale, minScale)
        const nextW = drag.startW * scale
        const nextH = drag.startH * scale
        // Keep the opposite (anchor) corner fixed; compute top-left accordingly.
        // draggedCorner -> fixedAnchorCorner
        // br -> tl, bl -> tr, tr -> bl, tl -> br
        const x =
          drag.corner === "br" || drag.corner === "tr"
            ? drag.anchorX
            : drag.anchorX - nextW
        const y =
          drag.corner === "br" || drag.corner === "bl"
            ? drag.anchorY
            : drag.anchorY - nextH
        const live = svgEl.querySelector(idSelector(sid)) as SVGImageElement | null
        const docEl = svgDocRef.current?.querySelector(idSelector(sid)) as SVGImageElement | null
          ;[live, docEl].forEach((el) => {
            if (!el) return
            el.setAttribute("x", String(x))
            el.setAttribute("y", String(y))
            el.setAttribute("width", String(nextW))
            el.setAttribute("height", String(nextH))
          })
        const ov = svgEl.querySelector("#sticker_overlay_" + sid) as SVGRectElement | null
        if (ov) {
          ov.setAttribute("x", String(x))
          ov.setAttribute("y", String(y))
          ov.setAttribute("width", String(nextW))
          ov.setAttribute("height", String(nextH))
        }

        // Keep rotation pivot synced after sticker resize.
        const angleRaw = live?.getAttribute("data-rotation-angle") || docEl?.getAttribute("data-rotation-angle") || ""
        const angle = parseFloat(angleRaw)
        if (Number.isFinite(angle) && Math.abs(angle) > 0.0001) {
          const pivotX = x + nextW / 2
          const pivotY = y + nextH / 2
          const rot = `rotate(${angle} ${pivotX} ${pivotY})`
          live?.setAttribute("transform", rot)
          docEl?.setAttribute("transform", rot)
        }

        renderStickerHandles(sid)
      }
      if (drag.type === "txt") {
        const dragId = drag.id
        const liveText = svgEl.querySelector(idSelector(dragId)) as SVGElement
        const startW = Math.max(drag.startOverlayW ?? 0, 1)
        const startH = Math.max(drag.startOverlayH ?? 0, 1)
        const rawLeft = (drag.startOverlayX ?? 0) + dx * drag.sx
        const rawTop = (drag.startOverlayY ?? 0) + dy * drag.sy
        const cx = rawLeft + startW / 2
        const cy = rawTop
        const peerBoxes: SnapPeerBox[] = textFields
          .filter((f) => f.id !== dragId)
          .map((f) => {
            const ovPeer = svgEl.querySelector("#overlay_" + f.id) as SVGRectElement | null
            if (!ovPeer) return null
            const x = parseFloat(ovPeer.getAttribute("x") || "")
            const y = parseFloat(ovPeer.getAttribute("y") || "")
            const w = parseFloat(ovPeer.getAttribute("width") || "")
            const h = parseFloat(ovPeer.getAttribute("height") || "")
            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
              return null
            return { id: f.id, x, y, w, h }
          })
          .filter((b): b is SnapPeerBox => Boolean(b))

        const { nx, ny, guides, frameX, frameY, frameW, frameH, guideVx, guideHy } = applySnap(
          svgEl as unknown as SVGElement,
          cx,
          cy,
          startW,
          startH,
          peerBoxes
        )
        hideGuides(svgEl as unknown as SVGElement)
        if (guideVx !== null) {
          const id = guides.includes("cx") ? "guide-cx" : guides.includes("left") ? "guide-left" : "guide-right"
          createGuideLine(svgEl as unknown as SVGElement, id, guideVx, frameY, guideVx, frameY + frameH)
        }
        if (guideHy !== null) {
          const id = guides.includes("cy") ? "guide-cy" : guides.includes("top") ? "guide-top" : "guide-bottom"
          createGuideLine(svgEl as unknown as SVGElement, id, frameX, guideHy, frameX + frameW, guideHy)
        }

        const targetLeft = nx - startW / 2
        const targetTop = ny
        const currentRect = textOverlayRect(liveText)
        const shiftX = targetLeft - currentRect.rx
        const shiftY = targetTop - currentRect.ry
        const docEl = svgDocRef.current?.querySelector(idSelector(dragId)) as SVGElement | null
        if (docEl) {
          // Move tspans by preserving their relative line offsets to avoid mixing lines
          const tspans = Array.from(docEl.querySelectorAll("tspan")) as SVGElement[]
          if (tspans.length) {
            tspans.forEach((t) => {
              const oldY = parseFloat(t.getAttribute("y") || "0")
              const oldX = parseFloat(t.getAttribute("x") || "0")
              t.setAttribute("y", String(oldY + shiftY))
              t.setAttribute("x", String(oldX + shiftX))
            })
          } else {
            const oldX = parseFloat(docEl.getAttribute("x") || "0")
            const oldY = parseFloat(docEl.getAttribute("y") || "0")
            docEl.setAttribute("x", String(oldX + shiftX))
            docEl.setAttribute("y", String(oldY + shiftY))
          }
        }
        if (liveText) {
          const tspansLive = Array.from(liveText.querySelectorAll("tspan")) as SVGElement[]
          if (tspansLive.length) {
            tspansLive.forEach((t) => {
              const oldY = parseFloat(t.getAttribute("y") || "0")
              const oldX = parseFloat(t.getAttribute("x") || "0")
              t.setAttribute("y", String(oldY + shiftY))
              t.setAttribute("x", String(oldX + shiftX))
            })
          } else {
            const oldX = parseFloat(liveText.getAttribute("x") || "0")
            const oldY = parseFloat(liveText.getAttribute("y") || "0")
            liveText.setAttribute("x", String(oldX + shiftX))
            liveText.setAttribute("y", String(oldY + shiftY))
          }
          const r = textOverlayRect(liveText)
          const ov = svgEl.querySelector("#overlay_" + dragId)
          if (ov) {
            ; (ov as SVGRectElement).setAttribute("x", String(r.rx))
              ; (ov as SVGRectElement).setAttribute("y", String(r.ry))
              ; (ov as SVGRectElement).setAttribute("width", String(r.rw))
              ; (ov as SVGRectElement).setAttribute("height", String(r.rh))
          }

          renderTextHandles(dragId)
        }
        // Do not bump previewVersion during drag — we already update live DOM above; bumping would re-run the effect and rebuild the whole SVG every frame (jank)
      }
      if (drag.type === "resize") {
        const resizeDrag = drag
        const { sx, sy } = getScale()
        const dxSvg = (e.clientX - resizeDrag.startMouseX) * sx
        const dySvg = (e.clientY - resizeDrag.startMouseY) * sy

        const newCornerX = resizeDrag.startCornerX + dxSvg
        const newCornerY = resizeDrag.startCornerY + dySvg

        const startDiag = Math.hypot(
          resizeDrag.startCornerX - resizeDrag.anchorX,
          resizeDrag.startCornerY - resizeDrag.anchorY
        )
        const newDiag = Math.hypot(newCornerX - resizeDrag.anchorX, newCornerY - resizeDrag.anchorY)
        if (!startDiag || !Number.isFinite(startDiag)) return
        let scale = newDiag / startDiag
        if (!Number.isFinite(scale) || scale <= 0) scale = 1

        const rawFont = resizeDrag.startFontSizePx * scale
        const newFont = Math.max(4, Math.min(200, rawFont))

        const docEl = svgDocRef.current?.querySelector(idSelector(resizeDrag.id)) as SVGElement | null
        const liveText = svgEl.querySelector(idSelector(resizeDrag.id)) as SVGElement | null
        if (!docEl || !liveText) return

        const applyFontSize = (el: SVGElement) => {
          el.setAttribute("font-size", String(newFont))
            ; (el as unknown as HTMLElement).style.fontSize = String(newFont) + "px"
          const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
          tspans.forEach((t) => {
            if (t.hasAttribute("font-size")) t.setAttribute("font-size", String(newFont))
              ; (t as unknown as HTMLElement).style.fontSize = String(newFont) + "px"
            const style = t.getAttribute("style")
            if (style && style.includes("font-size")) {
              const withoutSize = style.replace(/font-size\s*:[^;]+;?/g, "")
              t.setAttribute("style", withoutSize ? `${withoutSize}font-size:${newFont}px;` : `font-size:${newFont}px;`)
            }
          })
        }

        applyFontSize(docEl)
        applyFontSize(liveText)

        if (selectedTextIdRef.current === resizeDrag.id) setSelectedTextFontSizeUi(newFont)

        const respaceTspansByFontSize = (el: SVGElement) => {
          const all = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
          const leaf = all.filter((t) => t.querySelectorAll("tspan").length === 0)
          if (leaf.length <= 1) return
          leaf.sort((a, b) => {
            const ay = parseFloat(a.getAttribute("y") || "0")
            const by = parseFloat(b.getAttribute("y") || "0")
            if (ay !== by) return ay - by
            const ax = parseFloat(a.getAttribute("x") || "0")
            const bx = parseFloat(b.getAttribute("x") || "0")
            return ax - bx
          })
          const firstY = parseFloat(leaf[0].getAttribute("y") || "0")
          const persistedStep = resizeDrag.startLineStep
          // Preserve the user's established line spacing (from Enter/new lines) by scaling it
          // with the current font size during resize. Fallback to ratio-based spacing.
          const stepY =
            Number.isFinite(persistedStep) && persistedStep > 0 && Number.isFinite(resizeDrag.startFontSizePx) && resizeDrag.startFontSizePx > 0
              ? (persistedStep * newFont) / resizeDrag.startFontSizePx
              : newFont * LINE_HEIGHT_RATIO
          leaf.forEach((t, i) => {
            t.setAttribute("y", String(firstY + i * stepY))
          })
          el.setAttribute("data-editor-line-step", String(stepY))
        }
        respaceTspansByFontSize(docEl)
        respaceTspansByFontSize(liveText)

        // Keep the opposite corner fixed using the visible overlay rect geometry (what the user sees),
        // which is more stable than getBBox() for anchored/multiline text.
        const desiredAnchor = (() => {
          const x0 = resizeDrag.startOverlayX
          const y0 = resizeDrag.startOverlayY
          const w0 = resizeDrag.startOverlayW
          const h0 = resizeDrag.startOverlayH
          if (resizeDrag.corner === "tl") return { x: x0 + w0, y: y0 + h0 } // anchor br
          if (resizeDrag.corner === "tr") return { x: x0, y: y0 + h0 } // anchor bl
          if (resizeDrag.corner === "bl") return { x: x0 + w0, y: y0 } // anchor tr
          return { x: x0, y: y0 } // corner br -> anchor tl
        })()

        const shiftToMatchAnchor = (el: SVGElement, dx: number, dy: number) => {
          const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
          if (tspans.length) {
            tspans.forEach((t) => {
              const ox = parseFloat(t.getAttribute("x") || "0")
              const oy = parseFloat(t.getAttribute("y") || "0")
              t.setAttribute("x", String(ox + dx))
              t.setAttribute("y", String(oy + dy))
            })
          } else {
            const ox = parseFloat(el.getAttribute("x") || "0")
            const oy = parseFloat(el.getAttribute("y") || "0")
            el.setAttribute("x", String(ox + dx))
            el.setAttribute("y", String(oy + dy))
          }
        }

        const current = textOverlayRect(liveText)
        const currentAnchor = (() => {
          const rx = current.rx
          const ry = current.ry
          const rw = current.rw
          const rh = current.rh
          if (resizeDrag.corner === "tl") return { x: rx + rw, y: ry + rh } // anchor br
          if (resizeDrag.corner === "tr") return { x: rx, y: ry + rh } // anchor bl
          if (resizeDrag.corner === "bl") return { x: rx + rw, y: ry } // anchor tr
          return { x: rx, y: ry } // corner br -> anchor tl
        })()

        const dxAnchor = desiredAnchor.x - currentAnchor.x
        const dyAnchor = desiredAnchor.y - currentAnchor.y
        shiftToMatchAnchor(docEl, dxAnchor, dyAnchor)
        shiftToMatchAnchor(liveText, dxAnchor, dyAnchor)

        const r = textOverlayRect(liveText)
        const ov = svgEl.querySelector("#overlay_" + resizeDrag.id) as SVGRectElement | null
        if (ov) {
          ov.setAttribute("x", String(r.rx))
          ov.setAttribute("y", String(r.ry))
          ov.setAttribute("width", String(r.rw))
          ov.setAttribute("height", String(r.rh))
        }

        renderTextHandles(resizeDrag.id)
      }
    }

    const onMouseUp = (e: MouseEvent | PointerEvent) => {
      if (!drag) return
      const wasDrag = drag.moved
      const type = drag.type
      const tid = "id" in drag ? (drag as any).id : ""

      const openEditorOnClick = type === "txt" && drag.type === "txt" ? drag.openEditorOnClick : false
      if (type === "multiResize" && "corner" in drag) {
        const cursorByCorner: Record<"tl" | "tr" | "bl" | "br", string> = {
          tl: "nwse-resize",
          tr: "nesw-resize",
          bl: "nesw-resize",
          br: "nwse-resize",
        }
          ; (drag.overlay as HTMLElement).style.cursor = cursorByCorner[drag.corner]
      } else {
        ; (drag.overlay as HTMLElement).style.cursor = "grab"
      }
      if (type === "txt" || type === "sticker" || type === "multi" || type === "marquee") hideGuides(svgEl)

      if (
        wasDrag &&
        (type === "txt" ||
          type === "resize" ||
          type === "img" ||
          type === "sticker" ||
          type === "stickerResize" ||
          type === "rotate-sticker" ||
          type === "multi" ||
          type === "multiResize")
      ) {
        const snap = textHistoryApiRef.current.pendingDragSnapshot
        if (snap) textHistoryApiRef.current.pushPastSnapshot(snap)
      }
      textHistoryApiRef.current.pendingDragSnapshot = null

      if (type === "marquee") {
        const marqueeDrag = drag
        marqueeDrag.rectEl.parentNode?.removeChild(marqueeDrag.rectEl)
        selectedImageZoneId = null
        setSelectedImageZoneIdState(null)

        if (!wasDrag) {
          renderTextHandles(null)
          renderStickerHandles(null)
          setSelectedTextIdsState([])
          setSelectedStickerIdsState([])
          setSelectedTextIdState(null)
          setSelectedStickerIdState(null)
          applySelectionStrokeStyle({ txtIds: [], stickerIds: [], imgId: null })
          drag = null
          return
        }

        const txtIds = marqueeDrag.idsTxt
        const stickerIds = marqueeDrag.idsSticker
        const total = txtIds.length + stickerIds.length
        if (total === 0) {
          renderTextHandles(null)
          renderStickerHandles(null)
          setSelectedTextIdsState([])
          setSelectedStickerIdsState([])
          setSelectedTextIdState(null)
          setSelectedStickerIdState(null)
          applySelectionStrokeStyle({ txtIds: [], stickerIds: [], imgId: null })
        } else if (total === 1 && txtIds.length === 1) {
          setSelectedTextIdsState([txtIds[0]!])
          setSelectedStickerIdsState([])
          renderTextHandles(txtIds[0]!)
        } else if (total === 1 && stickerIds.length === 1) {
          setSelectedTextIdsState([])
          setSelectedStickerIdsState([stickerIds[0]!])
          renderStickerHandles(stickerIds[0]!)
        } else {
          selectedTextId = null
          selectedStickerId = null
          setSelectedTextIdState(null)
          setSelectedStickerIdState(null)
          setSelectedTextIdsState(txtIds)
          setSelectedStickerIdsState(stickerIds)
          applySelectionStrokeStyle({ txtIds, stickerIds, imgId: null })
          renderMultiSelectionHandles(txtIds, stickerIds)
        }
      }

      if (type === "multi" && !wasDrag) {
        const toggleCandidate = (drag as any).isToggleCandidate
        const toggleId = (drag as any).toggleId
        const toggleType = (drag as any).toggleType
        if (toggleCandidate) {
          if (toggleType === "txt") {
            setSelectedTextIdsState((prev) => {
              const set = new Set(prev)
              set.delete(toggleId)
              const next = Array.from(set)
              if (next.length + selectedStickerIdsRef.current.length > 1) {
                applySelectionStrokeStyle({ txtIds: next, stickerIds: selectedStickerIdsRef.current, imgId: null })
                renderMultiSelectionHandles(next, selectedStickerIdsRef.current)
              } else if (next.length === 1 && selectedStickerIdsRef.current.length === 0) {
                renderTextHandles(next[0]!)
                setSelectedStickerIdsState([])
              } else if (next.length === 0 && selectedStickerIdsRef.current.length === 1) {
                renderStickerHandles(selectedStickerIdsRef.current[0]!)
                setSelectedTextIdsState([])
              } else {
                applySelectionStrokeStyle({ txtIds: next, stickerIds: selectedStickerIdsRef.current, imgId: null })
              }
              return next
            })
          } else if (toggleType === "sticker") {
            setSelectedStickerIdsState((prev) => {
              const set = new Set(prev)
              set.delete(toggleId)
              const next = Array.from(set)
              if (next.length + selectedTextIdsRef.current.length > 1) {
                applySelectionStrokeStyle({ txtIds: selectedTextIdsRef.current, stickerIds: next, imgId: null })
                renderMultiSelectionHandles(selectedTextIdsRef.current, next)
              } else if (next.length === 1 && selectedTextIdsRef.current.length === 0) {
                setSelectedTextIdsState([])
                renderStickerHandles(next[0]!)
              } else if (next.length === 0 && selectedTextIdsRef.current.length === 1) {
                setSelectedStickerIdsState([])
                renderTextHandles(selectedTextIdsRef.current[0]!)
              } else {
                applySelectionStrokeStyle({ txtIds: selectedTextIdsRef.current, stickerIds: next, imgId: null })
              }
              return next
            })
          }
        }
      }

      if (type === "multiResize") {
        const idsTxt = [...drag.idsTxt]
        const idsSticker = [...drag.idsSticker]
        // Keep multi-selection active after resize so handles remain visible
        // until the user explicitly deselects.
        selectedTextId = null
        selectedStickerId = null
        selectedImageZoneId = null
        setSelectedTextIdState(null)
        setSelectedStickerIdState(null)
        setSelectedImageZoneIdState(null)
        setSelectedTextIdsState(idsTxt)
        setSelectedStickerIdsState(idsSticker)
        applySelectionStrokeStyle({ txtIds: idsTxt, stickerIds: idsSticker, imgId: null })
        renderMultiSelectionHandles(idsTxt, idsSticker)
      }

      if (type === "img" && wasDrag) {
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        const finalOX = (drag.startOX ?? 0) + dx * drag.sx * IMAGE_DRAG_SPEED
        const finalOY = (drag.startOY ?? 0) + dy * drag.sy * IMAGE_DRAG_SPEED
        setZoneStates((prev) => {
          const st = prev[tid]
          if (!st) return prev
          const { clampedOX, clampedOY } = clampImageOffsets(finalOX, finalOY, st.scale || 1, st.zoneW, st.zoneH, st.imgW, st.imgH)
          return {
            ...prev,
            [tid]: { ...st, offsetX: clampedOX, offsetY: clampedOY },
          }
        })
        setPreviewVersion((v) => v + 1)
      }

      drag = null
      if ((type === "sticker" || type === "stickerResize" || type === "rotate-sticker" || type === "multi" || type === "multiResize") && wasDrag) {
        setPreviewVersion((v) => v + 1)
      }
      if (type === "resize") {
        // Restore hidden typing overlay and align it to resized text.
        if (hiddenTextEditorOverlay && hiddenTextEditorForTid === tid) {
          const liveText = svgEl.querySelector(idSelector(tid)) as SVGElement | null
          if (liveText) {
            const st = textOverlayRect(liveText)
            const liveRect = liveText.getBoundingClientRect()
            const svgRect = svgEl.getBoundingClientRect()
            const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
            const scaleX = svgRect.width / vb[2]
            const scaleY = svgRect.height / vb[3]

            const editorEl = hiddenTextEditorOverlay.querySelector("textarea,input") as
              | HTMLInputElement
              | HTMLTextAreaElement
              | null

            if (editorEl) {
              editorEl.style.left = liveRect.left + "px"
              editorEl.style.top = liveRect.top + "px"
              editorEl.style.width = Math.max(liveRect.width, 40) + "px"
              editorEl.style.height = Math.max(liveRect.height, 1) + "px"

              // Keep editor font-size aligned with visible SVG text.
              const cs2 = window.getComputedStyle(liveText as any)
              const baseSvgFontSize = parseFloat(cs2?.fontSize || "") || st.fs
              const leaf = liveText.querySelector("tspan") as SVGElement | null
              const leafCs = leaf ? window.getComputedStyle(leaf as any) : null
              const leafFontPx = leafCs ? parseFloat(leafCs.fontSize || "") : NaN
              const svgFontSizeForOverlay =
                Number.isFinite(leafFontPx) && leafFontPx > 0 ? leafFontPx : baseSvgFontSize
              const screenFs2 = svgFontSizeForOverlay * scaleX

              editorEl.style.fontFamily = leafCs?.fontFamily || cs2?.fontFamily || ""
              editorEl.style.fontWeight = leafCs?.fontWeight || cs2?.fontWeight || ""
              editorEl.style.fontStyle = leafCs?.fontStyle || cs2?.fontStyle || "normal"
              const rawLineHeight = (leafCs?.lineHeight || cs2?.lineHeight || "").trim()
              if (rawLineHeight && rawLineHeight !== "normal") {
                editorEl.style.lineHeight = rawLineHeight
              } else {
                const leaves = Array.from(liveText.querySelectorAll("tspan")).filter(
                  (t) => t.querySelectorAll("tspan").length === 0
                ) as SVGElement[]
                if (leaves.length >= 2) {
                  const y0 = parseFloat(leaves[0].getAttribute("y") || "")
                  const y1 = parseFloat(leaves[1].getAttribute("y") || "")
                  const dy = Math.abs(y1 - y0)
                  editorEl.style.lineHeight =
                    Number.isFinite(dy) && dy > 0 ? dy * scaleY + "px" : Math.max(screenFs2 * 1.25, 1) + "px"
                } else {
                  editorEl.style.lineHeight = Math.max(screenFs2 * 1.25, 1) + "px"
                }
              }
              editorEl.style.letterSpacing = cs2?.letterSpacing || ""
              editorEl.style.textAlign = cs2?.textAlign || ""
              editorEl.style.fontSize = screenFs2 + "px"
            }
          }
          hiddenTextEditorOverlay.style.display = ""
        }
        hiddenTextEditorOverlay = null
        hiddenTextEditorForTid = null

        suppressEditorCommitRef.current = false
        if (wasDrag) setPreviewVersion((v) => v + 1)
        return
      }

      if (wasDrag && type === "txt") setPreviewVersion((v) => v + 1)
      if (!wasDrag && type === "txt" && openEditorOnClick) {
        if (isMobile) {
          mobileDialogOpenedAtRef.current = Date.now()

          setMobileEditTextDialog({ isOpen: true, tid })
        } else {
          openEditor(tid)
        }
      }
    }

    const onWindowMouseDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Element | null
      if (!target) return

      // Ignore clicks that are inside the preview svg itself.
      if (svgEl.contains(target)) {
        if (isMobile && !target.closest("[data-text-handle], [data-sticker-handle], [data-multi-handle], [data-rotate-handle]")) {
          setIsMobileSizeDialogOpen(false)
          setIsStickerDialogOpen(false)
        }
        return
      }
      // Ignore clicks in active inline editor overlay (textarea/input on top of svg).
      if (target.closest("#txt-editor-overlay")) return
      // Keep selected image-zone active while using its controls in the field editor panel
      // (e.g. zoom slider / remove button / upload trigger).
      if (
        selectedImageZoneId &&
        target.closest(`[data-image-zone-panel-id="${selectedImageZoneId}"]`)
      )
        return

      // Left panel (Duplicate, text inputs, stickers): mousedown must not clear selection before click.
      if (target.closest("#editor-left-panel")) return

      // Header controls (Font size, Duplicate, Delete): mousedown must not clear selection
      if (
        target.closest("#editor-header-controls") ||
        target.closest("#mobile-header-controls") ||
        target.closest("#mobile-size-dialog") ||
        target.closest("#mobile-bottom-actions") ||
        target.closest("#sticker-dialog")
      ) return

      // Close active inline text editor immediately to avoid blur-then-commit flicker.
      if (activeInlineEditor) {
        activeInlineEditor.commit({ bumpPreview: false })
        activeInlineEditor = null
      }

      // Pointer is outside the preview: sync ref immediately so in-effect stroke paint matches STATE 1.
      previewPointerRef.current.pointerInside = false
      previewPointerRef.current.hoverId = null
      setHoveredElementId(null)
      setIsPreviewHovering(false)
      if (isMobile) {
        setIsMobileSizeDialogOpen(false)
        setIsStickerDialogOpen(false)
      }

      // After we hide overlays, clear selection state (prevents the dashed/dotted stroke
      // from flashing before the overlay disappears).
      renderTextHandles(null)
      renderStickerHandles(null)
      selectedImageZoneId = null
      setSelectedImageZoneIdState(null)
      setSelectedTextIdState(null)
      setSelectedStickerIdState(null)
      setSelectedTextIdsState([])
      setSelectedStickerIdsState([])
      applySelectionStrokeStyle({ txtIds: [], stickerIds: [], imgId: null })
    }

    svgEl.addEventListener("pointerdown", onMouseDown as any)
    window.addEventListener("pointermove", onMouseMove as any)
    window.addEventListener("pointerup", onMouseUp as any)
    window.addEventListener("pointercancel", onMouseUp as any)
    window.addEventListener("pointerdown", onWindowMouseDown as any)

    return () => {
      svgEl.removeEventListener("pointerdown", onMouseDown as any)
      window.removeEventListener("pointermove", onMouseMove as any)
      window.removeEventListener("pointerup", onMouseUp as any)
      window.removeEventListener("pointercancel", onMouseUp as any)
      window.removeEventListener("pointerdown", onWindowMouseDown as any)
    }
  }, [previewVersion, textFields, zoneStates, pushPastBeforeMutation, isMobile])

  // Preview overlay stroke/opacity + handle visibility from pointer + hover + selection (no SVG re-clone).
  useEffect(() => {
    const svg = previewContainerRef.current?.querySelector("svg")
    if (!svg) return

    const solidTextIds = Array.from(
      new Set([...selectedTextIdsState, ...(selectedTextIdState ? [selectedTextIdState] : [])])
    )
    const solidStickerIds = Array.from(
      new Set([...selectedStickerIdsState, ...(selectedStickerIdState ? [selectedStickerIdState] : [])])
    )

    paintOverlayBoundingPresentation(svg, {
      pointerInsidePreview: isPreviewHovering,
      hoveredElementId,
      solidTextIds,
      solidStickerIds,
      solidImgId: selectedImageZoneIdState,
      forceShowHint: showInitialHintRef.current
    })
    paintOverlayHandleVisibility(svg, {
      selectedTextId: selectedTextIdState,
      selectedStickerId: selectedStickerIdState,
      selectedTextIds: selectedTextIdsState,
      selectedStickerIds: selectedStickerIdsState,
    })
  }, [
    isPreviewHovering,
    hoveredElementId,
    previewVersion,
    selectedTextIdState,
    selectedStickerIdState,
    selectedImageZoneIdState,
    selectedTextIdsState,
    selectedStickerIdsState,
  ])

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return

    const isPointInsideSvg = (clientX: number, clientY: number) => {
      const svg = container.querySelector("svg")
      if (!svg) return false
      const r = svg.getBoundingClientRect()
      return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
    }

    const onMove = (e: MouseEvent | PointerEvent) => {
      // When editing text, an invisible textarea sits above the SVG and can trigger svg mouseleave.
      // Using the SVG bounding box keeps hover state stable while the pointer is visually inside.
      const inside = isPointInsideSvg(e.clientX, e.clientY)
      setIsPreviewHovering(inside)
      if (!inside) {
        setHoveredElementId(null)
        return
      }
      const svg = container.querySelector("svg")
      if (!svg) return
      setHoveredElementId(pickHoveredOverlayZoneId(svg, e.clientX, e.clientY))
    }

    const onLeaveContainer = () => {
      setIsPreviewHovering(false)
      setHoveredElementId(null)
    }

    container.addEventListener("pointermove", onMove as any, { passive: true })
    container.addEventListener("pointerleave", onLeaveContainer)
    return () => {
      container.removeEventListener("pointermove", onMove as any)
      container.removeEventListener("pointerleave", onLeaveContainer)
    }
  }, [previewVersion])

  const handleExportPDF = useCallback(async () => {
    const doc = svgDocRef.current
    if (!doc) return
    setIsExporting(true)
    try {
      const { jsPDF } = await import("jspdf")
      // Build an export copy and inline sticker SVG assets so they are included
      // when the SVG is rasterized via data URL. Clone without serialize→parse so
      // complex templates (Inkscape, emoji, etc.) do not break re-parse like preview/export.
      const exportDoc = cloneSvgDocument(doc)
      if (!exportDoc) throw new Error("Could not clone SVG for export")

      // Limit scale to 3 to prevent excessively large PDFs (e.g. 190MB on mobile devices)
      const scale = 3

      const stickerEls = Array.from(exportDoc.querySelectorAll<SVGImageElement>(`image[id^="${STICKER_PREFIX}"]`))
      await Promise.all(
        stickerEls.map(async (el) => {
          const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim()
          if (!href || href.startsWith("data:")) return
          if (!href.toLowerCase().endsWith(".svg")) return
          try {
            const res = await fetch(href)
            if (!res.ok) return
            const stickerSvg = await res.text()
            const tw = Math.max(1, parseFloat(el.getAttribute("width") || "32"))
            const th = Math.max(1, parseFloat(el.getAttribute("height") || "32"))
            const pngDataUrl = await rasterizeStickerSvgToPngDataUrl(stickerSvg, tw, th, scale)
            el.setAttribute("href", pngDataUrl)
            el.removeAttribute("xlink:href")
          } catch {
            // Keep original href if inlining fails; export may still work in some browsers.
          }
        })
      )


      // Embed Google Fonts as Base64 to ensure they render in the PDF export canvas (fixes iOS/mobile Safari export font bug)
      try {
        const fontsToLoad = new Set<string>()
        Array.from(exportDoc.querySelectorAll("*")).forEach((el) => {
          const ffAttr = el.getAttribute("font-family") || (el as unknown as HTMLElement).style?.fontFamily
          if (ffAttr) {
            ffAttr.split(",").forEach(f => fontsToLoad.add(f.replace(/['"]/g, "").trim()))
          }
          const style = el.getAttribute("style")
          if (style) {
            const match = style.match(/font-family\s*:\s*([^;]+)/)
            if (match && match[1]) {
              match[1].split(",").forEach(f => fontsToLoad.add(f.replace(/['"]/g, "").trim()))
            }
          }
        })
        const systemFonts = new Set([
          "sans-serif", "serif", "monospace", "none",
          "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Palatino", "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact"
        ])
        const fontImports = Array.from(fontsToLoad).filter((f) => f && !systemFonts.has(f))


        if (fontImports.length > 0) {
          const cssUrl = `https://fonts.googleapis.com/css2?${fontImports.map(f => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`


          // Use a modern User-Agent so Google Fonts always returns WOFF2 formats with full subsets
          const cssRes = await fetch(cssUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
            }
          })


          if (cssRes.ok) {
            const cssText = await cssRes.text()
            const urlMatches = Array.from(cssText.matchAll(/url\((https:\/\/[^)]+)\)/g))


            let finalCss = cssText
            await Promise.all(urlMatches.map(async (match) => {
              const rawUrl = match[1]
              const fontUrl = rawUrl.replace(/['"]/g, "")
              try {
                const fontRes = await fetch(fontUrl)
                if (!fontRes.ok) throw new Error("Bad response")
                const blob = await fontRes.blob()
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.readAsDataURL(blob)
                })


                // Ensure correct MIME type for iOS/Android SVG rendering
                const safeBase64 = base64.replace(/^data:[^;]+;base64,/, "data:font/woff2;base64,")
                finalCss = finalCss.replace(rawUrl, safeBase64)
              } catch (e: any) {
                console.warn("Failed to embed font", fontUrl)
              }
            }))
            const styleEl = exportDoc.createElementNS("http://www.w3.org/2000/svg", "style")
            styleEl.textContent = finalCss
            exportDoc.documentElement.insertBefore(styleEl, exportDoc.documentElement.firstChild)
          }
        }
      } catch (e: any) {
        console.warn("Failed to embed fonts for PDF export")
      }

      const s = new XMLSerializer().serializeToString(exportDoc)
      const { wPx: w, hPx: h } = getSVGSizePx(doc)
      // Render the SVG into a higher-resolution canvas so the resulting PDF PNG looks sharper.
      // (jsPDF embeds the canvas as a raster image, so this directly impacts perceived sharpness.)
      const canvas = document.createElement("canvas")
      canvas.width = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("No canvas context")
      ctx.scale(scale, scale)
      const img = new Image()
      const svgBlob = new Blob([s], { type: "image/svg+xml;charset=utf-8" })
      const svgObjectUrl = URL.createObjectURL(svgBlob)
      try {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {

            // Wait 1.5 seconds for base64 fonts inside the SVG to be fully decoded 
            // by the browser before drawing to canvas.
            setTimeout(() => {
              ctx.drawImage(img, 0, 0, w, h)
              resolve()
            }, 1500)
          }
          img.onerror = () => {
            reject(new Error("Composite SVG failed to rasterize"))
          }
          img.src = svgObjectUrl
        })
      } finally {
        URL.revokeObjectURL(svgObjectUrl)
      }
      const imgData = canvas.toDataURL("image/png")
      const { wMm: pw, hMm: ph } = getSVGSizeMm(doc)
      const pdf = new jsPDF({
        orientation: pw > ph ? "landscape" : "portrait",
        unit: "mm",
        format: [pw, ph],
      })
      pdf.addImage(imgData, "PNG", 0, 0, pw, ph)
      const filename = (template.name.replace(/[^a-z0-9]/gi, "_") || "export") + ".pdf"
      pdf.save(filename)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Export failed")
    } finally {
      setIsExporting(false)
    }
  }, [template.name])



  const handleMobileTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as any || {};
    const textarea = e.target;
    const caret = textarea.selectionStart ?? textarea.value.length;
    
    const isSpace = (typeof nativeEvent.data === "string" && nativeEvent.data.endsWith(" ")) || 
                    (!nativeEvent.inputType?.startsWith("delete") && textarea.value.charAt(caret - 1) === " ");
    const isEnter = nativeEvent.inputType === "insertLineBreak" || 
                    (typeof nativeEvent.data === "string" && nativeEvent.data.endsWith("\n")) ||
                    (!nativeEvent.inputType?.startsWith("delete") && textarea.value.charAt(caret - 1) === "\n");
    
    if ((isSpace || isEnter) && transliterationLanguage) {
      const charInserted = isSpace ? " " : "\n";
      
      let actualCaret = caret;
      if (textarea.value.charAt(actualCaret - 1) !== charInserted && textarea.value.charAt(actualCaret) === charInserted) {
          actualCaret += 1;
      }
      
      if (textarea.value.charAt(actualCaret - 1) === charInserted) {
        const valBefore = textarea.value.slice(0, actualCaret - 1) + textarea.value.slice(actualCaret);
        const range = getCurrentWordRange(valBefore, actualCaret - 1);
        const word = range.word.trim();
        const isStale = !mobileTransliteration.wordRange || word !== mobileTransliteration.wordRange.word.trim();

        if (word && isRomanPhoneticWord(word)) {
          if (mobileTransliteration.suggestions.length > 0 && !isStale) {
            textarea.value = valBefore;
            textarea.setSelectionRange(caret - 1, caret - 1);
            applyMobileSuggestion(mobileTransliteration.suggestions[0], charInserted, true);
            return;
          } else {
            textarea.value = valBefore;
            textarea.setSelectionRange(caret - 1, caret - 1);
            
            (async () => {
               try {
                  const params = new URLSearchParams({ word, language: transliterationLanguage! });
                  const response = await fetch("/api/transliteration?" + params.toString(), { cache: "no-store" });
                  const payload = await response.json();
                  const apiSuggestions: string[] = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
                  if (apiSuggestions.length > 0) {
                      const suggestion = apiSuggestions[0];
                      const actualEnd = (range as any).isAfterSingleSpace ? range.end + 1 : range.end;
                      textarea.value = valBefore.slice(0, range.start) + suggestion + valBefore.slice(actualEnd);
                      const nextCaret = range.start + suggestion.length;
                      textarea.value = textarea.value.slice(0, nextCaret) + charInserted + textarea.value.slice(nextCaret);
                      textarea.setSelectionRange(nextCaret + 1, nextCaret + 1);
                      const topSuggestions = Array.from(new Set(apiSuggestions.filter((s) => s !== word))).slice(0, 5);
                      setMobileTransliteration({
                          suggestions: [...topSuggestions, word],
                          wordRange: { start: range.start, end: range.start + suggestion.length, word: suggestion, isAfterSingleSpace: false }
                      });
                  } else {
                      textarea.value = valBefore.slice(0, caret - 1) + charInserted + valBefore.slice(caret - 1);
                      textarea.setSelectionRange(caret, caret);
                      handleMobileTextareaChange({ target: textarea, nativeEvent: {} } as any);
                  }
               } catch {
                  textarea.value = valBefore.slice(0, caret - 1) + charInserted + valBefore.slice(caret - 1);
                  textarea.setSelectionRange(caret, caret);
                  handleMobileTextareaChange({ target: textarea, nativeEvent: {} } as any);
               }
            })();
            return;
          }
        }
      }
    }
    const rawVal = e.target.value
    const val = enforceWesternNumerals(rawVal)

    if (val !== rawVal) {
      const caret = e.target.selectionStart
      e.target.value = val
      e.target.setSelectionRange(caret, caret)
    }

    const finalCaret = e.target.selectionStart ?? val.length

    if (mobileSuggestionDebounceRef.current) window.clearTimeout(mobileSuggestionDebounceRef.current)

    const supportsTransliteration = !!transliterationLanguage
    if (!supportsTransliteration) return

    const range = getCurrentWordRange(val, finalCaret)
    const word = range.word.trim()

    if (!word || !isRomanPhoneticWord(word)) {
      setMobileTransliteration({ suggestions: [], wordRange: null })
      return
    }

    mobileSuggestionDebounceRef.current = window.setTimeout(async () => {
      const currentReq = ++mobileSuggestionReqIdRef.current
      try {
        const params = new URLSearchParams({ word, language: transliterationLanguage! })
        const response = await fetch("/api/transliteration?" + params.toString(), { cache: "no-store" })
        const payload = await response.json()
        if (currentReq !== mobileSuggestionReqIdRef.current) return
        const apiSuggestions: string[] = Array.isArray(payload?.suggestions) ? payload.suggestions : []
        const topSuggestions = Array.from(new Set(apiSuggestions.filter((s) => s !== word))).slice(0, 5)
        setMobileTransliteration({
          suggestions: [...topSuggestions, word],
          wordRange: range
        })
      } catch {
        if (currentReq !== mobileSuggestionReqIdRef.current) return
        setMobileTransliteration({ suggestions: [], wordRange: null })
      }
    }, 300)
  }

  const applyMobileSuggestion = (suggestion: string, suffix: string = "", keepOpen: boolean = false) => {
    const textarea = document.getElementById("mobile-edit-text-textarea") as HTMLTextAreaElement
    if (!textarea || !mobileTransliteration.wordRange) return

    const val = textarea.value
    const { start, end, isAfterSingleSpace } = mobileTransliteration.wordRange
    const actualEnd = isAfterSingleSpace ? end + 1 : end
    
    const replacement = suggestion + suffix
    const nextValue = val.slice(0, start) + replacement + val.slice(actualEnd)
    const nextCaret = start + replacement.length

    textarea.value = nextValue
    textarea.setSelectionRange(nextCaret, nextCaret)
    textarea.focus()

    if (keepOpen) {
       setMobileTransliteration({
         suggestions: mobileTransliteration.suggestions,
         wordRange: { start, end: start + suggestion.length, word: suggestion, isAfterSingleSpace: false }
       })
    } else {
       setMobileTransliteration({ suggestions: [], wordRange: null })
       handleMobileTextareaChange({ target: textarea, nativeEvent: {} } as any)
    }
  }

  if (!template.svg) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-muted-foreground">This template has no SVG. Choose a template with an SVG from the templates page.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-3 sm:px-5">
        <div className="flex flex-1 min-w-0 items-center gap-4">
          <Link href="/" className="shrink-0">
            <span className="select-none font-sans text-[20px] sm:text-[28px] font-black italic tracking-tight text-[#E13B30]">
              Cardcraft
            </span>
          </Link>

          {/* Mobile Element Controls (beside logo) */}
          {isMobile && (selectedTextIdState || selectedStickerIdState || (selectedImageZoneIdState && selectedImageHasImage) || selectedTextIdsState.length + selectedStickerIdsState.length > 1) && (
            <div id="mobile-header-controls" className="flex flex-1 overflow-x-auto scrollbar-none sm:hidden items-center gap-5 ml-2 pr-4 pb-1">
              {/* Image Controls */}
              {selectedImageZoneIdState && selectedImageHasImage && (
                <>
                  <button onClick={() => setIsMobileSizeDialogOpen(true)} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Maximize2 className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">resize</span>
                  </button>
                  <button onClick={() => { pushPastBeforeMutation(); setZoneStates(p => ({ ...p, [selectedImageZoneIdState]: { ...p[selectedImageZoneIdState], flipH: !p[selectedImageZoneIdState].flipH } })); setPreviewVersion(v => v + 1) }} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><FlipHorizontal className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">flip</span>
                  </button>
                  <button onClick={() => selectedImageZone && removeImageFromZone(selectedImageZone)} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Trash2 className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">delete</span>
                  </button>
                </>
              )}
              {/* Text Controls */}
              {selectedTextIdState && !(selectedTextIdsState.length + selectedStickerIdsState.length > 1) && (
                <>
                  <button onClick={() => setMobileEditTextDialog({ isOpen: true, tid: selectedTextIdState })} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Pencil className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">edit</span>
                  </button>
                  <button onClick={duplicateSelected} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Copy className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">duplicate</span>
                  </button>
                  <button onClick={() => setIsMultiSelectMode(!isMultiSelectMode)} className={`flex flex-col items-center gap-0.5 ${isMultiSelectMode ? 'text-blue-600' : 'text-zinc-600'}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isMultiSelectMode ? 'bg-blue-100' : 'bg-zinc-100'}`}><ListChecks className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">multi</span>
                  </button>
                  <button onClick={() => setIsMobileSizeDialogOpen(true)} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Type className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">size</span>
                  </button>
                  <button onClick={deleteSelected} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Trash2 className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">delete</span>
                  </button>
                </>
              )}
              {/* Sticker / Multi-Select Controls */}
              {(!selectedImageZoneIdState || !selectedImageHasImage) && (!selectedTextIdState || selectedTextIdsState.length + selectedStickerIdsState.length > 1) && (
                <>
                  <button onClick={duplicateSelected} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Copy className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">duplicate</span>
                  </button>
                  <button onClick={() => setIsMultiSelectMode(!isMultiSelectMode)} className={`flex flex-col items-center gap-0.5 ${isMultiSelectMode ? 'text-blue-600' : 'text-zinc-600'}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isMultiSelectMode ? 'bg-blue-100' : 'bg-zinc-100'}`}><ListChecks className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">multi</span>
                  </button>
                  <button onClick={() => setIsMobileSizeDialogOpen(true)} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Maximize2 className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">size</span>
                  </button>
                  <button onClick={deleteSelected} className="flex flex-col items-center gap-0.5 text-zinc-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"><Trash2 className="h-5 w-5" /></div>
                    <span className="text-[11px] leading-tight">delete</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Desktop Controls (hidden on mobile) */}
        <div className="hidden sm:flex absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 justify-center" id="editor-header-controls">
          {(selectedTextIdState || selectedStickerIdState || (selectedImageZoneIdState && selectedImageHasImage) || selectedTextIdsState.length + selectedStickerIdsState.length > 1) && (
            <div className="flex items-center gap-1 rounded-full border border-border bg-[#F9FAFB] p-1 shadow-md sm:shadow-sm">
              {selectedImageZoneIdState && selectedImageZone && selectedImageHasImage && selectedImageState && (
                <>
                  <div className="flex items-center gap-2 px-2">
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => {
                        if (!panelImageZoomPushedRef.current[selectedImageZoneIdState]) {
                          pushPastBeforeMutation()
                          panelImageZoomPushedRef.current[selectedImageZoneIdState] = true
                        }
                        const scale = Math.max(1, (selectedImageState.scale || 1) - 0.1)
                        setZoneStates((prev) => {
                          const st = prev[selectedImageZoneIdState]
                          const { clampedOX, clampedOY } = clampImageOffsets(st.offsetX || 0, st.offsetY || 0, scale, st.zoneW, st.zoneH, st.imgW, st.imgH)
                          return {
                            ...prev,
                            [selectedImageZoneIdState]: { ...st, scale, offsetX: clampedOX, offsetY: clampedOY },
                          }
                        })
                        setPreviewVersion((v) => v + 1)
                        setTimeout(() => delete panelImageZoomPushedRef.current[selectedImageZoneIdState], 100)
                      }}
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="100"
                      max="300"
                      value={Math.round((selectedImageState.scale || 1) * 100)}
                      onChange={(e) => {
                        if (!panelImageZoomPushedRef.current[selectedImageZoneIdState]) {
                          pushPastBeforeMutation()
                          panelImageZoomPushedRef.current[selectedImageZoneIdState] = true
                        }
                        const scale = Math.max(1, Number(e.target.value) / 100)
                        setZoneStates((prev) => {
                          const st = prev[selectedImageZoneIdState]
                          const { clampedOX, clampedOY } = clampImageOffsets(st.offsetX || 0, st.offsetY || 0, scale, st.zoneW, st.zoneH, st.imgW, st.imgH)
                          return {
                            ...prev,
                            [selectedImageZoneIdState]: { ...st, scale, offsetX: clampedOX, offsetY: clampedOY },
                          }
                        })
                        setPreviewVersion((v) => v + 1)
                      }}
                      onPointerUp={() => {
                        delete panelImageZoomPushedRef.current[selectedImageZoneIdState]
                      }}
                      onPointerCancel={() => {
                        delete panelImageZoomPushedRef.current[selectedImageZoneIdState]
                      }}
                      className="h-1 w-24 accent-zinc-400"
                    />
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => {
                        if (!panelImageZoomPushedRef.current[selectedImageZoneIdState]) {
                          pushPastBeforeMutation()
                          panelImageZoomPushedRef.current[selectedImageZoneIdState] = true
                        }
                        const scale = Math.max(1, (selectedImageState.scale || 1) + 0.1)
                        setZoneStates((prev) => {
                          const st = prev[selectedImageZoneIdState]
                          const { clampedOX, clampedOY } = clampImageOffsets(st.offsetX || 0, st.offsetY || 0, scale, st.zoneW, st.zoneH, st.imgW, st.imgH)
                          return {
                            ...prev,
                            [selectedImageZoneIdState]: { ...st, scale, offsetX: clampedOX, offsetY: clampedOY },
                          }
                        })
                        setPreviewVersion((v) => v + 1)
                        setTimeout(() => delete panelImageZoomPushedRef.current[selectedImageZoneIdState], 100)
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className="mx-1 h-4 w-px bg-border"></div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 gap-1.5 rounded-full px-2 text-xs text-zinc-600 hover:bg-[#E5E7EB]"
                    onClick={() => {
                      pushPastBeforeMutation()
                      setZoneStates((prev) => ({
                        ...prev,
                        [selectedImageZone.id]: {
                          ...prev[selectedImageZone.id],
                          flipH: !prev[selectedImageZone.id].flipH,
                        },
                      }))
                      setPreviewVersion((v) => v + 1)
                    }}
                    title="Flip"
                  >
                    <FlipHorizontal className="h-3.5 w-3.5" />
                    Flip
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 gap-1.5 rounded-full px-2 text-xs text-zinc-600 hover:bg-[#E5E7EB]"
                    onClick={() => removeImageFromZone(selectedImageZone)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </>
              )}
              {selectedTextIdState && !(selectedTextIdsState.length + selectedStickerIdsState.length > 1) && (
                <>
                  <div className="flex items-center gap-2 px-2">
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => nudgeSelectedTextFontSize(-1)}
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="4"
                      max="200"
                      value={Math.round(selectedTextFontSizeUi || 16)}
                      onChange={(e) => setSelectedTextFontSize(Number(e.target.value))}
                      className="h-1 w-24 accent-zinc-400"
                    />
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => nudgeSelectedTextFontSize(1)}
                    >
                      +
                    </button>
                    <span className="ml-1 w-6 text-center text-xs font-medium text-zinc-600">
                      {Math.round(selectedTextFontSizeUi || 16)}
                    </span>
                  </div>
                  <div className="mx-1 h-4 w-px bg-border"></div>
                </>
              )}

              {!(selectedImageZoneIdState && selectedImageHasImage) && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`h-7 gap-1.5 rounded-full px-2 text-xs hover:bg-[#E5E7EB] ${isMultiSelectMode ? "bg-[#E5E7EB] text-blue-600" : "text-zinc-600"}`}
                    onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                    title="Multi Select"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    Multi Select
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 gap-1.5 rounded-full px-2 text-xs text-zinc-600 hover:bg-[#E5E7EB]"
                    onClick={duplicateSelected}
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-7 gap-1.5 rounded-full px-2 text-xs text-zinc-600 hover:bg-[#E5E7EB]"
                    onClick={deleteSelected}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Desktop Global Actions */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            data-sticker-toggle="true"
            className="h-10 gap-2 rounded-full border-[#E5E7EB] bg-[#F9FAFB] px-3 sm:px-4 font-medium text-zinc-700 shadow-sm hover:bg-[#E5E7EB]"
            onClick={() => {
              setIsStickerDialogOpen(!isStickerDialogOpen)
              setIsMultiSelectMode(false)
            }}
          >
            <Sticker className="h-4 w-4" />
            <span className="hidden sm:inline">Stickers</span>
          </Button>

          <div className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] p-1 shadow-sm" data-history-tick={historyTick}>
            <button
              type="button"
              disabled={historyPastRef.current.length === 0}
              onClick={() => undo()}
              title="Undo (Ctrl+Z)"
              className="flex h-8 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-[#E5E7EB] disabled:opacity-40"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={historyFutureRef.current.length === 0}
              onClick={() => redo()}
              title="Redo (Ctrl+Shift+Z)"
              className="flex h-8 w-10 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-[#E5E7EB] disabled:opacity-40"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleExportPDF}
            disabled={isExporting || !svgLoaded}
            className="h-10 gap-2 rounded-full bg-[#10b981] px-3 sm:px-6 font-medium text-white shadow-sm hover:bg-[#059669]"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">{isExporting ? "Downloading…" : "Download"}</span>
          </Button>
        </div>
      </header>


      {/* Mobile Global Actions Bottom Pill */}
      {isMobile && (
        <div id="mobile-bottom-actions" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-md border border-zinc-200/50">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            onClick={() => {
              setIsStickerDialogOpen(!isStickerDialogOpen)
              setIsMultiSelectMode(false)
            }}
          >
            <Sticker className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
            <button
              type="button"
              disabled={historyPastRef.current.length === 0}
              onClick={() => undo()}
              className="flex h-8 w-10 items-center justify-center rounded-full text-zinc-600 disabled:opacity-40"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={historyFutureRef.current.length === 0}
              onClick={() => redo()}
              className="flex h-8 w-10 items-center justify-center rounded-full text-zinc-600 disabled:opacity-40"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || !svgLoaded}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10b981] text-white hover:bg-[#059669] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Mobile Size/Resize Dialog */}
      {isMobile && isMobileSizeDialogOpen && (
        <div
          id="mobile-size-dialog"
          className="fixed left-4 right-4 z-[60] flex flex-col overflow-hidden rounded-xl border border-zinc-200/50 bg-white/70 shadow-xl animate-bounce-short"
          style={{ bottom: mobileSizeDialogY === null ? '120px' : 'auto', top: mobileSizeDialogY !== null ? mobileSizeDialogY : 'auto' }}
        >
          <div
            className="flex items-center justify-between border-b border-zinc-200/50 bg-transparent px-4 py-3 touch-none select-none cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.preventDefault()
              const target = e.currentTarget
              target.setPointerCapture(e.pointerId)

              const rect = (target.parentNode as HTMLElement).getBoundingClientRect()
              draggingSizeDialogRef.current = {
                startY: e.clientY,
                initY: rect.top,
              }

              const onMove = (me: PointerEvent) => {
                if (!draggingSizeDialogRef.current) return
                const dy = me.clientY - draggingSizeDialogRef.current.startY
                const newY = draggingSizeDialogRef.current.initY + dy
                const dialog = document.getElementById("mobile-size-dialog")
                if (dialog) {
                  dialog.style.bottom = 'auto'
                  dialog.style.top = `${newY}px`
                }
              }

              const onUp = (me: PointerEvent) => {
                const dialog = document.getElementById("mobile-size-dialog")
                if (dialog) {
                  setMobileSizeDialogY(parseFloat(dialog.style.top) || 0)
                }
                draggingSizeDialogRef.current = null
                target.releasePointerCapture(me.pointerId)
                target.removeEventListener('pointermove', onMove as any)
                target.removeEventListener('pointerup', onUp as any)
                target.removeEventListener('pointercancel', onUp as any)
              }

              target.addEventListener('pointermove', onMove as any)
              target.addEventListener('pointerup', onUp as any)
              target.addEventListener('pointercancel', onUp as any)
            }}
          >
            <div className="flex items-center gap-2 font-medium text-zinc-800">
              <MoveVertical className="h-4 w-4 text-zinc-400" />
              <span>Size</span>
            </div>
            <button
              type="button"
              className="p-1 text-zinc-400 hover:text-zinc-600"
              onClick={() => setIsMobileSizeDialogOpen(false)}
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 p-6">
            {selectedImageZoneIdState && selectedImageHasImage && selectedImageState ? (
              <>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 shadow-sm"
                  onClick={() => {
                    if (!panelImageZoomPushedRef.current[selectedImageZoneIdState]) {
                      pushPastBeforeMutation()
                      panelImageZoomPushedRef.current[selectedImageZoneIdState] = true
                    }
                    const scale = Math.max(1, (selectedImageState.scale || 1) - 0.1)
                    setZoneStates((prev) => {
                      const st = prev[selectedImageZoneIdState]
                      const { clampedOX, clampedOY } = clampImageOffsets(st.offsetX || 0, st.offsetY || 0, scale, st.zoneW, st.zoneH, st.imgW, st.imgH)
                      return {
                        ...prev,
                        [selectedImageZoneIdState]: { ...st, scale, offsetX: clampedOX, offsetY: clampedOY },
                      }
                    })
                    setPreviewVersion((v) => v + 1)
                    setTimeout(() => delete panelImageZoomPushedRef.current[selectedImageZoneIdState], 100)
                  }}
                >
                  -
                </button>
                <input
                  type="range"
                  min="100"
                  max="300"
                  value={Math.round((selectedImageState.scale || 1) * 100)}
                  onChange={(e) => {
                    if (!panelImageZoomPushedRef.current[selectedImageZoneIdState]) {
                      pushPastBeforeMutation()
                      panelImageZoomPushedRef.current[selectedImageZoneIdState] = true
                    }
                    const scale = Math.max(1, Number(e.target.value) / 100)
                    setZoneStates((prev) => {
                      const st = prev[selectedImageZoneIdState]
                      const { clampedOX, clampedOY } = clampImageOffsets(st.offsetX || 0, st.offsetY || 0, scale, st.zoneW, st.zoneH, st.imgW, st.imgH)
                      return {
                        ...prev,
                        [selectedImageZoneIdState]: { ...st, scale, offsetX: clampedOX, offsetY: clampedOY },
                      }
                    })
                    setPreviewVersion((v) => v + 1)
                  }}
                  onPointerUp={() => { delete panelImageZoomPushedRef.current[selectedImageZoneIdState] }}
                  onPointerCancel={() => { delete panelImageZoomPushedRef.current[selectedImageZoneIdState] }}
                  className="h-1 flex-1 accent-zinc-800"
                />
                <span className="text-xs font-medium text-zinc-600 w-8 text-center">{Math.round((selectedImageState.scale || 1) * 100)}%</span>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 shadow-sm"
                  onClick={() => {
                    if (!panelImageZoomPushedRef.current[selectedImageZoneIdState]) {
                      pushPastBeforeMutation()
                      panelImageZoomPushedRef.current[selectedImageZoneIdState] = true
                    }
                    const scale = Math.max(1, (selectedImageState.scale || 1) + 0.1)
                    setZoneStates((prev) => {
                      const st = prev[selectedImageZoneIdState]
                      const { clampedOX, clampedOY } = clampImageOffsets(st.offsetX || 0, st.offsetY || 0, scale, st.zoneW, st.zoneH, st.imgW, st.imgH)
                      return {
                        ...prev,
                        [selectedImageZoneIdState]: { ...st, scale, offsetX: clampedOX, offsetY: clampedOY },
                      }
                    })
                    setPreviewVersion((v) => v + 1)
                    setTimeout(() => delete panelImageZoomPushedRef.current[selectedImageZoneIdState], 100)
                  }}
                >
                  +
                </button>
              </>
            ) : selectedTextIdsState.length + selectedStickerIdsState.length > 1 || (selectedStickerIdState && !selectedTextIdState) ? (
              (() => {
                const initMultiScale = () => {
                  if (multiScaleStartRef.current) return
                  const liveSvg = previewContainerRef.current?.querySelector("svg")
                  if (!liveSvg) return

                  const activeTxtIds = Array.from(new Set([...selectedTextIdsState, ...(selectedTextIdState ? [selectedTextIdState] : [])]))
                  const activeStickerIds = Array.from(new Set([...selectedStickerIdsState, ...(selectedStickerIdState ? [selectedStickerIdState] : [])]))

                  const txtBoxes = activeTxtIds.map((id) => {
                    const ov = liveSvg.querySelector("#overlay_" + id)
                    if (!ov) return null
                    const x = parseFloat(ov.getAttribute("x") || "")
                    const y = parseFloat(ov.getAttribute("y") || "")
                    const w = parseFloat(ov.getAttribute("width") || "")
                    const h = parseFloat(ov.getAttribute("height") || "")
                    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return null
                    return { x, y, w, h }
                  }).filter((b): b is { x: number; y: number; w: number; h: number } => Boolean(b))

                  const stickerBoxes = activeStickerIds.map((id) => {
                    const ov = liveSvg.querySelector("#sticker_overlay_" + id)
                    if (!ov) return null
                    const x = parseFloat(ov.getAttribute("x") || "")
                    const y = parseFloat(ov.getAttribute("y") || "")
                    const w = parseFloat(ov.getAttribute("width") || "")
                    const h = parseFloat(ov.getAttribute("height") || "")
                    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return null
                    return { x, y, w, h }
                  }).filter((b): b is { x: number; y: number; w: number; h: number } => Boolean(b))

                  const all = [...txtBoxes, ...stickerBoxes]
                  if (all.length === 0) return
                  const left = Math.min(...all.map((b) => b.x))
                  const top = Math.min(...all.map((b) => b.y))
                  const right = Math.max(...all.map((b) => b.x + b.w))
                  const bottom = Math.max(...all.map((b) => b.y + b.h))
                  const anchorX = left + (right - left) / 2
                  const anchorY = top + (bottom - top) / 2

                  const startTxt: any = {}
                  const startTxtFontSize: any = {}
                  activeTxtIds.forEach(id => {
                    const live = liveSvg.querySelector(idSelector(id))
                    if (!live) return
                    const tspans = Array.from(live.querySelectorAll("tspan"))
                    startTxt[id] = {
                      x: parseFloat(live.getAttribute("x") || "0"),
                      y: parseFloat(live.getAttribute("y") || "0"),
                      tspanXY: tspans.map(t => ({ x: parseFloat(t.getAttribute("x") || "0"), y: parseFloat(t.getAttribute("y") || "0") }))
                    }

                    let baseFont = NaN
                    const leaf = Array.from(live.querySelectorAll("tspan")) as SVGElement[]
                    if (leaf[0] && leaf[0].hasAttribute("font-size")) {
                      baseFont = parseFloat(leaf[0].getAttribute("font-size") || "0")
                    } else if (live.hasAttribute("font-size")) {
                      baseFont = parseFloat(live.getAttribute("font-size") || "0")
                    } else {
                      const cs = window.getComputedStyle(leaf[0] ?? live)
                      baseFont = parseFloat(cs.fontSize || "16")
                    }
                    startTxtFontSize[id] = Number.isFinite(baseFont) && baseFont > 0 ? baseFont : 16
                  })
                  const startSticker: any = {}
                  activeStickerIds.forEach(id => {
                    const live = liveSvg.querySelector(idSelector(id))
                    if (!live) return
                    startSticker[id] = {
                      x: parseFloat(live.getAttribute("x") || "0"),
                      y: parseFloat(live.getAttribute("y") || "0"),
                      w: parseFloat(live.getAttribute("width") || "0"),
                      h: parseFloat(live.getAttribute("height") || "0")
                    }
                  })
                  multiScaleStartRef.current = { anchorX, anchorY, startTxt, startTxtFontSize, startSticker, baseSlider: multiSelectScaleUi }
                }

                const endMultiScale = () => {
                  multiScaleStartRef.current = null
                }

                return (
                  <>
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 shadow-sm"
                      onClick={() => {
                        initMultiScale()
                        setMultiSelectScaleUi(prev => {
                          const next = Math.max(10, prev - 10)
                          setMultiSelectScale(next)
                          return next
                        })
                        setTimeout(endMultiScale, 100)
                      }}
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      value={multiSelectScaleUi}
                      onChange={(e) => {
                        initMultiScale()
                        const val = Number(e.target.value)
                        setMultiSelectScaleUi(val)
                        setMultiSelectScale(val)
                      }}
                      onPointerDown={initMultiScale}
                      onPointerUp={endMultiScale}
                      onPointerCancel={endMultiScale}
                      className="h-1 flex-1 accent-zinc-800"
                    />
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 shadow-sm"
                      onClick={() => {
                        initMultiScale()
                        setMultiSelectScaleUi(prev => {
                          const next = Math.min(300, prev + 10)
                          setMultiSelectScale(next)
                          return next
                        })
                        setTimeout(endMultiScale, 100)
                      }}
                    >
                      +
                    </button>
                  </>
                )
              })()
            ) : (
              <>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 shadow-sm"
                  onClick={() => selectedTextIdState ? nudgeSelectedTextFontSize(-1) : null}
                >
                  -
                </button>
                <input
                  type="range"
                  min="4"
                  max="200"
                  value={Math.round(selectedTextFontSizeUi || 16)}
                  onChange={(e) => setSelectedTextFontSize(Number(e.target.value))}
                  className="h-1 flex-1 accent-zinc-800"
                />
                <span className="text-xs font-medium text-zinc-600 w-6 text-center">{Math.round(selectedTextFontSizeUi || 16)}</span>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 shadow-sm"
                  onClick={() => selectedTextIdState ? nudgeSelectedTextFontSize(1) : null}
                >
                  +
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div id="app" className="flex flex-1 flex-col overflow-hidden" style={isMobile ? undefined : { minHeight: 620 }}>
        {/* Hidden inputs for image uploads */}
        {imageZones.map((zone) => (
          <input
            key={zone.id}
            ref={(el) => {
              if (el) fileInputRefs.current[zone.id] = el
            }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              await applyImageToZone(zone.id, file)
              e.target.value = "" // Reset to allow selecting the same file again
            }}
          />
        ))}

        <div className={`flex flex-1 items-stretch justify-center overflow-hidden ${isMobile ? "" : "min-h-[570px]"}`}>
          {/* Draggable Sticker Dialog */}
          {isStickerDialogOpen && (
            <div
              id="sticker-dialog"
              ref={stickerDialogRef}
              className={`fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-lg ${isMobile ? "bottom-24 left-4 right-4 max-h-[40vh]" : "w-[280px]"}`}
              style={isMobile ? undefined : {
                left: stickerDialogPos.x,
                top: stickerDialogPos.y,
                maxHeight: 'calc(100vh - 100px)',
              }}
            >
              <div
                className={`flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 ${isMobile ? "" : "cursor-move"}`}
                onPointerDown={(e) => {
                  if (isMobile) return
                  e.preventDefault()
                  draggingDialogRef.current = {
                    startX: e.clientX,
                    startY: e.clientY,
                    initX: stickerDialogPos.x,
                    initY: stickerDialogPos.y,
                  }
                  const onMove = (me: PointerEvent) => {
                    if (!draggingDialogRef.current) return
                    const dx = me.clientX - draggingDialogRef.current.startX
                    const dy = me.clientY - draggingDialogRef.current.startY
                    setStickerDialogPos({
                      x: draggingDialogRef.current.initX + dx,
                      y: draggingDialogRef.current.initY + dy,
                    })
                  }
                  const onUp = () => {
                    draggingDialogRef.current = null
                    window.removeEventListener('pointermove', onMove)
                    window.removeEventListener('pointerup', onUp)
                  }
                  window.addEventListener('pointermove', onMove)
                  window.addEventListener('pointerup', onUp)
                }}
              >
                <span className="text-[13px] font-medium text-foreground">Stickers</span>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                  onClick={() => setIsStickerDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {stickerCategories.length === 0 ? (
                  <p className="py-4 text-center text-[12px] text-muted-foreground">No stickers available</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {stickerCategories.flatMap((cat) => cat.stickers).map((sticker, idx) => (
                      <button
                        key={`${sticker.path}-${idx}`}
                        type="button"
                        title={sticker.name}
                        className="flex h-16 items-center justify-center rounded-md border border-transparent bg-background p-1 transition-colors hover:border-border hover:bg-muted"
                        draggable={!isMobile}
                        onDragStart={(e) => {
                          if (isMobile) return
                          e.dataTransfer.setData("application/x-sticker", JSON.stringify(sticker))
                          e.dataTransfer.effectAllowed = "copy"
                        }}
                        onClick={() => {
                          addStickerToSvg(sticker)
                        }}
                      >
                        <img src={sticker.path || "/placeholder.svg"} alt={sticker.name} className="max-h-full max-w-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div
              ref={previewContainerRef}
              className="flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-2 sm:p-5 pb-24 sm:pb-5"
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("application/x-sticker")) {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "copy"
                }
              }}
              onDrop={(e) => {
                const raw = e.dataTransfer.getData("application/x-sticker")
                if (!raw) return
                e.preventDefault()
                try {
                  const sticker = JSON.parse(raw) as StickerItem
                  if (!sticker?.path) return
                  const pt = getSvgDropPointFromClient(e.clientX, e.clientY)
                  if (pt) addStickerToSvg(sticker, pt)
                  else addStickerToSvg(sticker)
                } catch {
                  // Ignore malformed drag payload.
                }
              }}
            >
              {!svgLoaded && (
                <div className="flex flex-col items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="text-[32px] opacity-20">◇</span>
                  <span>Preview appears here</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {(() => {
          if (!mobileEditTextDialog.isOpen || !mobileEditTextDialog.tid) return null;
          let mobileTextAlign: "left" | "center" | "right" = "left";
          try {
            const liveSvg = previewContainerRef.current?.querySelector("svg");
            if (liveSvg) {
              const el = liveSvg.querySelector(idSelector(mobileEditTextDialog.tid));
              if (el) {
                const anchor = el.getAttribute("text-anchor") || el.querySelector("tspan")?.getAttribute("text-anchor");
                if (anchor === "middle") mobileTextAlign = "center";
                else if (anchor === "end") mobileTextAlign = "right";
                else if (!anchor) {
                  const cs = window.getComputedStyle(el);
                  if (cs.textAnchor === "middle" || cs.textAlign === "center") mobileTextAlign = "center";
                  else if (cs.textAnchor === "end" || cs.textAlign === "right" || cs.textAlign === "end") mobileTextAlign = "right";
                }
              }
            }
          } catch {}

          return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <h3 className="font-normal text-zinc-700 text-lg">Edit Text</h3>
                <button
                  type="button"
                  onClick={(e) => {
                    if (Date.now() - mobileDialogOpenedAtRef.current < 500) { e.preventDefault(); return }
                    setMobileTransliteration({ suggestions: [], wordRange: null })
                    setMobileEditTextDialog({ isOpen: false, tid: null })
                  }}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <div className="p-5 pb-4">
                <textarea
                  autoFocus
                  key={mobileEditTextDialog.tid}
                  className="w-full resize-none rounded-lg border border-zinc-300 p-3 text-[17px] text-zinc-800 focus:border-[#2587E1] focus:outline-none focus:ring-1 focus:ring-[#2587E1]"
                  style={{ textAlign: mobileTextAlign }}
                  rows={4}
                  defaultValue={textValues[mobileEditTextDialog.tid] || ""}
                  id="mobile-edit-text-textarea"
                  onChange={handleMobileTextareaChange}
                  onKeyDown={async (e) => {
                    const textarea = e.target as HTMLTextAreaElement;
                    const val = textarea.value;
                    const caret = textarea.selectionStart ?? val.length;
                    const range = getCurrentWordRange(val, caret);
                    const word = range.word.trim();
                    const supportsTransliteration = !!transliterationLanguage;
                    const isTransliterating = supportsTransliteration && word && isRomanPhoneticWord(word);
                    const isStale = !mobileTransliteration.wordRange || word !== mobileTransliteration.wordRange.word.trim();
                    
                    if (isTransliterating && (mobileTransliteration.suggestions.length === 0 || isStale) && (e.key === "Enter" || e.key === " " || e.key === "Spacebar" || e.keyCode === 32)) {
                        e.preventDefault();
                        try {
                           const params = new URLSearchParams({ word, language: transliterationLanguage! });
                           const response = await fetch("/api/transliteration?" + params.toString(), { cache: "no-store" });
                           const payload = await response.json();
                           const apiSuggestions: string[] = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
                           if (apiSuggestions.length > 0) {
                               const suggestion = apiSuggestions[0];
                               const actualEnd = (range as any).isAfterSingleSpace ? range.end + 1 : range.end;
                               textarea.value = val.slice(0, range.start) + suggestion + val.slice(actualEnd);
                               const nextCaret = range.start + suggestion.length;
                               textarea.setSelectionRange(nextCaret, nextCaret);
                               const topSuggestions = Array.from(new Set(apiSuggestions.filter((s) => s !== word))).slice(0, 5);
                               setMobileTransliteration({
                                   suggestions: [...topSuggestions, word],
                                   wordRange: { start: range.start, end: range.start + suggestion.length, word: suggestion, isAfterSingleSpace: false }
                               });
                           } else {
                               handleMobileTextareaChange({ target: textarea } as any);
                           }
                        } catch (err) {
                           handleMobileTextareaChange({ target: textarea } as any);
                        }
                        
                        if (e.key === "Enter") {
                            const c = textarea.selectionStart ?? textarea.value.length;
                            textarea.value = textarea.value.slice(0, c) + "\n" + textarea.value.slice(c);
                            textarea.setSelectionRange(c + 1, c + 1);
                        } else if (e.key === " " || e.key === "Spacebar" || e.keyCode === 32) {
                            const c = textarea.selectionStart ?? textarea.value.length;
                            textarea.value = textarea.value.slice(0, c) + " " + textarea.value.slice(c);
                            textarea.setSelectionRange(c + 1, c + 1);
                        }
                        return;
                    }

                    if (mobileTransliteration.suggestions.length > 0) {
                      if (e.key === " " || e.key === "Spacebar" || e.keyCode === 32) {
                        e.preventDefault()
                        applyMobileSuggestion(mobileTransliteration.suggestions[0], " ", true)
                      } else if (e.key === "Enter") {
                        e.preventDefault()
                        applyMobileSuggestion(mobileTransliteration.suggestions[0], "\n", true)
                      }
                    }
                  }}
                />
                {mobileTransliteration.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mobileTransliteration.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault()
                          applyMobileSuggestion(suggestion)
                        }}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none ${idx === 0
                          ? "border-blue-500 bg-blue-100 text-slate-900"
                          : "border-slate-200 bg-white text-slate-900"
                          }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-3 px-5 pb-5">
                <Button
                  variant="outline"
                  type="button"
                  onClick={(e) => {
                    if (Date.now() - mobileDialogOpenedAtRef.current < 500) { e.preventDefault(); return }
                    setMobileTransliteration({ suggestions: [], wordRange: null })
                    setMobileEditTextDialog({ isOpen: false, tid: null })
                  }}
                  className="h-10 flex-1 rounded-md border-zinc-300 bg-zinc-200/50 px-6 font-normal text-zinc-600 hover:bg-zinc-200"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-10 flex-1 rounded-md bg-[#2587E1] px-8 font-normal text-white hover:bg-[#1A73C9]"
                  onClick={async (e) => {
                    if (Date.now() - mobileDialogOpenedAtRef.current < 500) { e.preventDefault(); return }
                    const textarea = document.getElementById("mobile-edit-text-textarea") as HTMLTextAreaElement
                    
                    if (textarea) {
                       const val = textarea.value;
                       let caret = textarea.selectionStart ?? val.length;
                       
                       // If caret is immediately after whitespace, look backwards to find the actual word
                       let searchCaret = caret;
                       while (searchCaret > 0 && /\s/.test(val.charAt(searchCaret - 1))) {
                           searchCaret--;
                       }
                       const range = getCurrentWordRange(val, searchCaret);
                       const word = range.word.trim();
                       const supportsTransliteration = !!transliterationLanguage;
                       const isStale = !mobileTransliteration.wordRange || word !== mobileTransliteration.wordRange.word.trim();
                       
                       if (supportsTransliteration && word && isRomanPhoneticWord(word) && (mobileTransliteration.suggestions.length === 0 || isStale)) {
                           try {
                               const params = new URLSearchParams({ word, language: transliterationLanguage! });
                               const response = await fetch("/api/transliteration?" + params.toString(), { cache: "no-store" });
                               const payload = await response.json();
                               const apiSuggestions: string[] = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
                               if (apiSuggestions.length > 0) {
                                   const suggestion = apiSuggestions[0];
                                   const actualEnd = (range as any).isAfterSingleSpace ? range.end + 1 : range.end;
                                   textarea.value = val.slice(0, range.start) + suggestion + val.slice(actualEnd);
                               }
                           } catch (err) {}
                       } else if (supportsTransliteration && mobileTransliteration.suggestions.length > 0 && word === mobileTransliteration.wordRange?.word.trim()) {
                           const suggestion = mobileTransliteration.suggestions[0];
                           const actualEnd = (mobileTransliteration.wordRange as any).isAfterSingleSpace ? mobileTransliteration.wordRange.end + 1 : mobileTransliteration.wordRange.end;
                           textarea.value = val.slice(0, mobileTransliteration.wordRange.start) + suggestion + val.slice(actualEnd);
                       }
                    }

                    const tid = mobileEditTextDialog.tid!
                    const val = enforceWesternNumerals(textarea ? textarea.value : (textValues[tid] || ""))
                    const docEl2 = svgDocRef.current?.querySelector(`[id="${tid}"]`) as SVGElement | null
                    const liveText = previewContainerRef.current?.querySelector(`[id="${tid}"]`) as SVGElement | null
                    if (docEl2) {
                      pushPastBeforeMutation()
                      if (liveText) applyEditableValueToTextEl(liveText, val)
                      const liveStep = liveText ? parseFloat(liveText.getAttribute("data-editor-line-step") || "") : NaN
                      applyEditableValueToTextEl(docEl2, val, Number.isFinite(liveStep) && liveStep > 0 ? liveStep : undefined)
                      setTextValues((prev) => ({ ...prev, [tid]: val }))
                      setPreviewVersion((v) => v + 1)
                    }
                    setMobileTransliteration({ suggestions: [], wordRange: null })
                    setMobileEditTextDialog({ isOpen: false, tid: null })
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  )
}
