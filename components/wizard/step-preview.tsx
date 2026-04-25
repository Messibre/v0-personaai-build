"use client"

import { useCallback, useEffect, useState, useRef, type Dispatch } from "react"
import type { WizardState, WizardAction } from "@/lib/types"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StepPreviewProps {
  state: WizardState
  dispatch: Dispatch<WizardAction>
  onBack: () => void
}

export function StepPreview({ state, dispatch, onBack }: StepPreviewProps) {
  const { portfolio, github, resume, notion, config, photo } = state
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [additionalImages, setAdditionalImages] = useState<{ id: string; dataUrl: string }[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  const generate = useCallback(async () => {
    if (!github.profile) return

    setIsGenerating(true)
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
      })

      const data = await res.json()

      if (!res.ok) {
        dispatch({ type: "SET_PORTFOLIO_ERROR", error: data.error || `Server error (${res.status})` })
        setIsGenerating(false)
        return
      }

      if (!data.html || data.html.length < 100) {
        dispatch({ type: "SET_PORTFOLIO_ERROR", error: "Generated portfolio was too short. Please try again." })
        setIsGenerating(false)
        return
      }

      dispatch({ type: "SET_PORTFOLIO", html: data.html, title: data.title })
      setIsGenerating(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error. Please try again."
      dispatch({ type: "SET_PORTFOLIO_ERROR", error: message })
      setIsGenerating(false)
    }
  }, [github, resume.text, notion.content, config, photo.dataUrl, dispatch])

  // Auto-generate on first load
  useEffect(() => {
    if (!portfolio.html && !portfolio.loading && !portfolio.error && !isGenerating) {
      generate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setAdditionalImages((prev) => [...prev, { id: `img-${Date.now()}`, dataUrl }])
    }
    reader.readAsDataURL(file)
  }, [])

  const copyHtml = useCallback(async () => {
    if (!portfolio.html) return
    try {
      await navigator.clipboard.writeText(portfolio.html)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = portfolio.html
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [portfolio.html])

  const downloadHtml = useCallback(() => {
    if (!portfolio.html) return
    const blob = new Blob([portfolio.html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${portfolio.title || "portfolio"}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [portfolio.html, portfolio.title])

  const openInV0 = useCallback(async () => {
    if (!portfolio.html) return
    try {
      await navigator.clipboard.writeText(portfolio.html)
    } catch {
      /* silent */
    }
    window.open("https://v0.dev/chat", "_blank")
  }, [portfolio.html])

  const loading = isGenerating || portfolio.loading

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-balance">Your Portfolio</h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {loading
            ? "Building your portfolio..."
            : portfolio.html
              ? "Preview your portfolio below. Export it or regenerate with different settings."
              : "Click generate to build your portfolio."}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 animate-fade-in-up">
          <div className="relative">
            <div className="size-14 rounded-full border-2 border-[var(--persona-accent)]/20 flex items-center justify-center animate-pulse-glow">
              <Sparkles className="size-6 text-[var(--persona-accent)] animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Generating your portfolio</p>
            <p className="text-xs text-muted-foreground mt-1">This takes just a few seconds...</p>
          </div>
          <div className="w-48 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div className="h-full w-full animate-shimmer rounded-full" />
          </div>
        </div>
      )}

      {/* Error */}
      {portfolio.error && !loading && (
        <div className="flex flex-col items-center gap-4 py-12 animate-fade-in-scale">
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 max-w-md">
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

      {/* Portfolio Preview */}
      {portfolio.html && !loading && (
        <div className="animate-fade-in-up">
          <PortfolioRenderer html={portfolio.html} />

          {/* Image Upload */}
          <div className="mt-6 p-4 border border-dashed border-border rounded-xl bg-secondary/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-sm font-medium text-foreground">Upload Images</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add images to embed in your portfolio. Click to copy the data URL.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="gap-2 shrink-0">
                <ImagePlus className="size-4" />
                Upload
              </Button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            {additionalImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {additionalImages.map((img) => (
                  <div key={img.id} className="relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(img.dataUrl)}>
                    <img src={img.dataUrl} alt="Uploaded" className="w-full aspect-square object-cover rounded-lg border border-border" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <span className="text-xs text-white font-medium">Copy URL</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6">
            <Button
              onClick={copyHtml}
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 border-[var(--persona-border)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                copied && "border-green-500/30 text-green-500"
              )}
            >
              {copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> <span className="hidden sm:inline">Copy HTML</span><span className="sm:hidden">Copy</span></>}
            </Button>
            <Button onClick={downloadHtml} variant="outline" size="sm" className="gap-2 border-[var(--persona-border)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <Download className="size-4" />
              <span className="hidden sm:inline">Download .html</span><span className="sm:hidden">Download</span>
            </Button>
            <Button onClick={openInV0} size="sm" className="gap-2 bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 shadow-lg shadow-[var(--persona-accent)]/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <ExternalLink className="size-4" />
              Open in v0
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: "CLEAR_PORTFOLIO" })
                generate()
              }}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground ml-auto"
            >
              <RefreshCw className="size-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
    </div>
  )
}
