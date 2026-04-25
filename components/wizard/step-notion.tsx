"use client"

import { useCallback, type Dispatch } from "react"
import type { WizardState, WizardAction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { StickyNote, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, X, Link2 } from "lucide-react"

interface StepNotionProps {
  state: WizardState
  dispatch: Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}

export function StepNotion({ state, dispatch, onNext, onBack }: StepNotionProps) {
  const { notion } = state

  const fetchNotion = useCallback(async () => {
    if (!notion.url.trim()) return

    dispatch({ type: "SET_NOTION_LOADING", loading: true })

    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: notion.url.trim() }),
      })

      const data = await res.json()

      if (data.content) {
        dispatch({ type: "SET_NOTION_CONTENT", content: data.content })
      } else {
        dispatch({
          type: "SET_NOTION_ERROR",
          error: data.error || "Could not extract content from this page.",
        })
      }
    } catch {
      dispatch({ type: "SET_NOTION_ERROR", error: "Network error. Please try again." })
    }
  }, [notion.url, dispatch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      fetchNotion()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Import from Notion</h2>
        <p className="text-muted-foreground leading-relaxed">
          Optionally link a public Notion page to add extra content like project writeups,
          blog posts, or a personal bio. This is entirely optional.
        </p>
      </div>

      {/* Input */}
      {!notion.content && (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="https://notion.so/your-page-abc123..."
              value={notion.url}
              onChange={(e) => dispatch({ type: "SET_NOTION_URL", url: e.target.value })}
              onKeyDown={handleKeyDown}
              className="pl-10 bg-muted/20 border-muted/40 focus-visible:border-[var(--persona-accent)] focus-visible:ring-[var(--persona-accent)]/20"
              disabled={notion.loading}
            />
          </div>
          <Button
            onClick={fetchNotion}
            disabled={!notion.url.trim() || notion.loading}
            className="bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90"
          >
            {notion.loading ? <Spinner /> : "Fetch"}
          </Button>
        </div>
      )}

      {/* Loading */}
      {notion.loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
          <Spinner className="size-5 text-[var(--persona-accent)]" />
          <span>Attempting to fetch Notion content...</span>
        </div>
      )}

      {/* Error (non-blocking) */}
      {notion.error && (
        <div className="flex items-start gap-2 text-sm text-amber-500 bg-amber-500/10 rounded-lg px-4 py-3">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p>{notion.error}</p>
            <p className="text-xs text-amber-500/70 mt-1">
              {"Don't worry - you can skip this step. Your portfolio will be generated from GitHub and resume data."}
            </p>
          </div>
        </div>
      )}

      {/* Success */}
      {notion.content && (
        <Card className="border-[var(--persona-accent)]/20 bg-[var(--persona-accent)]/5">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-[var(--persona-accent)]/10">
                  <StickyNote className="size-5 text-[var(--persona-accent)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Notion Content</h3>
                    <CheckCircle className="size-4 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notion.content.length.toLocaleString()} characters imported
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => dispatch({ type: "CLEAR_NOTION" })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
                <span className="sr-only">Clear Notion content</span>
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto rounded-lg bg-background/50 border border-muted/20 p-3">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {notion.content.substring(0, 500)}
                {notion.content.length > 500 && "..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info note */}
      {!notion.content && !notion.loading && !notion.error && (
        <div className="rounded-lg border border-muted/20 bg-muted/5 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page must be published/shared publicly on Notion. Private pages cannot be accessed.
            This feature works on a best-effort basis.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {!notion.content && (
            <Button variant="ghost" onClick={onNext} className="text-muted-foreground">
              Skip
            </Button>
          )}
          <Button
            onClick={onNext}
            className="bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 gap-2"
            size="lg"
          >
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
