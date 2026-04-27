"use client"

import { useCallback, useEffect, useState, type Dispatch } from "react"
import type { WizardState, WizardAction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { PortfolioEditor } from "@/components/portfolio/portfolio-editor"
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Copy,
  Download,
  ExternalLink,
  Sparkles,
  Check,
  Rocket,
  Loader2,
  Link2,
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
  
  // Deploy state
  const [deploying, setDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<"idle" | "uploading" | "deploying" | "ready" | "error">("idle")
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)

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

  // Handle inline edits from the editor
  const handleHtmlChange = useCallback(
    (newHtml: string) => {
      dispatch({ type: "SET_PORTFOLIO", html: newHtml, title: portfolio.title || "portfolio" })
    },
    [dispatch, portfolio.title]
  )

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

  // Deploy to Vercel
  const deployToVercel = useCallback(async () => {
    if (!portfolio.html) return

    setDeploying(true)
    setDeployStatus("uploading")
    setDeployError(null)
    setDeployUrl(null)

    try {
      setDeployStatus("deploying")
      
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: portfolio.html,
          projectName: portfolio.title || "my-portfolio",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Deployment failed")
      }

      setDeployUrl(data.url)
      setDeployStatus("ready")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deployment failed"
      setDeployError(message)
      setDeployStatus("error")
    } finally {
      setDeploying(false)
    }
  }, [portfolio.html, portfolio.title])

  const copyDeployUrl = useCallback(async () => {
    if (!deployUrl) return
    try {
      await navigator.clipboard.writeText(deployUrl)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = deployUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 2000)
  }, [deployUrl])

  const loading = isGenerating || portfolio.loading

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-balance">Your Portfolio</h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {loading
            ? "Building your portfolio..."
            : portfolio.html
              ? "Click \"Edit Portfolio\" to customize text and swap images. Export when ready."
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

      {/* Portfolio Preview with Editor */}
      {portfolio.html && !loading && (
        <div className="animate-fade-in-up">
          <PortfolioEditor html={portfolio.html} onHtmlChange={handleHtmlChange} />

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
              {copied ? (
                <>
                  <Check className="size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" />{" "}
                  <span className="hidden sm:inline">Copy HTML</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </Button>
            <Button
              onClick={downloadHtml}
              variant="outline"
              size="sm"
              className="gap-2 border-[var(--persona-border)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Download .html</span>
              <span className="sm:hidden">Download</span>
            </Button>
            <Button
              onClick={openInV0}
              size="sm"
              className="gap-2 bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 shadow-lg shadow-[var(--persona-accent)]/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="size-4" />
              Open in v0
            </Button>
            
            {/* Deploy to Vercel */}
            <Button
              onClick={deployToVercel}
              disabled={deploying}
              size="sm"
              className={cn(
                "gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                deployStatus === "ready"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100"
              )}
            >
              {deploying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {deployStatus === "uploading" ? "Uploading..." : "Deploying..."}
                </>
              ) : deployStatus === "ready" ? (
                <>
                  <Check className="size-4" />
                  Deployed
                </>
              ) : (
                <>
                  <Rocket className="size-4" />
                  Deploy to Vercel
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: "CLEAR_PORTFOLIO" })
                setDeployStatus("idle")
                setDeployUrl(null)
                setDeployError(null)
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

          {/* Deployment URL Success */}
          {deployUrl && deployStatus === "ready" && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2">
                <Check className="size-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">Successfully deployed!</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border font-mono text-sm truncate">
                  <Link2 className="size-4 text-muted-foreground shrink-0" />
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--persona-accent)] hover:underline truncate"
                  >
                    {deployUrl}
                  </a>
                </div>
                <Button
                  onClick={copyDeployUrl}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 shrink-0",
                    urlCopied && "border-green-500/30 text-green-500"
                  )}
                >
                  {urlCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {urlCopied ? "Copied" : "Copy"}
                </Button>
                <Button
                  onClick={() => window.open(deployUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                >
                  <ExternalLink className="size-4" />
                  Visit
                </Button>
              </div>
            </div>
          )}

          {/* Deployment Error */}
          {deployError && deployStatus === "error" && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in-scale">
              <AlertCircle className="size-4 shrink-0" />
              <span>{deployError}</span>
              <Button
                onClick={deployToVercel}
                variant="ghost"
                size="sm"
                className="ml-auto gap-1 text-destructive hover:text-destructive"
              >
                <RefreshCw className="size-3" />
                Retry
              </Button>
            </div>
          )}
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
