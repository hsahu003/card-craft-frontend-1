"use client"

import { useState, use, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Input } from "@/components/ui/input"
import { allTemplates, getTemplateById } from "@/lib/templates"
import { Redo2, ShoppingCart, Undo2 } from "lucide-react"
import { getSVGSize, getSVGElementSize, getTextMetrics, textOverlayRect, getClipBounds, applySnap, hideGuides, createGuideLine } from "@/lib/editor-svg-utils"
import type { ImageZoneState } from "@/lib/editor-types"
import {
  MAX_EDITOR_HISTORY,
  cloneZoneStates,
  type EditorHistoryEntry,
} from "@/lib/editor-text-history"
import { toast } from "sonner"

const EDITABLE_PREFIX = "editable_"
const IMAGE_ZONE_PREFIX = "image_zone_"
// Multiplier to make image drag feel more responsive.
// 1 = geometric mapping only, >1 = faster movement.
const IMAGE_DRAG_SPEED = 1.25
const IMAGE_COMPRESS_QUALITY = 0.75
const IMAGE_COMPRESS_SKIP_BELOW_BYTES = 500 * 1024
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
  const panelInputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({})
  // When starting a resize from resize handles, the inline editor overlay blurs.
  // Its blur handler calls `commit()`, which rebuilds the preview and interrupts resize dragging.
  // This flag suppresses commit during an active resize.
  const suppressEditorCommitRef = useRef(false)

  /** Undo/redo: full SVG + zoneStates (text + image zones). */
  const isApplyingHistoryRef = useRef(false)
  const historyPastRef = useRef<EditorHistoryEntry[]>([])
  const historyFutureRef = useRef<EditorHistoryEntry[]>([])
  const panelTextHistoryPushedRef = useRef<Record<string, boolean>>({})
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

  const pushPastSnapshot = useCallback((entry: EditorHistoryEntry) => {
    if (isApplyingHistoryRef.current) return
    historyPastRef.current.push(entry)
    if (historyPastRef.current.length > MAX_EDITOR_HISTORY) historyPastRef.current.shift()
    historyFutureRef.current = []
    setHistoryTick((t) => t + 1)
  }, [])

  const applyHistoryEntry = useCallback((entry: EditorHistoryEntry) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(entry.svg, "image/svg+xml")
    svgDocRef.current = doc
    setZoneStates(cloneZoneStates(entry.zoneStates))
    const textVals: Record<string, string> = {}
    doc.querySelectorAll<SVGElement>(`[id^="${EDITABLE_PREFIX}"]`).forEach((el) => {
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

    const s = new XMLSerializer().serializeToString(doc)
    const parser = new DOMParser()
    const previewDoc = parser.parseFromString(s, "image/svg+xml")
    const svgEl = previewDoc.documentElement as unknown as SVGElement
    svgEl.style.cssText = "max-width:100%;max-height:100%;display:block;border-radius:var(--rounded-md)"
    const { w: svgW, h: svgH } = getSVGElementSize(svgEl)
    // const { w: svgElW, h: svgElH } = getSVGElementSize(svgEl)
    if (!svgEl.getAttribute("viewBox")) {
      svgEl.setAttribute("viewBox", "0 0 " + svgW + " " + svgH)
    }

    const ns = "http://www.w3.org/2000/svg"

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
        rect.setAttribute("data-img-zone", zoneId)
        rect.setAttribute("style", "cursor:grab")
        if (st.hasClip && st.existingClipId) rect.setAttribute("clip-path", st.existingClipId)
        svgEl.appendChild(rect)
      }
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

    const renderTextHandles = (tid: string | null) => {
      selectedTextId = tid
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

    container.innerHTML = ""
    container.appendChild(svgEl)

    // After inserting into DOM, recompute text overlays using getBBox() (needed for multiline tspans)
    // so that selection/handles use accurate geometry.
    textFields.forEach(({ id: tid }) => {
      const tel = svgEl.querySelector(idSelector(tid)) as SVGElement | null
      const ov = svgEl.querySelector("#overlay_" + tid) as SVGRectElement | null
      if (!tel || !ov) return
      const r = textOverlayRect(tel)
      ov.setAttribute("x", String(r.rx))
      ov.setAttribute("y", String(r.ry))
      ov.setAttribute("width", String(r.rw))
      ov.setAttribute("height", String(r.rh))
    })

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
          moved: boolean
        }

    let drag: DragState | null = null
    let hiddenTextEditorOverlay: HTMLElement | null = null
    let hiddenTextEditorForTid: string | null = null

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
      const fontFamily = (leafCs?.fontFamily || cs?.fontFamily || "").trim() || st.ff
      const fontWeight = (leafCs?.fontWeight || cs?.fontWeight || "").trim() || st.fw
      const fontStyle = (leafCs?.fontStyle || cs?.fontStyle || "").trim() || "normal"
      const leafFontSizePx = leafCs ? parseFloat(leafCs.fontSize || "") : NaN
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
      const csTextAlign = cs?.textAlign || "start"

      const updateEditorRect = () => {
        const r = liveText.getBoundingClientRect()
        editorEl.style.left = r.left + "px"
        editorEl.style.top = r.top + "px"
        editorEl.style.width = Math.max(r.width, 40) + "px"
        const baseHeight = Math.max(r.height, 1)
        if (isMultiline && editorEl instanceof HTMLTextAreaElement) {
          // Keep caret alignment correct when user adds an empty new line:
          // SVG bbox can remain one-line until glyphs exist on next line.
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
      if (isMultiline) {
        editorEl.style.cssText = `position:fixed;left:${liveRect.left}px;top:${liveRect.top}px;width:${Math.max(liveRect.width, 40)}px;height:${Math.max(liveRect.height, 1)}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};font-style:${fontStyle};line-height:${overlayLineHeight};letter-spacing:${csLetterSpacing};text-align:${csTextAlign};background:transparent;border:none;outline:none;color:transparent;-webkit-text-fill-color:transparent;caret-color:#000;box-shadow:none;resize:none;z-index:100;padding:0;margin:0;overflow:hidden;white-space:pre;`
      } else {
        editorEl.style.cssText = `position:fixed;left:${liveRect.left}px;top:${liveRect.top}px;width:${Math.max(liveRect.width, 40)}px;height:${Math.max(liveRect.height, 1)}px;font-size:${screenFs}px;font-family:${fontFamily};font-weight:${fontWeight};font-style:${fontStyle};line-height:${overlayLineHeight};letter-spacing:${csLetterSpacing};text-align:${csTextAlign};background:transparent;border:none;outline:none;color:transparent;-webkit-text-fill-color:transparent;caret-color:#000;box-shadow:none;resize:none;z-index:100;padding:0;margin:0;overflow:hidden;white-space:pre;`
      }

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
        // Keep editor bounds and selection rect in sync with live text growth/shrink.
        updateEditorRect()
        if (ov) {
          const r = textOverlayRect(liveText)
          const editorRect = editorEl.getBoundingClientRect()
          const editorHeightSvg = editorRect.height / Math.max(scaleY, 0.0001)
          const nextHeight = Math.max(r.rh, editorHeightSvg)
          ;(ov as SVGRectElement).setAttribute("x", String(r.rx))
          ;(ov as SVGRectElement).setAttribute("y", String(r.ry))
          ;(ov as SVGRectElement).setAttribute("width", String(r.rw))
          ;(ov as SVGRectElement).setAttribute("height", String(nextHeight))
          renderTextHandles(tid)
        }
        setTextValues((prev) => ({ ...prev, [tid]: val }))
        const panel = panelInputRefs.current[tid]
        if (panel) panel.value = val
      })
      const overlayDiv = document.createElement("div")
      overlayDiv.id = "txt-editor-overlay"
      overlayDiv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;"

      overlayDiv.appendChild(editorEl)
      const commit = () => {
        if (suppressEditorCommitRef.current) return
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
        const panel = panelInputRefs.current[tid]
        if (panel) panel.value = val
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
        setPreviewVersion((v) => v + 1)
      }
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
      editorEl.addEventListener("blur", () => setTimeout(commit, 80))
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
      const imgOv = target.closest("[data-img-zone]")
      const txtOv = target.closest("[data-text-zone]")
      const up = target.closest("[data-upload-zone]")
      if (up) {
        const zoneId = up.getAttribute("data-upload-zone")
        if (zoneId && fileInputRefs.current[zoneId]) fileInputRefs.current[zoneId].click()
        return
      }
      if (!imgOv && !txtOv && !handle) {
        renderTextHandles(null)
        return
      }
      e.preventDefault()
      const { sx, sy } = getScale()
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
          moved: false,
        }
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
        ;(handle as unknown as HTMLElement).style.cursor = getComputedStyle(handle).cursor || "nwse-resize"
        return
      }
      if (imgOv) {
        const zoneId = imgOv.getAttribute("data-img-zone")!
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
        const tid = txtOv.getAttribute("data-text-zone")!
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
        }
        textHistoryApiRef.current.pendingDragSnapshot = textHistoryApiRef.current.captureHistoryEntry()
        ;(txtOv as HTMLElement).style.cursor = "grabbing"
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!drag) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true
      if (!drag.moved) return

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
      if (drag.type === "txt") {
        const liveText = svgEl.querySelector(idSelector(drag.id)) as SVGElement
        const startW = Math.max(drag.startOverlayW ?? 0, 1)
        const startH = Math.max(drag.startOverlayH ?? 0, 1)
        const rawLeft = (drag.startOverlayX ?? 0) + dx * drag.sx
        const rawTop = (drag.startOverlayY ?? 0) + dy * drag.sy
        const cx = rawLeft + startW / 2
        const cy = rawTop

        const { nx, ny, guides, frameX, frameY, frameW, frameH } = applySnap(
          svgEl as unknown as SVGElement,
          cx,
          cy,
          startW,
          startH
        )
        hideGuides(svgEl as unknown as SVGElement)
        guides.forEach((g) => {

          if (g === "left") createGuideLine(svgEl as unknown as SVGElement, "guide-left", frameX, frameY, frameX, frameY + frameH)
          if (g === "right")
            createGuideLine(
              svgEl as unknown as SVGElement,
              "guide-right",
              frameX + frameW,
              frameY,
              frameX + frameW,
              frameY + frameH
            )
          if (g === "top") createGuideLine(svgEl as unknown as SVGElement, "guide-top", frameX, frameY, frameX + frameW, frameY)
          if (g === "bottom")
            createGuideLine(
              svgEl as unknown as SVGElement,
              "guide-bottom",
              frameX,
              frameY + frameH,
              frameX + frameW,
              frameY + frameH
            )
          if (g === "cx")
            createGuideLine(
              svgEl as unknown as SVGElement,
              "guide-cx",
              frameX + frameW / 2,
              frameY,
              frameX + frameW / 2,
              frameY + frameH
            )
          if (g === "cy")
            createGuideLine(
              svgEl as unknown as SVGElement,
              "guide-cy",
              frameX,
              frameY + frameH / 2,
              frameX + frameW,
              frameY + frameH / 2
            )
        })

        const targetLeft = nx - startW / 2
        const targetTop = ny
        const currentRect = textOverlayRect(liveText)
        const shiftX = targetLeft - currentRect.rx
        const shiftY = targetTop - currentRect.ry
        const docEl = svgDocRef.current?.querySelector(idSelector(drag.id)) as SVGElement | null
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
          const ov = svgEl.querySelector("#overlay_" + drag.id)
          if (ov) {
            ;(ov as SVGRectElement).setAttribute("x", String(r.rx))
            ;(ov as SVGRectElement).setAttribute("y", String(r.ry))
            ;(ov as SVGRectElement).setAttribute("width", String(r.rw))
            ;(ov as SVGRectElement).setAttribute("height", String(r.rh))
          }
          renderTextHandles(drag.id)
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

        const updatePosition = (el: SVGElement) => {
          let bb: { x: number; y: number; width: number; height: number } | null = null
          try {
            const b = (el as unknown as SVGGraphicsElement).getBBox?.()
            if (b && b.width > 0 && b.height > 0) {
              bb = { x: b.x, y: b.y, width: b.width, height: b.height }
            }
          } catch {}
          if (!bb) return

          const anchors: Record<"tl" | "tr" | "bl" | "br", { x: number; y: number }> = {
            tl: { x: bb.x, y: bb.y },
            tr: { x: bb.x + bb.width, y: bb.y },
            bl: { x: bb.x, y: bb.y + bb.height },
            br: { x: bb.x + bb.width, y: bb.y + bb.height },
          }

          const anchorKey = ((): "tl" | "tr" | "bl" | "br" => {
            const c = resizeDrag.corner
            if (c === "tl") return "br"
            if (c === "tr") return "bl"
            if (c === "bl") return "tr"
            return "tl"
          })()

          const currentAnchor = anchors[anchorKey]
          const dxAnchor = resizeDrag.anchorX - currentAnchor.x
          const dyAnchor = resizeDrag.anchorY - currentAnchor.y

          const tspans = Array.from(el.querySelectorAll("tspan")) as SVGElement[]
          if (tspans.length) {
            tspans.forEach((t) => {
              const ox = parseFloat(t.getAttribute("x") || "0")
              const oy = parseFloat(t.getAttribute("y") || "0")
              t.setAttribute("x", String(ox + dxAnchor))
              t.setAttribute("y", String(oy + dyAnchor))
            })
          } else {
            const ox = parseFloat(el.getAttribute("x") || "0")
            const oy = parseFloat(el.getAttribute("y") || "0")
            el.setAttribute("x", String(ox + dxAnchor))
            el.setAttribute("y", String(oy + dyAnchor))
          }
        }

        updatePosition(docEl)
        updatePosition(liveText)

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
      ;(drag.overlay as HTMLElement).style.cursor = "grab"
      if (type === "txt") hideGuides(svgEl)

      if (wasDrag && (type === "txt" || type === "resize" || type === "img")) {
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
      if (!wasDrag && type === "txt") openEditor(tid)
    }

    svgEl.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      svgEl.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [previewVersion, textFields, zoneStates])

  const handleExportPDF = useCallback(async () => {
    const doc = svgDocRef.current
    if (!doc) return
    setIsExporting(true)
    try {
      const { jsPDF } = await import("jspdf")
      const s = new XMLSerializer().serializeToString(doc)
      const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(s)))
      const { w, h } = getSVGSize(doc)
      // Render the SVG into a higher-resolution canvas so the resulting PDF PNG looks sharper.
      // (jsPDF embeds the canvas as a raster image, so this directly impacts perceived sharpness.)
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      const scale = Math.max(3, Math.min(8, dpr * 3))
      const canvas = document.createElement("canvas")
      canvas.width = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("No canvas context")
      ctx.scale(scale, scale)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h)
          resolve()
        }
        img.onerror = reject
        img.src = dataUrl
      })
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

        {/* Main: left + right */}
        <div className="flex min-h-[570px] flex-1">
          {/* Left panel */}
          <div className="flex w-[290px] min-w-[250px] flex-col border-r border-border">
            <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
              {!svgLoaded ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : textFields.length === 0 && imageZones.length === 0 ? (
                <p className="py-6 text-center text-sm leading-relaxed text-muted-foreground">
                  No editable fields found.
                  <br />
                  <span className="text-xs">Use id=&quot;editable_*&quot; or id=&quot;image_zone_*&quot;</span>
                </p>
              ) : (
                <>
                  {textFields.length > 0 && (
                    <>
                      <p className="mb-1 mt-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Text fields</p>
                      <p className="mb-2 text-[11px] text-muted-foreground">Click to edit inline • Drag to move • Snaps to center & edges</p>
                      {textFields.map(({ id, label }) => (
                        <div key={id} className="mb-2.5">
                          <div className="mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                            {label}
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">text</span>
                          </div>
                          {((textValues[id] || "").includes("\n") || (textValues[id] || "").length > 60) ? (
                            <textarea
                              ref={(el) => {
                                if (el) panelInputRefs.current[id] = el
                              }}
                              className="min-h-[52px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground"
                              value={textValues[id] ?? ""}
                              onChange={(e) => {
                                if (!panelTextHistoryPushedRef.current[id]) {
                                  pushPastBeforeMutation()
                                  panelTextHistoryPushedRef.current[id] = true
                                }
                                const v = e.target.value
                                const docEl = svgDocRef.current?.querySelector(idSelector(id))
                                if (docEl) docEl.textContent = v
                                setTextValues((prev) => ({ ...prev, [id]: v }))
                                setPreviewVersion((x) => x + 1)
                              }}
                              onBlur={() => {
                                delete panelTextHistoryPushedRef.current[id]
                              }}
                            />
                          ) : (
                            <Input
                              ref={(el) => {
                                if (el) panelInputRefs.current[id] = el
                              }}
                              className="rounded-md border-border px-2.5 py-1.5 text-[13px]"
                              value={textValues[id] ?? ""}
                              onChange={(e) => {
                                if (!panelTextHistoryPushedRef.current[id]) {
                                  pushPastBeforeMutation()
                                  panelTextHistoryPushedRef.current[id] = true
                                }
                                const v = e.target.value
                                const docEl = svgDocRef.current?.querySelector(idSelector(id))
                                if (docEl) docEl.textContent = v
                                setTextValues((prev) => ({ ...prev, [id]: v }))
                                setPreviewVersion((x) => x + 1)
                              }}
                              onBlur={() => {
                                delete panelTextHistoryPushedRef.current[id]
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {imageZones.length > 0 && (
                    <>
                      <p className="mb-1 mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Image zones</p>
                      {imageZones.map((zone) => {
                        const st = zoneStates[zone.id]!
                        const hasImage = !!st.b64
                        return (
                          <div key={zone.id} className="mb-2.5">
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

          {/* Right panel */}
          <div className="flex flex-1 flex-col overflow-hidden">
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
              className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-5"
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
