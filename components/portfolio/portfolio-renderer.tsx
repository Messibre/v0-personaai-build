"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Monitor, Tablet, Smartphone } from "lucide-react"

interface PortfolioRendererProps {
  html: string
}

type ViewportSize = "desktop" | "tablet" | "mobile"

const VIEWPORTS: { id: ViewportSize; label: string; icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "375px" },
]

export function PortfolioRenderer({ html }: PortfolioRendererProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop")

  const currentViewport = VIEWPORTS.find((v) => v.id === viewport)!

  return (
    <div className="flex flex-col gap-3">
      {/* Viewport Toggle */}
      <div className="flex items-center justify-center gap-0.5 p-1 rounded-full bg-[var(--persona-surface)] border border-[var(--persona-border)] w-fit mx-auto">
        {VIEWPORTS.map((vp) => {
          const Icon = vp.icon
          const isActive = viewport === vp.id
          return (
            <Button
              key={vp.id}
              variant="ghost"
              size="sm"
              onClick={() => setViewport(vp.id)}
              className={cn(
                "gap-1.5 text-xs rounded-full transition-all duration-300",
                isActive
                  ? "bg-[var(--persona-accent)] text-[var(--persona-bg)] shadow-sm hover:bg-[var(--persona-accent)]/90"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{vp.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Iframe Container */}
      <div className="flex justify-center rounded-xl border border-[var(--persona-border)] bg-[var(--persona-surface)] p-4 overflow-hidden">
        <div
          className="transition-all duration-500 ease-out"
          style={{ width: currentViewport.width, maxWidth: "100%" }}
        >
          <div className="rounded-lg overflow-hidden border border-[var(--persona-border)] shadow-xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--persona-surface-hover)] border-b border-[var(--persona-border)]">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-red-400/60" />
                <div className="size-2.5 rounded-full bg-amber-400/60" />
                <div className="size-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-5 rounded-md bg-muted/20 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/50 font-mono">
                    portfolio.html
                  </span>
                </div>
              </div>
            </div>
            {/* Iframe */}
            <iframe
              srcDoc={html}
              title="Portfolio preview"
              className="w-full border-0 bg-white"
              style={{ height: "600px" }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
