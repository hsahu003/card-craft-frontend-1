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
export function applySnap(svgEl: SVGElement, cx: number, cy: number, txtW: number, txtH: number): SnapResult {
  // Use the SVG viewport size as the snapping frame.
  const { w: frameW, h: frameH } = getSVGElementSize(svgEl)
  const frameX = 0
  const frameY = 0

  let nx = cx
  let ny = cy
  const guides: SnapResult["guides"] = []

  // Horizontal center (vertical guide line through canvas center)
  const centerX = frameX + frameW / 2
  if (Math.abs(cx - centerX) < SNAP) {
    nx = centerX
    guides.push("cx")
  }

  // Vertical center (horizontal guide line through canvas center)
  // cy = top of text, so center of text = cy + txtH/2
  // We want text center to align with canvas center → cy target = centerY - txtH/2
  const centerY = frameY + frameH / 2
  if (Math.abs(cy - (centerY - txtH / 2)) < SNAP) {
    ny = centerY - txtH / 2
    guides.push("cy")
  }

  // Bug 2 fix: cy is TOP of text box (ty - ascent), so:
  //   left/right edges snap cx (text horizontal center) — unchanged
  //   top edge: cy should equal frameY (text top flush with canvas top)
  //   bottom edge: cy should equal frameY + frameH - txtH (text bottom flush with canvas bottom)

  // Left edge: text left side flush with canvas left → cx = frameX + txtW/2
  
  if (Math.abs(cx - (frameX + txtW / 2)) < SNAP) {
    nx = frameX + txtW / 2
    guides.push("left")
  }

  // Right edge: text right side flush with canvas right → cx = frameX + frameW - txtW/2
  const rightEdge = frameX + frameW - txtW / 2;
  const diffRight = Math.abs(cx - rightEdge);
  console.log("cx", cx, "diffRight", diffRight, "rightTarget", rightEdge);

  console.log("cx", cx, "cx + txtW", cx + txtW, "frameW", frameW)

  if (Math.abs(cx - (frameX + frameW - txtW / 2)) < SNAP) {
    nx = frameX + frameW - txtW / 2
    guides.push("right")
  }

  // Top edge: text top flush with canvas top → cy = frameY
  if (Math.abs(cy - frameY) < SNAP) {
    ny = frameY
    guides.push("top")
  }

  // Bottom edge: text bottom flush with canvas bottom → cy = frameY + frameH - txtH
  if (Math.abs(cy - (frameY + frameH - txtH)) < SNAP) {
    ny = frameY + frameH - txtH
    guides.push("bottom")
  }

  return {
    nx,
    ny,
    guides,
    frameX,
    frameY,
    frameW,
    frameH,
  }
}