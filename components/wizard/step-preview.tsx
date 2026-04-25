"use client"

import { useCallback, useEffect, useState, useRef, type Dispatch } from "react"
import type { WizardState, WizardAction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer"
import { 
  ArrowLeft, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Check,
  ImagePlus,
  Monitor,
  Tablet,
  Smartphone
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StepPreviewProps {
  state: WizardState
  dispatch: Dispatch<WizardAction>
  onBack: () => void
}

type ViewportSize = "desktop" | "tablet" | "mobile"

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; icon: typeof Monitor }> = {
  desktop: { width: "100%", icon: Monitor },
  tablet: { width: "768px", icon: Tablet },
  mobile: { width: "375px", icon: Smartphone },
}

export function StepPreview({ state, dispatch, onBack }: StepPreviewProps) {
  const { portfolio, github, resume, notion, config, photo } = state
  const [copied, setCopied] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [additionalImages, setAdditionalImages] = useState<{ id: string; dataUrl: string }[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generate = useCallback(async () => {
    if (!github.profile) return

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsStreaming(true)
    setStreamingContent("")
    dispatch({ type: "SET_PORTFOLIO_LOADING", loading: true })

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github: { profile: github.profile, repos: github.repos },
          resumeText: resume.text,
          notionContent: notion.content,
          config,
          photoDataUrl: photo.dataUrl,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) {
        let errorMsg = `Server error (${res.status})`
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {
          try {
            errorMsg = await res.text() || errorMsg
          } catch {
            // Use default error message
          }
        }
        console.log("[v0] Generate API error:", errorMsg)
        dispatch({ type: "SET_PORTFOLIO_ERROR", error: errorMsg })
        setIsStreaming(false)
        return
      }

      // Handle streaming response
      const reader = res.body?.getReader()
      if (!reader) {
        dispatch({ type: "SET_PORTFOLIO_ERROR", error: "No response body" })
        setIsStreaming(false)
        return
      }

      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setStreamingContent(fullContent)
      }

      // Clean up the HTML - strip any markdown fences
      let html = fullContent.trim()
      // Remove markdown code fences (```html ... ``` or ``` ... ```)
      html = html.replace(/^```(?:html)?\s*\n?/i, "")
      html = html.replace(/\n?```\s*$/i, "")
      html = html.trim()

      // Try to make it a valid HTML document
      if (!html.toLowerCase().includes("<!doctype") && !html.toLowerCase().includes("<html")) {
        if (html.includes("<head") || html.includes("<body") || html.includes("<div") || html.includes("<section")) {
          html = `<!DOCTYPE html>\n<html lang="en">\n${html}\n</html>`
        } else if (html.length < 100) {
          // Too short, probably an error message from the AI
          dispatch({ type: "SET_PORTFOLIO_ERROR", error: "AI returned an incomplete response. Please try again." })
          setIsStreaming(false)
          return
        }
        // Otherwise, still try to render it - it might have partial HTML
      }

      // Ensure viewport meta tag exists
      if (!html.includes("viewport")) {
        html = html.replace(
          "<head>",
          '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        )
      }

      const title = github.profile.name
        ? `${github.profile.name} - Portfolio`
        : `${github.profile.username} - Portfolio`

      dispatch({ type: "SET_PORTFOLIO", html, title })
      setIsStreaming(false)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return // Cancelled, don't show error
      }
      const message = err instanceof Error ? err.message : "Network error. Please try again."
      dispatch({ type: "SET_PORTFOLIO_ERROR", error: message })
      setIsStreaming(false)
    }
  }, [github, resume.text, notion.content, config, photo.dataUrl, dispatch])

  // Auto-generate on first load of this step
  useEffect(() => {
    if (!portfolio.html && !portfolio.loading && !portfolio.error && !isStreaming) {
      generate()
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 5 * 1024 * 1024) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const id = `img-${Date.now()}`
      setAdditionalImages(prev => [...prev, { id, dataUrl }])
    }
    reader.readAsDataURL(file)
  }, [])

  const copyHtml = useCallback(async () => {
    const htmlContent = portfolio.html || streamingContent
    if (!htmlContent) return
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = htmlContent
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [portfolio.html, streamingContent])

  const downloadHtml = useCallback(() => {
    const htmlContent = portfolio.html || streamingContent
    if (!htmlContent) return
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${portfolio.title || "portfolio"}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [portfolio.html, portfolio.title, streamingContent])

  const openInV0 = useCallback(async () => {
    const htmlContent = portfolio.html || streamingContent
    if (!htmlContent) return
    try {
      await navigator.clipboard.writeText(htmlContent)
    } catch {
      // Silently fail
    }
    window.open("https://v0.dev/chat", "_blank")
  }, [portfolio.html, streamingContent])

  const displayHtml = portfolio.html || (streamingContent.includes("<") ? streamingContent : null)
  const isGenerating = isStreaming || portfolio.loading

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-balance">Your Portfolio</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {isGenerating
              ? "AI is crafting your portfolio..."
              : displayHtml
                ? "Preview your generated portfolio and export it."
                : "Generate your AI-powered portfolio."}
          </p>
        </div>

        {/* Viewport toggle */}
        {displayHtml && !isGenerating && (
          <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
            {(Object.entries(VIEWPORT_SIZES) as [ViewportSize, typeof VIEWPORT_SIZES[ViewportSize]][]).map(([size, { icon: Icon }]) => (
              <button
                key={size}
                onClick={() => setViewport(size)}
                className={cn(
                  "p-2 rounded-md transition-all duration-200",
                  viewport === size
                    ? "bg-background shadow-sm text-[var(--persona-accent)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={size.charAt(0).toUpperCase() + size.slice(1)}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State with Streaming Preview */}
      {isGenerating && (
        <div className="animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-6 sm:py-8">
            <div className="relative shrink-0">
              <div className="size-12 sm:size-16 rounded-full border-2 border-[var(--persona-accent)]/20 flex items-center justify-center animate-pulse-glow">
                <Sparkles className="size-5 sm:size-7 text-[var(--persona-accent)] animate-pulse" />
              </div>
              <Spinner className="size-16 sm:size-20 text-[var(--persona-accent)] absolute -top-2 -left-2" />
            </div>
            <div className="text-center sm:text-left flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Generating your portfolio</p>
              <p className="text-xs text-muted-foreground">
                Streaming live from Gemini 2.5 Flash...
              </p>
              {/* Progress shimmer bar */}
              <div className="w-48 sm:w-64 h-1.5 rounded-full bg-muted/30 overflow-hidden mx-auto sm:mx-0">
                <div className="h-full w-full animate-shimmer rounded-full" />
              </div>
            </div>
          </div>

          {/* Live streaming preview */}
          {streamingContent.includes("<") && (
            <div className="mt-4 border border-border rounded-xl overflow-hidden bg-card">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                <span className="text-xs text-muted-foreground">Live Preview (streaming...)</span>
                <div className="flex gap-1">
                  <div className="size-2 rounded-full bg-red-400" />
                  <div className="size-2 rounded-full bg-yellow-400" />
                  <div className="size-2 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="h-[300px] sm:h-[400px] overflow-hidden">
                <PortfolioRenderer html={streamingContent} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {portfolio.error && !isGenerating && (
        <div className="flex flex-col items-center gap-4 py-8 sm:py-12 animate-fade-in-scale">
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
            <AlertCircle className="size-4 shrink-0" />
            <span>{portfolio.error}</span>
          </div>
          <Button
            onClick={generate}
            className="bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 gap-2 shadow-lg shadow-[var(--persona-accent)]/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Preview */}
      {displayHtml && !isGenerating && (
        <div className="animate-fade-in-up">
          {/* Browser chrome wrapper */}
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-lg">
            {/* Browser header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="size-2.5 sm:size-3 rounded-full bg-red-400" />
                <div className="size-2.5 sm:size-3 rounded-full bg-yellow-400" />
                <div className="size-2.5 sm:size-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-3 sm:mx-4">
                <div className="max-w-xs sm:max-w-md mx-auto px-3 py-1 bg-background rounded-md text-xs text-muted-foreground truncate">
                  {portfolio.title || "portfolio"}.html
                </div>
              </div>
              <div className="w-12 sm:w-16" />
            </div>
            
            {/* Portfolio iframe with responsive sizing */}
            <div 
              className="flex justify-center bg-secondary/20 p-2 sm:p-4 overflow-x-auto"
              style={{ minHeight: "400px" }}
            >
              <div 
                className="bg-white rounded-lg shadow-inner overflow-hidden transition-all duration-300"
                style={{ 
                  width: VIEWPORT_SIZES[viewport].width,
                  maxWidth: "100%",
                  height: viewport === "desktop" ? "600px" : viewport === "tablet" ? "500px" : "600px"
                }}
              >
                <PortfolioRenderer html={displayHtml} />
              </div>
            </div>
          </div>

          {/* Additional Images Upload */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-dashed border-border rounded-xl bg-secondary/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-sm font-medium text-foreground">Add More Images</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload images to use in your portfolio. Copy the data URL to embed.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                className="gap-2 shrink-0"
              >
                <ImagePlus className="size-4" />
                Upload Image
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            {additionalImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {additionalImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.dataUrl}
                      alt="Uploaded"
                      className="w-full aspect-square object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(img.dataUrl)
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <span className="text-xs text-white font-medium">Copy URL</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              onClick={copyHtml}
              variant="outline"
              size="sm"
              className="gap-2 border-[var(--persona-border)] hover:border-[var(--persona-accent)]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-green-500 animate-check-pop" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span className="hidden sm:inline">Copy HTML</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </Button>
            <Button
              onClick={downloadHtml}
              variant="outline"
              size="sm"
              className="gap-2 border-[var(--persona-border)] hover:border-[var(--persona-accent)]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Download .html</span>
              <span className="sm:hidden">Download</span>
            </Button>
            <Button
              onClick={openInV0}
              size="sm"
              className="gap-2 bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 shadow-lg shadow-[var(--persona-accent)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--persona-accent)]/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="size-4" />
              Open in v0
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: "CLEAR_PORTFOLIO" })
                setStreamingContent("")
                generate()
              }}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <RefreshCw className="size-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
    </div>
  )
}
