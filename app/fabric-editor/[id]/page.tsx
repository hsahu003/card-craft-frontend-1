"use client"

import { use, useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/contexts/cart-context"
import { allTemplates, getTemplateById } from "@/lib/templates"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

const EDITABLE_PREFIX = "editable_"
const IMAGE_ZONE_PREFIX = "image_zone_"

type FabricCanvas = any
type FabricObject = any

interface TextField {
  id: string
  label: string
}

interface ImageZone {
  id: string
  label: string
}

interface ImageState {
  b64: string
  scale: number
}

export default function FabricEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { add: addToCart } = useCart()
  const template = getTemplateById(resolvedParams.id) ?? allTemplates[0]

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricCanvasRef = useRef<FabricCanvas | null>(null)
  const textMapRef = useRef<Record<string, FabricObject>>({})
  const imageMapRef = useRef<Record<string, FabricObject>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [textFields, setTextFields] = useState<TextField[]>([])
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const [imageZones, setImageZones] = useState<ImageZone[]>([])
  const [imageStates, setImageStates] = useState<Record<string, ImageState>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [svgLoaded, setSvgLoaded] = useState(false)

  // Initialize Fabric canvas and load SVG
  useEffect(() => {
    let disposed = false
    ;(async () => {
      if (!template.svg || !canvasRef.current) return
      try {
        const fabric = await import("fabric")
        if (disposed) return
        const canvasEl = canvasRef.current
        const fabricCanvas: FabricCanvas = new fabric.Canvas(canvasEl, {
          preserveObjectStacking: true,
          selection: false,
        })
        fabricCanvasRef.current = fabricCanvas

        const resp = await fetch(template.svg)
        const svgText = await resp.text()

        const result = await fabric.loadSVGFromString(svgText, (el: Element, obj: FabricObject) => {
          const id = el.getAttribute("id") || undefined
          if (id) {
            // attach id so we can find by id later
            obj.set("customId", id)
          }
        })

        const objects: FabricObject[] = (result.objects || []) as FabricObject[]
        if (objects.length === 0) return

        // Add all objects to canvas
        objects.forEach((obj) => {
          fabricCanvas.add(obj)
        })
        fabricCanvas.renderAll()

        // Build maps for editable text and image zones
        const textFieldsLocal: TextField[] = []
        const textValuesLocal: Record<string, string> = {}
        const imageZonesLocal: ImageZone[] = []
        const imageStatesLocal: Record<string, ImageState> = {}

        const texts: Record<string, FabricObject> = {}
        const images: Record<string, FabricObject> = {}

        fabricCanvas.getObjects().forEach((obj: FabricObject) => {
          const customId: string | undefined = obj.get?.("customId")
          if (!customId) return
          if (customId.startsWith(EDITABLE_PREFIX)) {
            const label = customId.replace(EDITABLE_PREFIX, "").replace(/_/g, " ")
            textFieldsLocal.push({ id: customId, label })
            textValuesLocal[customId] = (obj.text as string) ?? ""
            texts[customId] = obj
          }
          if (customId.startsWith(IMAGE_ZONE_PREFIX)) {
            const label = customId.replace(IMAGE_ZONE_PREFIX, "").replace(/_/g, " ")
            imageZonesLocal.push({ id: customId, label })
            imageStatesLocal[customId] = { b64: "", scale: 1 }
            images[customId] = obj
          }
        })

        textMapRef.current = texts
        imageMapRef.current = images
        setTextFields(textFieldsLocal)
        setTextValues(textValuesLocal)
        setImageZones(imageZonesLocal)
        setImageStates(imageStatesLocal)
        setSvgLoaded(true)

        // Enable dragging of text and image objects
        fabricCanvas.on("object:moving", (e: any) => {
          const target: FabricObject | undefined = e.target
          if (!target) return
          const id = target.get?.("customId")
          if (!id) return
          // keep in sync with state for text inputs
          if (id.startsWith(EDITABLE_PREFIX)) {
            setTextValues((prev) => ({
              ...prev,
              [id]: target.text as string,
            }))
          }
        })
      } catch (err) {
        console.error(err)
        setSvgLoaded(false)
      }
    })()

    return () => {
      disposed = true
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [template.svg])

  const handleTextChange = useCallback((id: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [id]: value }))
    const obj = textMapRef.current[id]
    if (obj) {
      obj.set?.("text", value)
      fabricCanvasRef.current?.renderAll()
    }
  }, [])

  const handleImageFile = useCallback((zoneId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (re) => {
      const b64 = (re.target?.result as string) || ""
      setImageStates((prev) => ({
        ...prev,
        [zoneId]: { b64, scale: 1 },
      }))
      ;(async () => {
        const fabric = await import("fabric")
        const canvas = fabricCanvasRef.current
        const zoneObj = imageMapRef.current[zoneId]
        if (!canvas || !zoneObj) return

        // Remove any existing image grouped with this zone by name
        const existing = canvas.getObjects().filter((o: any) => o.get?.("customImageFor") === zoneId)
        existing.forEach((o: any) => canvas.remove(o))

        fabric.FabricImage.fromURL(b64, { crossOrigin: "anonymous" }).then((img: any) => {
          img.set({
            customImageFor: zoneId,
            left: zoneObj.left,
            top: zoneObj.top,
            originX: "center",
            originY: "center",
          })
          // basic fit into zone object bounding box
          const bounds = zoneObj.getBoundingRect()
          const scaleX = bounds.width / img.width
          const scaleY = bounds.height / img.height
          const scale = Math.max(scaleX, scaleY)
          img.scale(scale)
          canvas.add(img)
          canvas.renderAll()
        })
      })()
    }
    reader.readAsDataURL(file)
  }, [])

  const handleImageRemove = useCallback((zoneId: string) => {
    setImageStates((prev) => ({
      ...prev,
      [zoneId]: { b64: "", scale: 1 },
    }))
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const existing = canvas.getObjects().filter((o: any) => o.get?.("customImageFor") === zoneId)
    existing.forEach((o: any) => canvas.remove(o))
    canvas.renderAll()
    toast.success("Image removed")
  }, [])

  const handleZoomChange = useCallback((zoneId: string, nextScale: number) => {
    setImageStates((prev) => ({
      ...prev,
      [zoneId]: { ...(prev[zoneId] || { b64: "" }), scale: nextScale },
    }))
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const imgs = canvas.getObjects().filter((o: any) => o.get?.("customImageFor") === zoneId)
    imgs.forEach((img: any) => {
      img.scale(nextScale)
    })
    canvas.renderAll()
  }, [])

  const handleExportPDF = useCallback(async () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    setIsExporting(true)
    try {
      const { jsPDF } = await import("jspdf")
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 })
      const width = canvas.getWidth()
      const height = canvas.getHeight()
      const pxToMm = (px: number) => (px * 25.4) / 96
      const pw = pxToMm(width)
      const ph = pxToMm(height)
      const pdf = new jsPDF({
        orientation: pw > ph ? "landscape" : "portrait",
        unit: "mm",
        format: [pw, ph],
      })
      pdf.addImage(dataUrl, "PNG", 0, 0, pw, ph)
      const filename = (template.name.replace(/[^a-z0-9]/gi, "_") || "export") + "_fabric.pdf"
      pdf.save(filename)
      toast.success("PDF exported successfully")
    } catch (e) {
      console.error(e)
      toast.error("Export failed")
    } finally {
      setIsExporting(false)
    }
  }, [template.name])

  const handleAddToCart = useCallback(() => {
    const canvas = fabricCanvasRef.current
    let customMessage = ""
    if (canvas) {
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 })
      customMessage = dataUrl
    }
    const cartId = resolvedParams.id + "-fabric-" + Date.now()
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
          <h1 className="text-[15px] font-medium text-foreground">Fabric SVG Editor</h1>
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
                      <p className="mb-2 text-[11px] text-muted-foreground">Click to edit on canvas • Drag to move</p>
                      {textFields.map(({ id, label }) => (
                        <div key={id} className="mb-2.5">
                          <div className="mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                            {label}
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              text
                            </span>
                          </div>
                          <Input
                            className="rounded-md border-border px-2.5 py-1.5 text-[13px]"
                            value={textValues[id] ?? ""}
                            onChange={(e) => handleTextChange(id, e.target.value)}
                          />
                        </div>
                      ))}
                    </>
                  )}

                  {imageZones.length > 0 && (
                    <>
                      <p className="mb-1 mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Image zones</p>
                      {imageZones.map((zone) => {
                        const st = imageStates[zone.id]
                        const hasImage = !!st?.b64
                        return (
                          <div key={zone.id} className="mb-2.5">
                            <div className="mb-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">
                              {zone.label}
                              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                image
                              </span>
                            </div>
                            <input
                              ref={(el) => {
                                fileInputRefs.current[zone.id] = el
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                handleImageFile(zone.id, file)
                              }}
                            />
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                              onClick={() => fileInputRefs.current[zone.id]?.click()}
                            >
                              <span className="text-sm">+</span>
                              <span>{hasImage ? "Change image" : "Choose image"}</span>
                            </button>
                            {hasImage && (
                              <>
                                <button
                                  type="button"
                                  className="mt-1 w-full rounded-md border border-border py-1 px-2.5 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => handleImageRemove(zone.id)}
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
                                      handleZoomChange(zone.id, scale)
                                    }}
                                    className="h-0.5 flex-1"
                                  />
                                  <span className="min-w-8 text-right text-[11px] text-foreground">
                                    {Math.round((st.scale || 1) * 100)}%
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">Drag image on canvas to reposition</p>
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
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart – ₹{template.price}
              </Button>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Live Preview (Fabric)</span>
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
            <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-5">
              {!svgLoaded ? (
                <div className="flex flex-col items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="text-[32px] opacity-20">◇</span>
                  <span>Preview appears here</span>
                </div>
              ) : (
                <canvas ref={canvasRef} className="max-h-full max-w-full rounded-md bg-white shadow-sm" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

