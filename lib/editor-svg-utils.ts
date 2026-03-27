/**
 * Utilities for SVG field editor: size, text metrics, clip bounds, snap guides.
 */

export function getSVGElementSize(svgEl: SVGElement): { w: number; h: number } {
  let w = parseFloat(svgEl.getAttribute("width") || "0")
  let h = parseFloat(svgEl.getAttribute("height") || "0")

  if (!w || !h) {
    const vb = (svgEl.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
    w = vb[2] || 800
    h = vb[3] || 600
  }

  return { w: w || 800, h: h || 600 }
}

export function getSVGSize(doc: Document): { w: number; h: number } {
  const root = doc.documentElement
  let w = parseFloat(root.getAttribute("width") || "0")
  let h = parseFloat(root.getAttribute("height") || "0")
  console.log("w", w, "h", h);
  if (!w || !h) {
    const vb = (root.getAttribute("viewBox") || "0 0 800 600").split(/[\s,]+/).map(Number)
    w = vb[2] || 800
    h = vb[3] || 600
  }
  return { w: w || 800, h: h || 600 }
}


export function getTextMetrics(
  txt: string,
  fontSize: number,
  fontWeight?: string,
  fontFamily?: string
): { width: number; ascent: number; descent: number } {
  if (typeof document === "undefined") return { width: 0, ascent: fontSize * 0.8, descent: fontSize * 0.2 }
  const c = document.createElement("canvas")
  const ctx = c.getContext("2d")
  if (!ctx) return { width: 0, ascent: fontSize * 0.8, descent: fontSize * 0.2 }
  ctx.font = `${fontWeight || "normal"} ${fontSize}px ${fontFamily || "sans-serif"}`
  const m = ctx.measureText(txt || "")
  return {
    width: m.width,
    ascent: m.actualBoundingBoxAscent ?? fontSize * 0.8,
    descent: m.actualBoundingBoxDescent ?? fontSize * 0.2,
  }
}

export function textOverlayRect(tel: SVGElement): {
  rx: number
  ry: number
  rw: number
  rh: number
  tx: number
  ty: number
  fs: number
  fw: string
  ff: string
  anchor: string
  width: number
  ascent: number
  descent: number
} {
  const tx = parseFloat(tel.getAttribute("x") || "0")
  const ty = parseFloat(tel.getAttribute("y") || "0")
  const fsAttr = tel.getAttribute("font-size") || (tel as unknown as HTMLElement).style?.fontSize || "16"
  const fs = parseFloat(fsAttr)
  const fw = tel.getAttribute("font-weight") || "normal"
  const ff = tel.getAttribute("font-family") || "sans-serif"
  const anchor = tel.getAttribute("text-anchor") || "start"
  const txt = tel.textContent || ""
  const { width, ascent, descent } = getTextMetrics(txt || "W", fs, fw, ff)
  const PAD = fs * 0.08
  let rx: number
  let ry: number
  let rw: number
  let rh: number

  // Prefer real rendered bounds when available (handles multiline <tspan> and nested styling)
  try {
    const bb = (tel as unknown as SVGGraphicsElement).getBBox?.()
    if (bb && bb.width > 0 && bb.height > 0) {
      rx = bb.x - PAD
      ry = bb.y - PAD
      rw = bb.width + PAD * 2
      rh = bb.height + PAD * 2
    } else {
      throw new Error("empty bbox")
    }
  } catch {
    if (anchor === "middle") rx = tx - width / 2 - PAD
    else if (anchor === "end") rx = tx - width - PAD
    else rx = tx - PAD
    ry = ty - ascent - PAD
    rw = width + PAD * 2
    rh = ascent + descent + PAD * 2
  }
  return { rx, ry, rw, rh, tx, ty, fs, fw, ff, anchor, width, ascent, descent }
}

export function getClipBounds(doc: Document, clipAttr: string | null): { x: number; y: number; w: number; h: number } | null {
  if (!clipAttr || !clipAttr.includes("url(#")) return null
  const id = clipAttr.replace("url(#", "").replace(")", "").trim()
  const clipEl = doc.getElementById(id)
  if (!clipEl) return null
  const rect = clipEl.querySelector("rect")
  if (rect)
    return {
      x: parseFloat(rect.getAttribute("x") || "0"),
      y: parseFloat(rect.getAttribute("y") || "0"),
      w: parseFloat(rect.getAttribute("width") || "100"),
      h: parseFloat(rect.getAttribute("height") || "100"),
    }
  return null
}

// Snap threshold: how close (in SVG units) before snapping engages
const SNAP = 6

export function hideGuides(svgEl: SVGElement) {
  ;["guide-cx", "guide-cy", "guide-left", "guide-right", "guide-top", "guide-bottom"].forEach((id) => {
    const el = svgEl.querySelector("#" + id)
    if (el) (el as HTMLElement).style.display = "none"
  })
}

export function createGuideLine(svgEl: SVGElement, id: string, x1: number, y1: number, x2: number, y2: number) {
  const ns = "http://www.w3.org/2000/svg"
  let l = svgEl.querySelector("#" + id) as SVGLineElement | null
  if (!l) {
    l = document.createElementNS(ns, "line")
    l.setAttribute("id", id)
    svgEl.appendChild(l)
  }
  l.setAttribute("x1", String(x1))
  l.setAttribute("y1", String(y1))
  l.setAttribute("x2", String(x2))
  l.setAttribute("y2", String(y2))
  l.setAttribute("stroke", "#378ADD")
  l.setAttribute("stroke-width", "0.6")
  l.setAttribute("stroke-dasharray", "4 3")
  l.setAttribute("pointer-events", "none")
  l.style.display = "block"
}

export interface SnapResult {
  nx: number
  ny: number
  guides: ("cx" | "cy" | "left" | "right" | "top" | "bottom")[]
  frameX: number
  frameY: number
  frameW: number
  frameH: number
  guideVx: number | null
  guideHy: number | null
}

export interface SnapPeerBox {
  id: string
  x: number
  y: number
  w: number
  h: number
}

/**
 * Apply snap logic for text dragging.
 *
 * Coordinate convention (must match onMouseMove):
 *   cx = horizontal CENTER of the text bounding box (SVG units)
 *   cy = TOP of the text bounding box (SVG units)  ← ty - ascent
 *
 * lockedGuides: set of guide keys that were snapped on the previous frame.
 * Using a larger SNAP_OUT vs SNAP_IN prevents oscillation/flicker at edges.
 */
export function applySnap(
  svgEl: SVGElement,
  cx: number,
  cy: number,
  txtW: number,
  txtH: number,
  peerBoxes: SnapPeerBox[] = []
): SnapResult {
  // Use the SVG viewport size as the snapping frame.
  const { w: frameW, h: frameH } = getSVGElementSize(svgEl)
  const frameX = 0
  const frameY = 0

  let nx = cx
  let ny = cy
  const guides: SnapResult["guides"] = []
  let guideVx: number | null = null
  let guideHy: number | null = null

  type HorizontalCandidate = { key: "left" | "right" | "cx"; target: number; guideX: number }
  type VerticalCandidate = { key: "top" | "bottom" | "cy"; target: number; guideY: number }
  type BestHorizontal = HorizontalCandidate & { diff: number }
  type BestVertical = VerticalCandidate & { diff: number }

  const hCandidates: HorizontalCandidate[] = [
    { key: "cx", target: frameX + frameW / 2, guideX: frameX + frameW / 2 },
    { key: "left", target: frameX + txtW / 2, guideX: frameX },
    { key: "right", target: frameX + frameW - txtW / 2, guideX: frameX + frameW },
  ]

  const vCandidates: VerticalCandidate[] = [
    { key: "cy", target: frameY + frameH / 2 - txtH / 2, guideY: frameY + frameH / 2 },
    { key: "top", target: frameY, guideY: frameY },
    { key: "bottom", target: frameY + frameH - txtH, guideY: frameY + frameH },
  ]

  peerBoxes.forEach((p) => {
    const left = p.x
    const right = p.x + p.w
    const cxPeer = p.x + p.w / 2
    const top = p.y
    const bottom = p.y + p.h
    const cyPeer = p.y + p.h / 2
    hCandidates.push(
      { key: "left", target: left + txtW / 2, guideX: left },
      { key: "right", target: right - txtW / 2, guideX: right },
      { key: "cx", target: cxPeer, guideX: cxPeer }
    )
    vCandidates.push(
      { key: "top", target: top, guideY: top },
      { key: "bottom", target: bottom - txtH, guideY: bottom },
      { key: "cy", target: cyPeer - txtH / 2, guideY: cyPeer }
    )
  })

  const bestHSeed: BestHorizontal = {
    key: hCandidates[0].key,
    target: hCandidates[0].target,
    diff: Math.abs(cx - hCandidates[0].target),
    guideX: hCandidates[0].guideX,
  }
  const bestH = hCandidates.reduce<BestHorizontal>((best, c) => {
    const diff = Math.abs(cx - c.target)
    return diff < best.diff ? { key: c.key, target: c.target, diff, guideX: c.guideX } : best
  }, bestHSeed)
  if (bestH.diff < SNAP) {
    nx = bestH.target
    guides.push(bestH.key)
    guideVx = bestH.guideX
  }

  const bestVSeed: BestVertical = {
    key: vCandidates[0].key,
    target: vCandidates[0].target,
    diff: Math.abs(cy - vCandidates[0].target),
    guideY: vCandidates[0].guideY,
  }
  const bestV = vCandidates.reduce<BestVertical>((best, c) => {
    const diff = Math.abs(cy - c.target)
    return diff < best.diff ? { key: c.key, target: c.target, diff, guideY: c.guideY } : best
  }, bestVSeed)
  if (bestV.diff < SNAP) {
    ny = bestV.target
    guides.push(bestV.key)
    guideHy = bestV.guideY
  }

  return {
    nx,
    ny,
    guides,
    frameX,
    frameY,
    frameW,
    frameH,
    guideVx,
    guideHy,
  }
}