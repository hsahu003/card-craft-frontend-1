"use client"

import { useState, use } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Eye,
  ShoppingCart,
  RotateCcw,
} from "lucide-react"

const templates: Record<string, { name: string; colors: [string, string]; emoji: string; category: string; price: number }> = {
  "1": { name: "Birthday Celebration", colors: ["#FDE68A", "#F59E0B"], emoji: "🎂", category: "Birthday", price: 99 },
  "2": { name: "Wedding Elegance", colors: ["#FDF2F8", "#EC4899"], emoji: "💒", category: "Wedding", price: 149 },
  "3": { name: "Thank You Blooms", colors: ["#DCFCE7", "#22C55E"], emoji: "💐", category: "Thank You", price: 79 },
  "4": { name: "Holiday Cheer", colors: ["#FEE2E2", "#EF4444"], emoji: "🎄", category: "Holiday", price: 99 },
  "5": { name: "Corporate Thanks", colors: ["#DBEAFE", "#3B82F6"], emoji: "🤝", category: "Corporate", price: 129 },
  "6": { name: "Baby Shower", colors: ["#E0E7FF", "#6366F1"], emoji: "👶", category: "Birthday", price: 89 },
}

const fonts = [
  "Inter",
  "Georgia",
  "Times New Roman",
  "Arial",
  "Verdana",
  "Comic Sans MS",
]

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const template = templates[resolvedParams.id] || templates["1"]

  const [message, setMessage] = useState("Your Message Here")
  const [recipientName, setRecipientName] = useState("Recipient Name")
  const [fontFamily, setFontFamily] = useState("Inter")
  const [fontSize, setFontSize] = useState("24")
  const [textColor, setTextColor] = useState("#1a1a2e")
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [history, setHistory] = useState<string[]>([message])
  const [historyIndex, setHistoryIndex] = useState(0)

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage)
    const newHistory = [...history.slice(0, historyIndex + 1), newMessage]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setMessage(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setMessage(history[historyIndex + 1])
    }
  }

  const handleReset = () => {
    setMessage("Your Message Here")
    setRecipientName("Recipient Name")
    setFontFamily("Inter")
    setFontSize("24")
    setTextColor("#1a1a2e")
    setAlignment("center")
    setIsBold(false)
    setIsItalic(false)
    setIsUnderline(false)
    setHistory(["Your Message Here"])
    setHistoryIndex(0)
  }

  const textStyle = {
    fontFamily,
    fontSize: `${fontSize}px`,
    color: textColor,
    textAlign: alignment,
    fontWeight: isBold ? "bold" : "normal",
    fontStyle: isItalic ? "italic" : "normal",
    textDecoration: isUnderline ? "underline" : "none",
  } as React.CSSProperties

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{template.name}</h1>
              <p className="text-sm text-muted-foreground">Customize your card</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex === 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor Layout */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left Panel - Card Preview */}
            <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8">
              <div
                className="relative flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${template.colors[0]} 0%, ${template.colors[1]} 100%)`,
                }}
              >
                {/* Emoji Decoration */}
                <div className="mb-6 text-7xl">{template.emoji}</div>

                {/* Message Zone */}
                <div
                  className="mx-8 w-full max-w-xs cursor-text rounded-lg border-2 border-dashed border-foreground/30 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:border-primary"
                >
                  <p
                    className="min-h-[60px] w-full break-words"
                    style={textStyle}
                  >
                    {message}
                  </p>
                </div>

                {/* Recipient Name Zone */}
                <div
                  className="mx-8 mt-4 w-full max-w-xs cursor-text rounded-lg border-2 border-dashed border-foreground/30 bg-card/80 p-3 backdrop-blur-sm transition-colors hover:border-primary"
                >
                  <p
                    className="text-center text-lg font-medium"
                    style={{ fontFamily, color: textColor }}
                  >
                    {recipientName}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel - Editor Controls */}
            <div className="space-y-6 rounded-xl border border-border bg-card p-6">
              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <textarea
                  id="message"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                />
              </div>

              {/* Recipient Name */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Name</Label>
                <Input
                  id="recipient"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              {/* Text Controls */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Text Controls</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fonts.map((font) => (
                          <SelectItem key={font} value={font}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      min="12"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                    />
                  </div>
                </div>

                {/* Style Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isBold ? "default" : "outline"}
                    size="icon"
                    onClick={() => setIsBold(!isBold)}
                    className={isBold ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isItalic ? "default" : "outline"}
                    size="icon"
                    onClick={() => setIsItalic(!isItalic)}
                    className={isItalic ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isUnderline ? "default" : "outline"}
                    size="icon"
                    onClick={() => setIsUnderline(!isUnderline)}
                    className={isUnderline ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                  <div className="mx-2 h-6 w-px bg-border" />
                  <Button
                    variant={alignment === "left" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setAlignment("left")}
                    className={alignment === "left" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={alignment === "center" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setAlignment("center")}
                    className={alignment === "center" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={alignment === "right" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setAlignment("right")}
                    className={alignment === "right" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border border-input"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Image Upload</h3>
                <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input p-6 transition-colors hover:border-primary">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Upload Your Photo</p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop or click to browse
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Card
                </Button>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart - ₹{template.price}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
