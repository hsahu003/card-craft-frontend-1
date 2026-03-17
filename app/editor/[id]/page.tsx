"use client"

import { useState, use, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Input } from "@/components/ui/input"
import { allTemplates, getTemplateById } from "@/lib/templates"
import { ShoppingCart } from "lucide-react"
import { getSVGSize, getSVGElementSize, getTextMetrics, textOverlayRect, getClipBounds, applySnap, hideGuides, createGuideLine } from "@/lib/editor-svg-utils"
import { toast } from "sonner"

const EDITABLE_PREFIX = "editable_"
const IMAGE_ZONE_PREFIX = "image_zone_"
// Multiplier to make image drag feel more responsive.
// 1 = geometric mapping only, >1 = faster movement.
const IMAGE_DRAG_SPEED = 4
/** Selector for element by id (avoids template literals in JSX for Turbopack) */
function idSelector(id: string) {
  return "[id=\"" + id + "\"]"
}

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

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { add: addToCart } = useCart()
  const template = getTemplateById(resolvedParams.id) ?? allTemplates[0]

  const svgDocRef = useRef<Document | null>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement>>({})
  const panelInputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({})

  const [previewVersion, setPreviewVersion] = useState(0)
  const [textFields, setTextFields] = useState<{ id: string; label: string }[]>([])
  const [imageZones, setImageZones] = useState<
    { id: string; label: string; zoneX: number; zoneY: number; zoneW: number; zoneH: number; hasClip: boolean }[]
  >([])
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const [zoneStates, setZoneStates] = useState<Record<string, ImageZoneState>>({})
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
        setPreviewVersion((v) => v + 1)
        setSvgLoaded(true)
      })
      .catch(() => setSvgLoaded(false))
  }, [template.svg])

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
      if (!st.b64) {
        const { zoneX, zoneY, zoneW, zoneH } = st
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
        svgEl.appendChild(hotspot)
      } else {
        const rect = previewDoc.createElementNS(ns, "rect")
        rect.setAttribute("x", String(st.zoneX))
        rect.setAttribute("y", String(st.zoneY))
        rect.setAttribute("width", String(st.zoneW))
        rect.setAttribute("height", String(st.zoneH))
        rect.setAttribute("fill", "transparent")
        rect.setAttribute("data-img-zone", zoneId)
        rect.setAttribute("style", "cursor:grab")
        
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
      ov.setAttribute("stroke", "transparent")
      ov.setAttribute("stroke-width", "1")
      ov.setAttribute("stroke-dasharray", "3 2")
      ov.setAttribute("rx", "2")
      ov.setAttribute("style", "cursor:grab")
      ov.setAttribute("data-text-zone", tid)
      ov.setAttribute("id", "overlay_" + tid)
      svgEl.appendChild(ov)
    })

    container.innerHTML = ""
    container.appendChild(svgEl)

    let drag: {
      type: "img" | "txt"
      id: string
      overlay: Element
      sx: number
      sy: number
      startX: number
      startY: number
      startOX?: number
      startOY?: number
      startTX?: number
      startTY?: number
      moved: boolean
    } | null = null

    function getScale() {
      const bbox = svgEl.getBoundingClientRect()
      const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
      return { sx: vb[2] / bbox.width, sy: vb[3] / bbox.height }
    }

    function openEditor(tid: string) {
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
      const fillColor = liveText.getAttribute("fill") || "#111"
      const txt = liveText.textContent || ""
      const screenX = (st.rx - vb[0]) * scaleX
      const screenY = (st.ry - vb[1]) * scaleY
      const screenW = st.rw * scaleX
      const screenH = st.rh * scaleY
      const screenFs = st.fs * scaleX
      const inp = document.createElement("input")
      inp.type = "text"
      inp.value = txt
      inp.style.cssText = `position:absolute;left:${bbox.left + screenX}px;top:${bbox.top + screenY}px;width:${Math.max(screenW, 40)}px;height:${screenH}px;font-size:${screenFs}px;font-family:${st.ff};font-weight:${st.fw};color:${fillColor};background:rgba(255,255,255,0.93);border:1.5px solid #378ADD;border-radius:2px;padding:0 4px;outline:none;z-index:100;`
      inp.addEventListener("input", () => {
        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid))
        if (docEl2) docEl2.textContent = inp.value
        setTextValues((prev) => ({ ...prev, [tid]: inp.value }))
        const panel = panelInputRefs.current[tid]
        if (panel) panel.value = inp.value
      })
      const overlayDiv = document.createElement("div")
      overlayDiv.id = "txt-editor-overlay"
      overlayDiv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;"
      overlayDiv.appendChild(inp)
      const commit = () => {
        if (overlayDiv.parentNode) overlayDiv.parentNode.removeChild(overlayDiv)
        const val = inp.value
        const docEl2 = svgDocRef.current?.querySelector(idSelector(tid))
        if (docEl2) docEl2.textContent = val
        setTextValues((prev) => ({ ...prev, [tid]: val }))
        const panel = panelInputRefs.current[tid]
        if (panel) panel.value = val
        if (liveText) {
          liveText.textContent = val
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
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault()
          commit()
        }
      })
      inp.addEventListener("blur", () => setTimeout(commit, 80))
      liveText.style.display = "none"
      if (ov) (ov as HTMLElement).style.display = "none"
      if (container) container.appendChild(overlayDiv)
      inp.style.pointerEvents = "auto"
      inp.focus()
      inp.select()
    }

    const onMouseDown = (e: MouseEvent) => {
      const imgOv = (e.target as Element).closest("[data-img-zone]")
      const txtOv = (e.target as Element).closest("[data-text-zone]")
      const up = (e.target as Element).closest("[data-upload-zone]")
      if (up) {
        const zoneId = up.getAttribute("data-upload-zone")
        if (zoneId && fileInputRefs.current[zoneId]) fileInputRefs.current[zoneId].click()
        return
      }
      if (!imgOv && !txtOv) return
      e.preventDefault()
      const { sx, sy } = getScale()
      if (imgOv) {
        const zoneId = imgOv.getAttribute("data-img-zone")!
        const st = zoneStates[zoneId]
        if (!st?.b64) return
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
          moved: false,
        }
        ;(imgOv as HTMLElement).style.cursor = "grabbing"
      }
      if (txtOv) {
        const tid = txtOv.getAttribute("data-text-zone")!
        const docEl = svgDocRef.current?.querySelector(idSelector(tid))
        if (!docEl) return
        drag = {
          type: "txt",
          id: tid,
          overlay: txtOv,
          sx,
          sy,
          startX: e.clientX,
          startY: e.clientY,
          startTX: parseFloat(docEl.getAttribute("x") || "0"),
          startTY: parseFloat(docEl.getAttribute("y") || "0"),
          moved: false,
        }
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
        setZoneStates((prev) => {
          const st = prev[drag!.id]
          if (!st) return prev
          return {
            ...prev,
            [drag!.id]: {
              ...st,
              offsetX: (drag!.startOX ?? 0) + dx * drag!.sx * IMAGE_DRAG_SPEED,
              offsetY: (drag!.startOY ?? 0) + dy * drag!.sy * IMAGE_DRAG_SPEED,
            },
          }
        })
        setPreviewVersion((v) => v + 1)
      }
      if (drag.type === "txt") {
        const rawX = (drag.startTX ?? 0) + dx * drag.sx
        const rawY = (drag.startTY ?? 0) + dy * drag.sy
        const liveText = svgEl.querySelector(idSelector(drag.id)) as SVGElement
        const st = textOverlayRect(liveText)
        const txtW = st.width
        const txtH = st.ascent + st.descent
        const anchor = st.anchor
        let cx: number
        if (anchor === "middle") cx = rawX
        else if (anchor === "end") cx = rawX - txtW / 2
        else cx = rawX + txtW / 2
        const cy = rawY - txtH / 2

        const { nx, ny, guides, frameX, frameY, frameW, frameH } = applySnap(svgEl as unknown as SVGElement, cx, cy, txtW, txtH)

        console.log("guides", guides);

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

        let finalX: number
        if (anchor === "middle") finalX = nx
        else if (anchor === "end") finalX = nx + txtW / 2
        else finalX = nx - txtW / 2
        const finalY = ny + txtH / 2
        const docEl = svgDocRef.current?.querySelector(idSelector(drag.id))
        if (docEl) {
          docEl.setAttribute("x", String(finalX))
          docEl.setAttribute("y", String(finalY))
        }
        if (liveText) {
          liveText.setAttribute("x", String(finalX))
          liveText.setAttribute("y", String(finalY))
          const r = textOverlayRect(liveText)
          const ov = svgEl.querySelector("#overlay_" + drag.id)
          if (ov) {
            ;(ov as SVGRectElement).setAttribute("x", String(r.rx))
            ;(ov as SVGRectElement).setAttribute("y", String(r.ry))
            ;(ov as SVGRectElement).setAttribute("width", String(r.rw))
            ;(ov as SVGRectElement).setAttribute("height", String(r.rh))
          }
        }
        // Do not bump previewVersion during drag — we already update live DOM above; bumping would re-run the effect and rebuild the whole SVG every frame (jank)
      }
    }

    const onMouseUp = () => {
      if (!drag) return
      const wasDrag = drag.moved
      const type = drag.type
      const tid = drag.id
      ;(drag.overlay as HTMLElement).style.cursor = "grab"
      if (type === "txt") hideGuides(svgEl)
      drag = null
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
      const scale = 2
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
          <span className="text-xs text-muted-foreground">{template.name}</span>
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
                                const v = e.target.value
                                const docEl = svgDocRef.current?.querySelector(idSelector(id))
                                if (docEl) docEl.textContent = v
                                setTextValues((prev) => ({ ...prev, [id]: v }))
                                setPreviewVersion((x) => x + 1)
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
                                const v = e.target.value
                                const docEl = svgDocRef.current?.querySelector(idSelector(id))
                                if (docEl) docEl.textContent = v
                                setTextValues((prev) => ({ ...prev, [id]: v }))
                                setPreviewVersion((x) => x + 1)
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
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const reader = new FileReader()
                                reader.onload = (re) => {
                                  const b64 = (re.target?.result as string) || ""
                                  const img = new Image()
                                  img.onload = () => {
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
                                  }
                                  img.src = b64
                                }
                                reader.readAsDataURL(file)
                              }}
                            />
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                              onClick={() => fileInputRefs.current[zone.id]?.click()}
                            >
                              <span className="text-sm">+</span>
                              <span>{hasImage ? (fileInputRefs.current[zone.id]?.files?.[0]?.name?.slice(0, 20) || "Image") : "Choose image"}</span>
                            </button>
                            {hasImage && (
                              <>
                                <button
                                  type="button"
                                  className="mt-1 w-full rounded-md border border-border py-1 px-2.5 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => {
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
                                      const scale = Number(e.target.value) / 100
                                      setZoneStates((prev) => ({
                                        ...prev,
                                        [zone.id]: { ...prev[zone.id], scale },
                                      }))
                                      setPreviewVersion((v) => v + 1)
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
