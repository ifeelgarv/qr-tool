"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Download,
  Loader2,
  ZoomIn,
  RotateCcw,
  QrCode,
  ZoomOut
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, AnimatePresence } from "framer-motion"
import QRCode from "qrcode"

const QR_STYLES = {
  "slate-ember": {
    name: "Slate Ember",
    background: "#000000",
    foreground: "#e2e8f0",
    cornerColor: "#f97316",
    dotStyle: "dots",
  },
}

const TOOLS = [
  {
    id: "design-qr-codes",
    title: "Design QR codes",
    description: "Create clean, scannable QR codes with curated style presets. Export as SVG or PNG.",
    icon: QrCode,
    tags: ["qr", "svg"],
    active: false,
    new: true,
  },
]

const SHORTCUTS = [
  { key: "Home", shortcut: "Shift+H", action: () => console.log("Home") },
  { key: "Works", shortcut: "Shift+W", action: () => console.log("Works") },
  { key: "Notes", shortcut: "Shift+N", action: () => console.log("Notes") },
  { key: "Tools", shortcut: "Shift+T", action: () => console.log("Tools") },
]

export default function QRGenerator() {
  const [content, setContent] = useState("https://x.com/ifeel_garv")
  const [selectedStyle, setSelectedStyle] = useState("slate-ember")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [showTools, setShowTools] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "h":
            e.preventDefault()
            setShowTools(false)
            SHORTCUTS[0].action()
            break
          case "w":
            e.preventDefault()
            SHORTCUTS[1].action()
            break
          case "n":
            e.preventDefault()
            SHORTCUTS[2].action()
            break
          case "t":
            e.preventDefault()
            setShowTools(true)
            SHORTCUTS[3].action()
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const generateQR = async () => {
    if (!content.trim()) {
      setError("Please enter content to generate QR code")
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      const style = QR_STYLES[selectedStyle as keyof typeof QR_STYLES]

      const qrData = await QRCode.toDataURL(content, {
        width: 400,
        margin: 2,
        color: {
          dark: style.foreground,
          light: style.background,
        },
        errorCorrectionLevel: "M",
      })

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 400
      canvas.height = 400

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.fillStyle = style.background
        ctx.fillRect(0, 0, 400, 400)

        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        tempCanvas.width = 400
        tempCanvas.height = 400

        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0, 400, 400)
          const data = tempCtx.getImageData(0, 0, 400, 400)

          for (let y = 0; y < 400; y += 4) {
            for (let x = 0; x < 400; x += 4) {
              const index = (y * 400 + x) * 4
              const isDark = data.data[index] < 128

              if (isDark) {
                const isTopLeftCorner = x >= 24 && x <= 96 && y >= 24 && y <= 96
                const isTopRightCorner = x >= 304 && x <= 376 && y >= 24 && y <= 96
                const isBottomLeftCorner = x >= 24 && x <= 96 && y >= 304 && y <= 376

                if (isTopLeftCorner || isTopRightCorner || isBottomLeftCorner) {
                  ctx.fillStyle = style.cornerColor
                  ctx.fillRect(x, y, 4, 4)
                } else {
                  ctx.fillStyle = style.foreground
                  ctx.beginPath()
                  ctx.arc(x + 2, y + 2, 1.8, 0, Math.PI * 2)
                  ctx.fill()
                }
              }
            }
          }
        }

        setQrDataUrl(canvas.toDataURL("image/png", 1.0))
        setIsGenerating(false)
      }

      img.onerror = () => {
        setError("Failed to generate QR code")
        setIsGenerating(false)
      }

      img.src = qrData
    } catch (error) {
      console.error("Error generating QR code:", error)
      setError("Failed to generate QR code")
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    generateQR()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, selectedStyle])

  const downloadSVG = async () => {
    if (!content.trim()) {
      setError("Please enter content to export")
      return
    }

    try {
      const style = QR_STYLES[selectedStyle as keyof typeof QR_STYLES]
      const svgString = await QRCode.toString(content, {
        type: "svg",
        width: 400,
        margin: 2,
        color: {
          dark: style.foreground,
          light: style.background,
        },
        errorCorrectionLevel: "M",
      })

      const blob = new Blob([svgString], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qrcode-${selectedStyle}.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading SVG:", error)
      setError("Failed to export SVG")
    }
  }

  const downloadPNG = () => {
    if (!qrDataUrl) {
      setError("No QR code to export")
      return
    }

    try {
      const a = document.createElement("a")
      a.href = qrDataUrl
      a.download = `qrcode-${selectedStyle}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading PNG:", error)
      setError("Failed to export PNG")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="fixed left-4 bottom-4 z-10 md:block hidden">
        <div className="flex flex-col gap-4">
          {SHORTCUTS.map((shortcut, index) => (
            <motion.div
              key={shortcut.key}
              className="relative group"
              initial={{ opacity: 0, x: -50, rotateY: -90 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{
                delay: index * 0.15,
                duration: 0.8,
                type: "spring",
                stiffness: 100,
                damping: 12
              }}
            >

              {/* Main button */}
              <motion.button
                onClick={() => {
                  if (shortcut.key === "Tools") setShowTools(true)
                  else if (shortcut.key === "Home") setShowTools(false)
                  shortcut.action()
                }}
                className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:text-primary transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center gap-2 group-hover:bg-card/90 group-hover:border-primary/30 min-w-[80px]"
                whileHover={{
                  scale: 1.04,
                  x: 6,
                  transition: { type: "spring", delay: 0, duration: 0 }
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { type: "spring", delay: 0, duration: 0 }
                }}
                onHoverStart={() => {
                  // Add hover sound effect will change later as it is AI generated code
                  try {
                    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
                    const oscillator = audioContext.createOscillator()
                    const gainNode = audioContext.createGain()

                    oscillator.connect(gainNode)
                    gainNode.connect(audioContext.destination)

                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
                    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1)

                    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
                    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.01)
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

                    oscillator.start(audioContext.currentTime)
                    oscillator.stop(audioContext.currentTime + 0.1)
                  } catch (error: unknown) {
                    console.error("AudioContext error on hover:", error);
                  }
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 text-xs">
                    {shortcut.key}
                  </span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary/70 transition-colors duration-200 font-mono">
                    {shortcut.shortcut}
                  </span>
                </div>
                {/* Hover arrow effect */}
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.03 }}
                >
                  <motion.div
                    className="w-3 h-3 text-primary text-xs"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    →
                  </motion.div>
                </motion.div>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="fixed right-4 bottom-4 z-10">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <motion.button
            className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:glow-sm rounded-lg bg-card/50 backdrop-blur-sm hidden sm:block"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ZoomIn className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:glow-sm rounded-lg bg-card/50 backdrop-blur-sm hidden sm:block"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ZoomOut className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:glow-sm rounded-lg bg-card/50 backdrop-blur-sm"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setContent("https://x.com/ifeel_garv")
              setSelectedStyle("slate-ember")
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
          <motion.div className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:glow-sm rounded-lg bg-card/50 backdrop-blur-sm"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ThemeToggle />
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {showTools ? (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-3xl font-semibold text-left">Tools</h1>
                <p className="text-muted-foreground text-left text-lg mt-2">
                  Privacy-first tools, built to run entirely in your browser
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {TOOLS.map((tool) => {
                  const IconComponent = tool.icon
                  return (
                    <motion.div
                      key={tool.id}
                      className="bg-muted/30 hover:bg-muted/50 group relative flex min-h-32 sm:min-h-40 flex-col rounded-xl border border-muted-foreground/30 p-4 sm:p-5 transition-all hover:shadow-md"
                      onClick={() => {
                        if (tool.id === "design-qr-codes") {
                          setShowTools(false)
                        }
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                          <IconComponent className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mr-2">
                              {tool.title}
                            </h3>
                            {tool.new && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-600 text-xs font-normal rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">{tool.description}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {tool.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-muted/50 text-muted-foreground text-xs rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="max-w-2xl mx-auto"
              key="qr-generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-center mb-6 sm:mb-8"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.h1
                  className="text-3xl font-semibold text-left"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  Design QR codes
                </motion.h1>
                <motion.p
                  className="text-muted-foreground text-xs sm:text-sm mt-2 text-left sm:text-base whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Pick a style preset and export as SVG or PNG
                </motion.p>
              </motion.div>

              <div className="max-w-2xl mx-auto">
                <div className="border border-border border-muted-foreground/30 rounded-2xl p-4 shadow-xl">
                  <h2 className="text-sm font-medium text-left">Preview</h2>
                  <motion.div
                    className="flex items-center justify-center min-h-[400px] relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <AnimatePresence mode="wait">
                      {isGenerating ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 text-muted-foreground relative z-10"
                        >
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-lg">Generating QR code...</span>
                        </motion.div>
                      ) : qrDataUrl ? (
                        <motion.img
                          key="qr-code"
                          src={qrDataUrl}
                          alt="Generated QR Code"
                          className="w-[300px] h-[300px] object-contain relative z-10 rounded-lg shadow-2xl"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-muted-foreground text-lg relative z-10"
                        >
                          Enter content to generate QR code
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <div className="flex flex-wrap justify-start gap-2">
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="ghost"
                        onClick={downloadSVG}
                        className="flex items-center gap-2 px-5 py-2 text-sm hover:glow-md transition-all duration-200 rounded-lg border border-border dark:border-border border-[#d1d5db] dark:hover:border-border hover:border-[#b0b4ba]"
                        disabled={isGenerating || !qrDataUrl}
                      >
                        <Download className="w-4 h-4" />
                        SVG
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="ghost"
                        onClick={downloadPNG}
                        className="flex items-center gap-2 px-5 py-2 text-sm hover:glow-md transition-all duration-200 rounded-lg border border-border dark:border-border border-[#d1d5db] dark:hover:border-border hover:border-[#b0b4ba]"
                        disabled={isGenerating || !qrDataUrl}
                      >
                        <Download className="w-4 h-4" />
                        PNG
                      </Button>
                    </motion.div>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto mt-6 space-y-6 p-6 bg-card/30 border border-muted-foreground/30 rounded-2xl backdrop-blur-sm">
                  <div className="space-y-3">
                    <label className="text-sm font-medium mb-2 block">Content URL or Text</label>
                    <input
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value)
                        setError("")
                      }}
                      placeholder="Enter URL or text to encode"
                      className="bg-card/50 text-xs sm:text-sm px-2 sm:px-3 py-2 border border-border/50 rounded-md 
             focus:ring-2 focus:ring-primary/20 transition-all duration-200 w-full 
             backdrop-blur-sm placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-center"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
