"use client"

import { useState, use, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Input } from "@/components/ui/input"
import { allTemplates, getTemplateById } from "@/lib/templates"
import { Copy, Redo2, ShoppingCart, Trash2, Undo2 } from "lucide-react"
import {
  getSVGSize,
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
// Multiplier to make image drag feel more responsive.
// 1 = geometric mapping only, >1 = faster movement.
const IMAGE_DRAG_SPEED = 1.25
const IMAGE_COMPRESS_QUALITY = 0.75
const IMAGE_COMPRESS_SKIP_BELOW_BYTES = 500 * 1024
const ROTATE_SNAP_THRESHOLD_DEG = 5
const ROTATE_SNAP_TARGETS_DEG = [0, 90, 180, 270, 360] as const
// Line spacing multiplier so line-height scales with font-size (e.g. 1.25 = 125% of font size).
const LINE_HEIGHT_RATIO = 1.25

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

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { add: addToCart } = useCart()
  const template = getTemplateById(resolvedParams.id) ?? allTemplates[0]

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
    pushPastBeforeMutation: () => {},
    pushPastSnapshot: (_e: EditorHistoryEntry) => {},
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
  const [selectedStickerCategory, setSelectedStickerCategory] = useState("")
  const [selectedStickerIdState, setSelectedStickerIdState] = useState<string | null>(null)
  const [selectedTextIdState, setSelectedTextIdState] = useState<string | null>(null)
  const [selectedImageZoneIdState, setSelectedImageZoneIdState] = useState<string | null>(null)
  const [isPreviewHovering, setIsPreviewHovering] = useState(false)

  const selectedCategoryStickers = stickerCategories.find((c) => c.name === selectedStickerCategory)?.stickers ?? []
  const selectedTextField = selectedTextIdState ? textFields.find((field) => field.id === selectedTextIdState) ?? null : null
  const selectedTextValue = selectedTextIdState ? (textValues[selectedTextIdState] ?? "") : ""
  const isSelectedTextMultiline = selectedTextValue.includes("\n") || selectedTextValue.length > 60

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
          if (id) textVals[id] = el.textContent?.trim() ?? ""
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
          }
        })
        setImageZones(zones)
        setZoneStates(zStates)
        historyPastRef.current = []
        historyFutureRef.current = []
        setPreviewVersion((v) => v + 1)
        setSvgLoaded(true)
        setHistoryTick((t) => t + 1)
      })
      .catch(() => setSvgLoaded(false))
  }, [template.svg])

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

  const duplicateSelected = useCallback(() => {
    const doc = svgDocRef.current
    if (!doc) return

    const container = previewContainerRef.current
    const svgLive = container?.querySelector("svg") as SVGSVGElement | null

    const selectedTid = selectedTextIdState
    const selectedSid = selectedStickerIdState
    if (!selectedTid && !selectedSid) return

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

      const val = (textValues[selectedTid] ?? src.textContent ?? "").toString()
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
    if (!sid && !tid) return

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
    }
  }, [pushPastBeforeMutation, selectedStickerIdState, selectedTextIdState])

  const nudgeSelected = useCallback((dx: number, dy: number) => {
    const doc = svgDocRef.current
    if (!doc) return
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
      setZoneStates((prev) => ({
        ...prev,
        [zid]: { ...prev[zid], offsetX: nextOX, offsetY: nextOY },
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
      if (!selectedStickerIdState && !selectedTextIdState) return
      e.preventDefault()
      deleteSelected()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [deleteSelected, selectedStickerIdState, selectedTextIdState])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return
      if (!selectedStickerIdState && !selectedTextIdState && !selectedImageZoneIdState) return
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
    setPreviewVersion((v) => v + 1)
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

  const applyHistoryEntry = useCallback((entry: EditorHistoryEntry) => {
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
      if (id) textVals[id] = el.textContent?.trim() ?? ""
    })
    setTextValues(textVals)
    setPreviewVersion((v) => v + 1)
  }, [])

  const undo = useCallback(() => {
    if (isApplyingHistoryRef.current) return
    if (historyPastRef.current.length === 0) return
    const current = captureHistoryEntry()
    const previous = historyPastRef.current.pop()!
    historyFutureRef.current.push(current)
    isApplyingHistoryRef.current = true
    try {
      previewContainerRef.current?.querySelector("#txt-editor-overlay")?.remove()
      applyHistoryEntry(previous)
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
      applyHistoryEntry(next)
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
          ;(el as SVGImageElement).setAttribute("xlink:href", "")
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
      if (st.hasClip && st.existingClipId) {
        imgEl.setAttribute("clip-path", st.existingClipId)
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
        imgEl.setAttribute("clip-path", `url(#${clipId})`)
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
    svgEl.setAttribute("style", "max-width:100%;max-height:100%;display:block;border-radius:var(--rounded-md)")
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
      console.log("clipBounds", clipBounds)
      console.log("st", st)
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
        svgEl.appendChild(g)
        const hotspot = previewDoc.createElementNS(ns, "rect")
        hotspot.setAttribute("x", String(zoneX))
        hotspot.setAttribute("y", String(zoneY))
        hotspot.setAttribute("width", String(zoneW))
        hotspot.setAttribute("height", String(zoneH))
        hotspot.setAttribute("fill", "none")
        hotspot.setAttribute("data-upload-zone", zoneId)
        hotspot.setAttribute("pointer-events", "all")
        hotspot.setAttribute("style", "cursor:pointer")
        if (st.hasClip && st.existingClipId) hotspot.setAttribute("clip-path", st.existingClipId)
        svgEl.appendChild(hotspot)
      } else {
        const rect = previewDoc.createElementNS(ns, "rect")
        rect.setAttribute("x", String(zoneX))
        rect.setAttribute("y", String(zoneY))
        rect.setAttribute("width", String(zoneW))
        rect.setAttribute("height", String(zoneH))
        rect.setAttribute("fill", "transparent")
        // Selection box for image zones: draw around the effective clip bounds when clip-path exists.
        rect.setAttribute("stroke", "red")
        rect.setAttribute("stroke-width", "1")
        rect.setAttribute("stroke-dasharray", "3 2")
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
        } catch {}
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
      ov.setAttribute("stroke-width", "1")
      ov.setAttribute("stroke-dasharray", "3 2")
      ov.setAttribute("rx", "2")
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
      ov.setAttribute("stroke", "red")
      ov.setAttribute("stroke-width", "1")
      ov.setAttribute("stroke-dasharray", "3 2")
      ov.setAttribute("rx", "2")
      ov.setAttribute("style", "cursor:grab")
      ov.setAttribute("data-text-zone", tid)
      ov.setAttribute("id", "overlay_" + tid)
      svgEl.appendChild(ov)
    })

    // Selection state: which editable text is selected (shows bounding box + handles).
    let selectedTextId: string | null = null
    let selectedStickerId: string | null = selectedStickerIdState
    let selectedImageZoneId: string | null = selectedImageZoneIdState

    const applySelectionStrokeStyle = (kind: "txt" | "sticker" | "img" | null, id: string | null) => {
      Array.from(svgEl.querySelectorAll<SVGRectElement>("[data-text-zone],[data-sticker-zone],[data-img-zone]")).forEach((r) => {
        r.setAttribute("stroke-dasharray", "3 2")
      })
      if (!kind || !id) return
      let selected: SVGRectElement | null = null
      if (kind === "txt") selected = svgEl.querySelector("#overlay_" + id) as SVGRectElement | null
      if (kind === "sticker") selected = svgEl.querySelector("#sticker_overlay_" + id) as SVGRectElement | null
      if (kind === "img") selected = svgEl.querySelector(`[data-img-zone="${id}"]`) as SVGRectElement | null
      if (selected) selected.setAttribute("stroke-dasharray", "none")
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
      applySelectionStrokeStyle(tid ? "txt" : null, tid)
      // Remove any existing handle groups
      Array.from(svgEl.querySelectorAll<SVGGElement>('[data-text-handles="1"]')).forEach((g) => {
        g.parentNode?.removeChild(g)
      })
      if (!tid) return
      const ov = svgEl.querySelector("#overlay_" + tid) as SVGRectElement | null
      if (!ov) return
      const x = parseFloat(ov.getAttribute("x") || "0")
      const y = parseFloat(ov.getAttribute("y") || "0")
      const w = parseFloat(ov.getAttribute("width") || "0")
      const h = parseFloat(ov.getAttribute("height") || "0")
      if (!w || !h) return

      const g = previewDoc.createElementNS(ns, "g")
      g.setAttribute("id", "handles_" + tid)
      g.setAttribute("data-text-handles", "1")
      g.setAttribute("pointer-events", "none")

      const HANDLE_SIZE = Math.max(Math.min(Math.min(w, h) * 0.12, 12), 5)
      const R = HANDLE_SIZE / 2

      const corners: { key: "tl" | "tr" | "bl" | "br"; cx: number; cy: number; cursor: string }[] = [
        { key: "tl", cx: x, cy: y, cursor: "nwse-resize" },
        { key: "tr", cx: x + w, cy: y, cursor: "nesw-resize" },
        { key: "bl", cx: x, cy: y + h, cursor: "nesw-resize" },
        { key: "br", cx: x + w, cy: y + h, cursor: "nwse-resize" },
      ]

      corners.forEach(({ key, cx, cy, cursor }) => {
        const r = previewDoc.createElementNS(ns, "rect")
        r.setAttribute("x", String(cx - R))
        r.setAttribute("y", String(cy - R))
        r.setAttribute("width", String(HANDLE_SIZE))
        r.setAttribute("height", String(HANDLE_SIZE))
        r.setAttribute("rx", String(Math.max(1, HANDLE_SIZE * 0.25)))
        r.setAttribute("fill", "#ffffff")
        r.setAttribute("stroke", "#378ADD")
        r.setAttribute("stroke-width", "0.8")
        r.setAttribute("pointer-events", "all")
        r.setAttribute("data-text-handle", key)
        r.setAttribute("data-text-id", tid)
        r.setAttribute("style", "cursor:" + cursor)
        g.appendChild(r)
      })

      svgEl.appendChild(g)
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
      applySelectionStrokeStyle(sid ? "sticker" : null, sid)
      Array.from(svgEl.querySelectorAll<SVGGElement>('[data-sticker-handles="1"]')).forEach((g) => {
        g.parentNode?.removeChild(g)
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

      const g = previewDoc.createElementNS(ns, "g")
      g.setAttribute("id", "handles_sticker_" + sid)
      g.setAttribute("data-sticker-handles", "1")
      g.setAttribute("pointer-events", "none")
      const handleSize = Math.max(Math.min(Math.min(w, h) * 0.12, 12), 5)
      const r = handleSize / 2
      const corners: { key: "tl" | "tr" | "bl" | "br"; cx: number; cy: number; cursor: string }[] = [
        { key: "tl", cx: x, cy: y, cursor: "nwse-resize" },
        { key: "tr", cx: x + w, cy: y, cursor: "nesw-resize" },
        { key: "bl", cx: x, cy: y + h, cursor: "nesw-resize" },
        { key: "br", cx: x + w, cy: y + h, cursor: "nwse-resize" },
      ]
      corners.forEach(({ key, cx, cy, cursor }) => {
        const handle = previewDoc.createElementNS(ns, "rect")
        handle.setAttribute("x", String(cx - r))
        handle.setAttribute("y", String(cy - r))
        handle.setAttribute("width", String(handleSize))
        handle.setAttribute("height", String(handleSize))
        handle.setAttribute("rx", String(Math.max(1, handleSize * 0.25)))
        handle.setAttribute("fill", "#ffffff")
        handle.setAttribute("stroke", "#378ADD")
        handle.setAttribute("stroke-width", "0.8")
        handle.setAttribute("pointer-events", "all")
        handle.setAttribute("data-sticker-handle", key)
        handle.setAttribute("data-sticker-id", sid)
        handle.setAttribute("style", "cursor:" + cursor)
        g.appendChild(handle)
      })

      // Rotation handle (free rotation).
      const ROT_SIZE = Math.max(Math.min(handleSize * 0.95, 14), 6)
      const rotR = ROT_SIZE / 2
      const rotCx = pivotX
      const rotCy = y - ROT_SIZE * 0.7
      const rot = previewDoc.createElementNS(ns, "rect")
      rot.setAttribute("x", String(rotCx - rotR))
      rot.setAttribute("y", String(rotCy - rotR))
      rot.setAttribute("width", String(ROT_SIZE))
      rot.setAttribute("height", String(ROT_SIZE))
      rot.setAttribute("rx", String(Math.max(1, ROT_SIZE * 0.25)))
      rot.setAttribute("fill", "#ffffff")
      rot.setAttribute("stroke", "#378ADD")
      rot.setAttribute("stroke-width", "0.8")
      rot.setAttribute("pointer-events", "all")
      rot.setAttribute("data-rotate-handle", "1")
      rot.setAttribute("data-rotate-kind", "sticker")
      rot.setAttribute("data-rotate-id", sid)
      rot.setAttribute("style", "cursor:grab")
      g.appendChild(rot)

      if (Math.abs(angle) > 0.0001) {
        g.setAttribute("transform", `rotate(${angle} ${pivotX} ${pivotY})`)
      }
      svgEl.appendChild(g)
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
      } catch {}
    })

    // Keep latest selection visuals/handles visible across preview rebuilds.
    if (selectedTextIdState && svgEl.querySelector("#overlay_" + selectedTextIdState)) {
      renderTextHandles(selectedTextIdState)
    } else if (selectedStickerIdState && svgEl.querySelector("#sticker_overlay_" + selectedStickerIdState)) {
      renderStickerHandles(selectedStickerIdState)
    } else if (selectedImageZoneIdState && svgEl.querySelector(`[data-img-zone="${selectedImageZoneIdState}"]`)) {
      selectedImageZoneId = selectedImageZoneIdState
      applySelectionStrokeStyle("img", selectedImageZoneIdState)
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

    let drag: DragState | null = null
    let hiddenTextEditorOverlay: HTMLElement | null = null
    let hiddenTextEditorForTid: string | null = null
    let activeInlineEditor: null | { tid: string; commit: (opts?: { bumpPreview?: boolean }) => void } = null

    function getScale() {
      const bbox = svgEl.getBoundingClientRect()
      const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
      return { sx: vb[2] / bbox.width, sy: vb[3] / bbox.height }
    }

    function openEditor(tid: string) {
      let inlineHistoryPushed = false
      const docEl = svgDocRef.current?.querySelector(idSelector(tid))
      if (!docEl) return
      const liveText = svgEl.querySelector(idSelector(tid)) as SVGElement
      if (!liveText) return
      const ov = svgEl.querySelector("#overlay_" + tid)
      const bbox = svgEl.getBoundingClientRect()
      const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
      const scaleX = bbox.width / vb[2]
      const scaleY = bbox.height / vb[3]
      const st = textOverlayRect(liveText)
      const cs = typeof window !== "undefined" ? window.getComputedStyle(liveText as any) : (null as any)

      const getLeafTspans = (textEl: SVGElement) => {
        const all = Array.from(textEl.querySelectorAll("tspan")) as SVGElement[]
        // "Leaf" tspans: tspans that do not contain other tspans. This matches Inkscape multiline templates.
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

      const leafTspans = getLeafTspans(liveText)
      // If a template has at least one leaf <tspan>, open a multiline editor so the user can add more lines.
      const isMultiline = leafTspans.length >= 1
      const lines = leafTspans.map((t) => t.textContent || "")
      const txt = isMultiline ? lines.join("\n") : (lines[0] || liveText.textContent || "")
      // Match the effective font-size of the visible SVG text.
      // Many Inkscape templates define font-size on leaf <tspan>s, so parent <text> can differ.
      const firstLeaf = leafTspans[0]
      const leafCs = typeof window !== "undefined" && firstLeaf ? window.getComputedStyle(firstLeaf as any) : null
      console.log("leafCs", leafCs)
      const fontFamily = (leafCs?.fontFamily || cs?.fontFamily || "").trim() || st.ff
      const fontWeight = (leafCs?.fontWeight || cs?.fontWeight || "").trim() || st.fw
      const fontStyle = (leafCs?.fontStyle || cs?.fontStyle || "").trim() || "normal"
      const caretColor = (leafCs?.fill || cs?.fill || leafCs?.color || cs?.color || "").trim() || "#000"
      console.log("leafCs?.color", leafCs?.color)
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

      const normalizeEditableValue = (value: string) => {
        const hasVisibleContent = value
          .split("\n")
          .some((line) => line.trim().length > 0)
        return hasVisibleContent ? value : "text here"
      }

      const applyTextToTextEl = (target: SVGElement, val: string) => {
        const normalizedVal = normalizeEditableValue(val)
        const leaf = getLeafTspans(target)
        const parts = normalizedVal.split("\n")
        if (parts.length > 1) {
          // If we have multiline input but no leaf tspans exist, fall back to plain textContent.
          if (leaf.length === 0) {
            target.textContent = normalizedVal
            return
          }

          // If user typed more lines than existing leaf <tspan>s, create new leaf tspans.
          if (parts.length > leaf.length) {
            const firstX = parseFloat(leaf[0].getAttribute("x") || "0")
            const firstY = parseFloat(leaf[0].getAttribute("y") || "0")
            const lastTemplate = leaf[leaf.length - 1]

            // Compute line step in SVG units (not screen px) to avoid oversized gaps.
            let stepY = 0
            if (leaf.length >= 2) {
              const yPrev = parseFloat(leaf[leaf.length - 2].getAttribute("y") || "")
              const yLast = parseFloat(leaf[leaf.length - 1].getAttribute("y") || "")
              const dy = Math.abs(yLast - yPrev)
              if (Number.isFinite(dy) && dy > 0) stepY = dy
            }
            if (!(stepY > 0)) {
              const leafFontSizeSvg = parseFloat(leaf[0].getAttribute("font-size") || "")
              const targetFontSizeSvg = parseFloat(target.getAttribute("font-size") || "")
              const stFontSizeSvg = Number.isFinite(st.fs) && st.fs > 0 ? st.fs : NaN
              const fallbackFontSvg =
                Number.isFinite(leafFontSizeSvg) && leafFontSizeSvg > 0
                  ? leafFontSizeSvg
                  : Number.isFinite(targetFontSizeSvg) && targetFontSizeSvg > 0
                    ? targetFontSizeSvg
                    : Number.isFinite(stFontSizeSvg) && stFontSizeSvg > 0
                      ? stFontSizeSvg
                      : 14
              stepY = fallbackFontSvg * 1.25
            }

            for (let i = leaf.length; i < parts.length; i++) {
              const newLeaf = lastTemplate.cloneNode(false) as SVGElement
              // Avoid duplicate IDs; these are not needed for our logic.
              newLeaf.removeAttribute("id")
              newLeaf.setAttribute("x", String(firstX))
              newLeaf.setAttribute("y", String(firstY + i * stepY))
              newLeaf.textContent = parts[i] ?? ""
              target.appendChild(newLeaf)
            }
          }

          const leaf2 = getLeafTspans(target)
          leaf2.forEach((t, i) => {
            if (i < parts.length) {
              t.textContent = parts[i] ?? ""
            } else {
              t.parentNode?.removeChild(t)
            }
          })
        } else {
          if (leaf.length > 0) {
            // Collapse to a single visible line and remove stale extra lines.
            leaf[0].textContent = normalizedVal
            for (let i = 1; i < leaf.length; i++) leaf[i].parentNode?.removeChild(leaf[i])
          } else {
            const t = target.querySelector("tspan")
            if (t) t.textContent = normalizedVal
            else target.textContent = normalizedVal
          }
        }
      }

      const editorEl = document.createElement(isMultiline ? "textarea" : "input")
      if (!isMultiline) (editorEl as HTMLInputElement).type = "text"
      editorEl.value = txt
      const liveRect = liveText.getBoundingClientRect()
      const overlayLineHeight = getOverlayLineHeight(liveText, leafCs, cs)
      const csLetterSpacing = cs?.letterSpacing || "normal"

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
      console.log("caretColor", caretColor)
      if (isMultiline) {
        editorEl.style.cssText = `position:fixed;left:${liveRect.left}px;top:${liveRect.top}px;width:${Math.max(liveRect.width, 40)}px;height:${Math.max(liveRect.height, 1)}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};font-style:${fontStyle};line-height:${overlayLineHeight};letter-spacing:${csLetterSpacing};text-align:${textAlign};background:transparent;border:none;outline:none;color:transparent;-webkit-text-fill-color:transparent;caret-color:${caretColor};box-shadow:none;resize:none;z-index:100;padding:0;margin:0;overflow:hidden;white-space:pre;`
      } else {
        editorEl.style.cssText = `position:fixed;left:${liveRect.left}px;top:${liveRect.top}px;width:${Math.max(liveRect.width, 40)}px;height:${Math.max(liveRect.height, 1)}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};font-style:${fontStyle};line-height:${overlayLineHeight};letter-spacing:${csLetterSpacing};text-align:${textAlign};background:transparent;border:none;outline:none;color:transparent;-webkit-text-fill-color:transparent;caret-color:${caretColor};box-shadow:none;resize:none;z-index:100;padding:0;margin:0;overflow:hidden;white-space:pre;`
      }

      // Apply correct position immediately.
      updateEditorRect()

      editorEl.addEventListener("input", () => {
        if (!inlineHistoryPushed) {
          textHistoryApiRef.current.pushPastBeforeMutation()
          inlineHistoryPushed = true
        }
        const val = normalizeEditableValue(editorEl.value)
        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid)) as SVGElement | null
        if (docEl2) applyTextToTextEl(docEl2, val)
        // Keep the visible SVG text updated while typing (textarea text is transparent).
        applyTextToTextEl(liveText, val)
        updateEditorRect()
        if (ov) {
          const r = textOverlayRect(liveText)
          const editorHeightPx = editorEl.getBoundingClientRect().height
          const editorHeightSvg = editorHeightPx / Math.max(scaleY, 0.0001)
          const nextHeight = Math.max(r.rh, editorHeightSvg)
          ;(ov as SVGRectElement).setAttribute("x", String(r.rx))
          ;(ov as SVGRectElement).setAttribute("y", String(r.ry))
          ;(ov as SVGRectElement).setAttribute("width", String(r.rw))
          ;(ov as SVGRectElement).setAttribute("height", String(nextHeight))
          renderTextHandles(tid)
        }
        setTextValues((prev) => ({ ...prev, [tid]: val }))
        const panel = panelInputRef.current
        if (panel && selectedTextIdState === tid) panel.value = val
      })
      const overlayDiv = document.createElement("div")
      overlayDiv.id = "txt-editor-overlay"
      overlayDiv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;"

      overlayDiv.appendChild(editorEl)
      let committed = false
      const commit = (opts?: { bumpPreview?: boolean }) => {
        if (suppressEditorCommitRef.current) return
        if (committed) return
        committed = true
        const bumpPreview = opts?.bumpPreview !== false
        if (container) container.removeEventListener("scroll", onContainerScroll)
        window.removeEventListener("scroll", onGlobalScrollOrResize, true)
        window.removeEventListener("resize", onGlobalScrollOrResize)
        document.removeEventListener("scroll", onGlobalScrollOrResize, true)
        scrollParents.forEach((el) => el.removeEventListener("scroll", onGlobalScrollOrResize))
        if (overlayDiv.parentNode) overlayDiv.parentNode.removeChild(overlayDiv)
        const val = normalizeEditableValue(editorEl.value)
        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid)) as SVGElement | null
        if (docEl2) applyTextToTextEl(docEl2, val)
        setTextValues((prev) => ({ ...prev, [tid]: val }))
        const panel = panelInputRef.current
        if (panel && selectedTextIdState === tid) panel.value = val
        if (liveText) {
          applyTextToTextEl(liveText, val)
          liveText.style.display = ""
        }
        if (ov && liveText) {
          const r = textOverlayRect(liveText)
          ;(ov as SVGRectElement).setAttribute("x", String(r.rx))
          ;(ov as SVGRectElement).setAttribute("y", String(r.ry))
          ;(ov as SVGRectElement).setAttribute("width", String(r.rw))
          ;(ov as SVGRectElement).setAttribute("height", String(r.rh))
          ;(ov as HTMLElement).style.display = ""
        }
        if (bumpPreview) setPreviewVersion((v) => v + 1)
      }
      activeInlineEditor = { tid, commit }
      editorEl.addEventListener("keydown", (e) => {
        const ke = e as unknown as KeyboardEvent
        if (ke.key === "Escape") {
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
      editorEl.addEventListener("blur", () => setTimeout(() => commit(), 80))
      // Show the SVG text; the editor is caret-only and has transparent text.
      liveText.style.display = ""
      if (ov) (ov as HTMLElement).style.display = ""
      if (container) container.appendChild(overlayDiv)
      editorEl.style.pointerEvents = "auto"
      editorEl.focus()
    }

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Element
      const handle = target.closest("[data-text-handle]") as SVGElement | null
      const stickerHandle = target.closest("[data-sticker-handle]") as SVGElement | null
      const rotateHandle = target.closest("[data-rotate-handle='1']") as SVGElement | null
      const imgOv = target.closest("[data-img-zone]")
      const txtOv = target.closest("[data-text-zone]")
      const stickerOv = target.closest("[data-sticker-zone]")
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
        ;(rotateHandle as unknown as HTMLElement).style.cursor = "grabbing"

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
      if (!imgOv && !txtOv && !handle && !stickerOv && !stickerHandle) {
        // Clicked non-selectable area in SVG -> clear current selection.
        if (activeInlineEditor) {
          activeInlineEditor.commit({ bumpPreview: false })
          activeInlineEditor = null
        }
        renderTextHandles(null)
        renderStickerHandles(null)
        selectedImageZoneId = null
        setSelectedImageZoneIdState(null)
        applySelectionStrokeStyle(null, null)
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
      if (stickerHandle) {
        const sid = stickerHandle.getAttribute("data-sticker-id")
        const corner = stickerHandle.getAttribute("data-sticker-handle") as "tl" | "tr" | "bl" | "br" | null
        if (!sid || !corner) return
        const stickerEl = svgEl.querySelector(idSelector(sid)) as SVGImageElement | null
        const ov = svgEl.querySelector("#sticker_overlay_" + sid) as SVGRectElement | null
        if (!stickerEl || !ov) return
        const x = parseFloat(stickerEl.getAttribute("x") || "0")
        const y = parseFloat(stickerEl.getAttribute("y") || "0")
        const w = Math.max(parseFloat(stickerEl.getAttribute("width") || "0"), 1)
        const h = Math.max(parseFloat(stickerEl.getAttribute("height") || "0"), 1)
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
        ;(liveText as unknown as HTMLElement).style.display = ""
        ;(ov as unknown as HTMLElement).style.display = ""

        let bbox: { x: number; y: number; width: number; height: number } | null = null
        try {
          const b = (liveText as unknown as SVGGraphicsElement).getBBox?.()
          if (b && b.width > 0 && b.height > 0) {
            bbox = { x: b.x, y: b.y, width: b.width, height: b.height }
          }
        } catch {}
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
        ;(handle as unknown as HTMLElement).style.cursor = getComputedStyle(handle).cursor || "nwse-resize"
        return
      }
      if (imgOv) {
        renderStickerHandles(null)
        const zoneId = imgOv.getAttribute("data-img-zone")!
        selectedImageZoneId = zoneId
        setSelectedImageZoneIdState(zoneId)
        selectedTextId = null
        selectedStickerId = null
        setSelectedTextIdState(null)
        setSelectedStickerIdState(null)
        applySelectionStrokeStyle("img", zoneId)
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
        ;(imgOv as HTMLElement).style.cursor = "grabbing"
      }
      if (txtOv) {
        renderStickerHandles(null)
        const tid = txtOv.getAttribute("data-text-zone")!
        const prevSelected = selectedTextId
        renderTextHandles(tid)
        const docEl = svgDocRef.current?.querySelector(idSelector(tid))
        if (!docEl) return
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
        ;(txtOv as HTMLElement).style.cursor = "grabbing"
      }
      if (stickerOv) {
        renderTextHandles(null)
        const sid = stickerOv.getAttribute("data-sticker-zone")!
        const stickerEl = svgEl.querySelector(idSelector(sid)) as SVGImageElement | null
        if (!stickerEl) return
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
        ;(stickerOv as HTMLElement).style.cursor = "grabbing"
        renderStickerHandles(sid)
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!drag) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true
      if (!drag.moved) return

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
        const liveImage = svgEl.querySelector(idSelector(dragId)) as SVGImageElement | null
        if (liveImage) {
          const sx0 = drag.startImgX ?? parseFloat(liveImage.getAttribute("x") || "0")
          const sy0 = drag.startImgY ?? parseFloat(liveImage.getAttribute("y") || "0")
          liveImage.setAttribute("x", String(sx0 + (newOX - startOX)))
          liveImage.setAttribute("y", String(sy0 + (newOY - startOY)))
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
        const nextW = Math.max(10, drag.startW * scale)
        const nextH = Math.max(10, drag.startH * scale)
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
            ;(ov as SVGRectElement).setAttribute("x", String(r.rx))
            ;(ov as SVGRectElement).setAttribute("y", String(r.ry))
            ;(ov as SVGRectElement).setAttribute("width", String(r.rw))
            ;(ov as SVGRectElement).setAttribute("height", String(r.rh))
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
          ;(el as unknown as HTMLElement).style.fontSize = String(newFont) + "px"
          const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
          tspans.forEach((t) => {
            if (t.hasAttribute("font-size")) t.setAttribute("font-size", String(newFont))
            ;(t as unknown as HTMLElement).style.fontSize = String(newFont) + "px"
            const style = t.getAttribute("style")
            if (style && style.includes("font-size")) {
              const withoutSize = style.replace(/font-size\s*:[^;]+;?/g, "")
              t.setAttribute("style", withoutSize ? `${withoutSize}font-size:${newFont}px;` : `font-size:${newFont}px;`)
            }
          })
        }

        applyFontSize(docEl)
        applyFontSize(liveText)

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
          const stepY = newFont * LINE_HEIGHT_RATIO
          leaf.forEach((t, i) => {
            t.setAttribute("y", String(firstY + i * stepY))
          })
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

    const onMouseUp = (e: MouseEvent) => {
      if (!drag) return
      const wasDrag = drag.moved
      const type = drag.type
      const tid = drag.id
      const openEditorOnClick = type === "txt" && drag.type === "txt" ? drag.openEditorOnClick : false
      ;(drag.overlay as HTMLElement).style.cursor = "grab"
      if (type === "txt" || type === "sticker") hideGuides(svgEl)

      if (wasDrag && (type === "txt" || type === "resize" || type === "img" || type === "sticker" || type === "stickerResize" || type === "rotate-sticker")) {
        const snap = textHistoryApiRef.current.pendingDragSnapshot
        if (snap) textHistoryApiRef.current.pushPastSnapshot(snap)
      }
      textHistoryApiRef.current.pendingDragSnapshot = null

      if (type === "img" && wasDrag) {
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        const finalOX = (drag.startOX ?? 0) + dx * drag.sx * IMAGE_DRAG_SPEED
        const finalOY = (drag.startOY ?? 0) + dy * drag.sy * IMAGE_DRAG_SPEED
        setZoneStates((prev) => {
          const st = prev[tid]
          if (!st) return prev
          return {
            ...prev,
            [tid]: { ...st, offsetX: finalOX, offsetY: finalOY },
          }
        })
        setPreviewVersion((v) => v + 1)
      }

      drag = null
      if ((type === "sticker" || type === "stickerResize" || type === "rotate-sticker") && wasDrag) {
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
      if (!wasDrag && type === "txt" && openEditorOnClick) openEditor(tid)
    }

    const onWindowMouseDown = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      // Ignore clicks that are inside the preview svg itself.
      if (svgEl.contains(target)) return
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

      // Close active inline text editor immediately to avoid blur-then-commit flicker.
      if (activeInlineEditor) {
        activeInlineEditor.commit({ bumpPreview: false })
        activeInlineEditor = null
      }

      // Outside-svg click means overlays should be hidden right away.
      setIsPreviewHovering(false)
      Array.from(svgEl.querySelectorAll<SVGRectElement>("[data-text-zone],[data-sticker-zone],[data-img-zone]")).forEach((r) => {
        ;(r as unknown as HTMLElement).style.display = "none"
      })
      Array.from(svgEl.querySelectorAll<SVGGElement>('[data-text-handles="1"],[data-sticker-handles="1"]')).forEach((g) => {
        ;(g as unknown as HTMLElement).style.display = "none"
      })

      // After we hide overlays, clear selection state (prevents the dashed/dotted stroke
      // from flashing before the overlay disappears).
      renderTextHandles(null)
      renderStickerHandles(null)
      selectedImageZoneId = null
      setSelectedImageZoneIdState(null)
      setSelectedTextIdState(null)
      setSelectedStickerIdState(null)
      applySelectionStrokeStyle(null, null)
    }

    svgEl.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("mousedown", onWindowMouseDown)

    return () => {
      svgEl.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("mousedown", onWindowMouseDown)
    }
  }, [previewVersion, textFields, zoneStates, pushPastBeforeMutation])

  // Show overlay rects only while pointer is over the preview <svg> (not the padded container alone).
  useEffect(() => {
    const svg = previewContainerRef.current?.querySelector("svg")
    if (!svg) return
    const showAll = isPreviewHovering

    Array.from(svg.querySelectorAll<SVGRectElement>("[data-text-zone]")).forEach((r) => {
      const id = r.getAttribute("data-text-zone")
      const keepSelected = !!id && id === selectedTextIdState
      ;(r as unknown as HTMLElement).style.display = showAll || keepSelected ? "" : "none"
    })
    Array.from(svg.querySelectorAll<SVGRectElement>("[data-sticker-zone]")).forEach((r) => {
      const id = r.getAttribute("data-sticker-zone")
      const keepSelected = !!id && id === selectedStickerIdState
      ;(r as unknown as HTMLElement).style.display = showAll || keepSelected ? "" : "none"
    })
    Array.from(svg.querySelectorAll<SVGRectElement>("[data-img-zone]")).forEach((r) => {
      const id = r.getAttribute("data-img-zone")
      const keepSelected = !!id && id === selectedImageZoneIdState
      ;(r as unknown as HTMLElement).style.display = showAll || keepSelected ? "" : "none"
    })

    // Handle groups are single-selection per type in current flow.
    Array.from(svg.querySelectorAll<SVGGElement>('[data-text-handles="1"]')).forEach((g) => {
      ;(g as unknown as HTMLElement).style.display = showAll || !!selectedTextIdState ? "" : "none"
    })
    Array.from(svg.querySelectorAll<SVGGElement>('[data-sticker-handles="1"]')).forEach((g) => {
      ;(g as unknown as HTMLElement).style.display = showAll || !!selectedStickerIdState ? "" : "none"
    })
  }, [isPreviewHovering, previewVersion, selectedTextIdState, selectedStickerIdState, selectedImageZoneIdState])

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return

    const isPointInsideSvg = (clientX: number, clientY: number) => {
      const svg = container.querySelector("svg")
      if (!svg) return false
      const r = svg.getBoundingClientRect()
      return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
    }

    const onMove = (e: MouseEvent) => {
      // When editing text, an invisible textarea sits above the SVG and can trigger svg mouseleave.
      // Using the SVG bounding box keeps hover state stable while the pointer is visually inside.
      setIsPreviewHovering(isPointInsideSvg(e.clientX, e.clientY))
    }

    const onLeaveContainer = () => setIsPreviewHovering(false)

    container.addEventListener("mousemove", onMove, { passive: true })
    container.addEventListener("mouseleave", onLeaveContainer)
    return () => {
      container.removeEventListener("mousemove", onMove as any)
      container.removeEventListener("mouseleave", onLeaveContainer)
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
            const pngDataUrl = await rasterizeStickerSvgToPngDataUrl(stickerSvg, tw, th)
            el.setAttribute("href", pngDataUrl)
            el.removeAttribute("xlink:href")
          } catch {
            // Keep original href if inlining fails; export may still work in some browsers.
          }
        })
      )

      const s = new XMLSerializer().serializeToString(exportDoc)
      const { w, h } = getSVGSize(doc)
      // Render the SVG into a higher-resolution canvas so the resulting PDF PNG looks sharper.
      // (jsPDF embeds the canvas as a raster image, so this directly impacts perceived sharpness.)
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      const scale = Math.max(4, Math.min(12, dpr * 4))
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
            ctx.drawImage(img, 0, 0, w, h)
            resolve()
          }
          img.onerror = () => reject(new Error("Composite SVG failed to rasterize"))
          img.src = svgObjectUrl
        })
      } finally {
        URL.revokeObjectURL(svgObjectUrl)
      }
      const imgData = canvas.toDataURL("image/png")
      const pxToMm = (px: number) => (px * 25.4) / 96
      const pw = pxToMm(w)
      const ph = pxToMm(h)
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

  const handleAddToCart = useCallback(() => {
    const doc = svgDocRef.current
    let customMessage = ""
    if (doc) {
      const s = new XMLSerializer().serializeToString(doc)
      customMessage = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(s)))
    }
    const cartId = resolvedParams.id + "-" + Date.now()
    addToCart({
      id: cartId,
      name: template.name,
      category: template.category,
      price: template.price,
      colors: template.colors,
      emoji: template.emoji,
      customMessage,
    })
    router.push("/cart")
  }, [template, resolvedParams.id, addToCart, router])

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
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div id="app" className="flex flex-1 flex-col" style={{ minHeight: 620 }}>
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-[15px] font-medium text-foreground">SVG Field Editor</h1>
          <div className="flex items-center gap-2" data-history-tick={historyTick}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              disabled={historyPastRef.current.length === 0}
              onClick={() => undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="text-xs">Undo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              disabled={historyFutureRef.current.length === 0}
              onClick={() => redo()}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span className="text-xs">Redo</span>
            </Button>
            <span className="text-xs text-muted-foreground">{template.name}</span>
          </div>
        </div>

        {/* Main: left + right — items-start so the preview column height does not track the
            left panel (each duplicated text adds rows there). Otherwise flex stretch + centered
            preview makes the SVG look like it "moves down" as the center shifts. */}
        <div className="flex min-h-[570px] flex-1 items-start">
          {/* Left panel */}
          <div id="editor-left-panel" className="flex w-[290px] min-w-[250px] flex-col border-r border-border">
            <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
              {!svgLoaded ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : textFields.length === 0 && imageZones.length === 0 && stickerCategories.length === 0 ? (
                <p className="py-6 text-center text-sm leading-relaxed text-muted-foreground">
                  No editable fields found.
                  <br />
                  <span className="text-xs">Use id=&quot;editable_*&quot; or id=&quot;image_zone_*&quot;</span>
                </p>
              ) : (
                <>
                  {(selectedTextIdState || selectedStickerIdState) && (
                    <div className="mb-2 mt-1 flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/20 p-2">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Selection</div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 px-2 text-xs"
                          onClick={duplicateSelected}
                          title="Duplicate selected element"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={deleteSelected}
                          title="Delete selected text or sticker"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                  {textFields.length > 0 && (
                    <>
                      <p className="mb-1 mt-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Text fields</p>
                      <p className="mb-2 text-[11px] text-muted-foreground">
                        Click to select • Click again to edit • Drag to move • Delete/Backspace removes selection when not typing
                      </p>
                      {selectedTextField ? (
                        <div className="mb-2.5">
                          <div className="mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                            {selectedTextField.label}
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">text</span>
                          </div>
                          {isSelectedTextMultiline ? (
                            <textarea
                              ref={(el) => {
                                panelInputRef.current = el
                              }}
                              className="min-h-[52px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground"
                              value={selectedTextValue}
                              onChange={(e) => {
                                if (!selectedTextIdState) return
                                if (!panelTextHistoryPushedRef.current) {
                                  pushPastBeforeMutation()
                                  panelTextHistoryPushedRef.current = true
                                }
                                const v = e.target.value
                                const docEl = svgDocRef.current?.querySelector(idSelector(selectedTextIdState))
                                if (docEl) docEl.textContent = v
                                setTextValues((prev) => ({ ...prev, [selectedTextIdState]: v }))
                                setPreviewVersion((x) => x + 1)
                              }}
                              onBlur={() => {
                                panelTextHistoryPushedRef.current = false
                              }}
                            />
                          ) : (
                            <Input
                              ref={(el) => {
                                panelInputRef.current = el
                              }}
                              className="rounded-md border-border px-2.5 py-1.5 text-[13px]"
                              value={selectedTextValue}
                              onChange={(e) => {
                                if (!selectedTextIdState) return
                                if (!panelTextHistoryPushedRef.current) {
                                  pushPastBeforeMutation()
                                  panelTextHistoryPushedRef.current = true
                                }
                                const v = e.target.value
                                const docEl = svgDocRef.current?.querySelector(idSelector(selectedTextIdState))
                                if (docEl) docEl.textContent = v
                                setTextValues((prev) => ({ ...prev, [selectedTextIdState]: v }))
                                setPreviewVersion((x) => x + 1)
                              }}
                              onBlur={() => {
                                panelTextHistoryPushedRef.current = false
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="mb-2.5 rounded-md border border-dashed border-border bg-muted/20 px-2.5 py-3 text-[12px] text-muted-foreground">
                          Select a text element in the preview to edit it here.
                        </div>
                      )}
                    </>
                  )}

                  {imageZones.length > 0 && (
                    <>
                      <p className="mb-1 mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Image zones</p>
                      {imageZones.map((zone) => {
                        const st = zoneStates[zone.id]!
                        const hasImage = !!st.b64
                        return (
                          <div key={zone.id} className="mb-2.5" data-image-zone-panel-id={zone.id}>
                            <div className="mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                              {zone.label}
                              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">image</span>
                            </div>
                            <input
                              ref={(el) => {
                                if (el) fileInputRefs.current[zone.id] = el
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                pushPastBeforeMutation()
                                setZoneBusy((prev) => ({ ...prev, [zone.id]: true }))
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
                                    [zone.id]: {
                                      ...prev[zone.id],
                                      b64,
                                      imgW: iw,
                                      imgH: ih,
                                      scale: 1,
                                      offsetX: 0,
                                      offsetY: 0,
                                    },
                                  }))
                                  setSelectedTextIdState(null)
                                  setSelectedStickerIdState(null)
                                  setSelectedImageZoneIdState(zone.id)
                                  setPreviewVersion((v) => v + 1)
                                } catch {
                                  // Fallback: try original data URL path
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
                                      [zone.id]: {
                                        ...prev[zone.id],
                                        b64,
                                        imgW: img.naturalWidth,
                                        imgH: img.naturalHeight,
                                        scale: 1,
                                        offsetX: 0,
                                        offsetY: 0,
                                      },
                                    }))
                                    setSelectedTextIdState(null)
                                    setSelectedStickerIdState(null)
                                    setSelectedImageZoneIdState(zone.id)
                                    setPreviewVersion((v) => v + 1)
                                  } catch {
                                    toast.error("Image upload failed")
                                  }
                                } finally {
                                  setZoneBusy((prev) => ({ ...prev, [zone.id]: false }))
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                              disabled={!!zoneBusy[zone.id]}
                              onClick={() => fileInputRefs.current[zone.id]?.click()}
                            >
                              <span className="text-sm">+</span>
                              <span>
                                {zoneBusy[zone.id]
                                  ? "Compressing…"
                                  : hasImage
                                    ? fileInputRefs.current[zone.id]?.files?.[0]?.name?.slice(0, 20) || "Image"
                                    : "Choose image"}
                              </span>
                            </button>
                            {hasImage && (
                              <>
                                <button
                                  type="button"
                                  className="mt-1 w-full rounded-md border border-border py-1 px-2.5 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => {
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
                                      },
                                    }))
                                    const el = svgDocRef.current?.querySelector(idSelector(zone.id)) as SVGImageElement
                                    if (el) {
                                      el.removeAttribute("href")
                                      el.removeAttribute("xlink:href")
                                      el.setAttribute("x", String(zone.zoneX))
                                      el.setAttribute("y", String(zone.zoneY))
                                      el.setAttribute("width", String(zone.zoneW))
                                      el.setAttribute("height", String(zone.zoneH))
                                    }
                                    setPreviewVersion((v) => v + 1)
                                    toast.success("Image removed")
                                  }}
                                >
                                  Remove image
                                </button>
                                <div className="mt-1 flex items-center gap-2">
                                  <label className="w-7 shrink-0 text-[11px] text-muted-foreground">Zoom</label>
                                  <input
                                    type="range"
                                    min="50"
                                    max="300"
                                    value={Math.round((st.scale || 1) * 100)}
                                    onChange={(e) => {
                                      if (!panelImageZoomPushedRef.current[zone.id]) {
                                        pushPastBeforeMutation()
                                        panelImageZoomPushedRef.current[zone.id] = true
                                      }
                                      const scale = Number(e.target.value) / 100
                                      setZoneStates((prev) => ({
                                        ...prev,
                                        [zone.id]: { ...prev[zone.id], scale },
                                      }))
                                      setPreviewVersion((v) => v + 1)
                                    }}
                                    onPointerUp={() => {
                                      delete panelImageZoomPushedRef.current[zone.id]
                                    }}
                                    onPointerCancel={() => {
                                      delete panelImageZoomPushedRef.current[zone.id]
                                    }}
                                    className="h-0.5 flex-1"
                                  />
                                  <span className="min-w-8 text-right text-[11px] text-foreground">{Math.round((st.scale || 1) * 100)}%</span>
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">Drag image in preview to reposition</p>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}

                  <details className="mt-3 rounded-md border border-border/70 bg-muted/20 p-2" open>
                    <summary className="cursor-pointer list-none text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Stickers
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-muted-foreground">Category</label>
                        <select
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                          value={selectedStickerCategory}
                          onChange={(e) => setSelectedStickerCategory(e.target.value)}
                          disabled={stickerCategories.length === 0}
                        >
                          {stickerCategories.map((cat) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedCategoryStickers.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border px-2 py-2 text-[11px] text-muted-foreground">
                          No stickers available
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedCategoryStickers.map((sticker) => (
                            <button
                              key={sticker.path}
                              type="button"
                              title={sticker.name}
                              className="flex h-16 items-center justify-center rounded-md border border-border bg-background p-1 transition-colors hover:bg-muted"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/x-sticker", JSON.stringify(sticker))
                                e.dataTransfer.effectAllowed = "copy"
                              }}
                              onClick={() => addStickerToSvg(sticker)}
                            >
                              <img src={sticker.path || "/placeholder.svg"} alt={sticker.name} className="max-h-full max-w-full object-contain" />
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Click a sticker to add it centered. Drag, resize, or press Delete / Backspace (or use Delete in Selection) to remove a sticker or selected text.
                      </p>
                    </div>
                  </details>
                </>
              )}
            </div>

            {/* Left footer: Add to Cart */}
            <div className="border-t border-border p-3">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart – ₹{template.price}
              </Button>
            </div>
          </div>

          {/* Right panel: min height so preview stays usable; width still flex-1 */}
          <div className="flex min-h-[570px] min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Live Preview</span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isExporting || !svgLoaded}
                onClick={handleExportPDF}
              >
                {isExporting ? "Exporting…" : "Export PDF"}
              </Button>
            </div>
            <div
              ref={previewContainerRef}
              className="flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-5"
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
      </div>
    </div>
  )
}
