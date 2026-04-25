"use client"

import { useCallback, useEffect, useState, type Dispatch } from "react"
import type { WizardState, WizardAction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PortfolioRenderer } from "@/components/portfolio/portfolio-renderer"
import { ArrowLeft, AlertCircle, RefreshCw, Copy, Download, ExternalLink, Sparkles, Check } from "lucide-react"

interface StepPreviewProps {
  state: WizardState
  dispatch: Dispatch<WizardAction>
  onBack: () => void
}

export function StepPreview({ state, dispatch, onBack }: StepPreviewProps) {
  const { portfolio, github, resume, notion, config, photo } = state
  const [copied, setCopied] = useState(false)

  const generate = useCallback(async () => {
    if (!github.profile) return

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
        dispatch({ type: "SET_PORTFOLIO_ERROR", error: data.error || "Failed to generate" })
        return
      }

      dispatch({ type: "SET_PORTFOLIO", html: data.html, title: data.title })
    } catch {
      dispatch({ type: "SET_PORTFOLIO_ERROR", error: "Network error. Please try again." })
    }
  }, [github, resume.text, notion.content, config, photo.dataUrl, dispatch])

  // Auto-generate on first load of this step
  useEffect(() => {
    if (!portfolio.html && !portfolio.loading && !portfolio.error) {
      generate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copyHtml = useCallback(async () => {
    if (!portfolio.html) return
    try {
      await navigator.clipboard.writeText(portfolio.html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = portfolio.html
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
      // Silently fail
    }
    window.open("https://v0.dev/chat", "_blank")
  }, [portfolio.html])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">Your Portfolio</h2>
          <p className="text-muted-foreground leading-relaxed">
            {portfolio.loading
              ? "AI is crafting your portfolio..."
              : portfolio.html
                ? "Preview your generated portfolio and export it."
                : "Generate your AI-powered portfolio."}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {portfolio.loading && (
        <div className="flex flex-col items-center justify-center gap-6 py-20 animate-fade-in-up">
          <div className="relative">
            <div className="size-16 rounded-full border-2 border-[var(--persona-accent)]/20 flex items-center justify-center animate-pulse-glow">
              <Sparkles className="size-7 text-[var(--persona-accent)] animate-pulse" />
            </div>
            <Spinner className="size-20 text-[var(--persona-accent)] absolute -top-2 -left-2" />
          </div>
          <div className="text-center flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Generating your portfolio</p>
            <p className="text-xs text-muted-foreground">
              This may take 15-30 seconds. Gemini 2.5 Flash is crafting your site...
            </p>
          </div>
          {/* Progress shimmer bar */}
          <div className="w-64 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div className="h-full w-full animate-shimmer rounded-full" />
          </div>
        </div>
      )}

      {/* Error */}
      {portfolio.error && (
        <div className="flex flex-col items-center gap-4 py-12 animate-fade-in-scale">
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
      {portfolio.html && !portfolio.loading && (
        <div className="animate-fade-in-up">
          <PortfolioRenderer html={portfolio.html} />

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button
              onClick={copyHtml}
              variant="outline"
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
                  Copy HTML
                </>
              )}
            </Button>
            <Button
              onClick={downloadHtml}
              variant="outline"
              className="gap-2 border-[var(--persona-border)] hover:border-[var(--persona-accent)]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="size-4" />
              Download .html
            </Button>
            <Button
              onClick={openInV0}
              className="gap-2 bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 shadow-lg shadow-[var(--persona-accent)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--persona-accent)]/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="size-4" />
              Open in v0
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: "CLEAR_PORTFOLIO" })
                generate()
              }}
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <RefreshCw className="size-4" />
              Regenerate
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
