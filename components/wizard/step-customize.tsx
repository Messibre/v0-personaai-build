"use client"

import type { Dispatch } from "react"
import type { WizardState, WizardAction, TemplateStyle, ColorScheme, SectionId } from "@/lib/types"
import { COLOR_SCHEMES, PORTFOLIO_SECTIONS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowLeft, Monitor, Terminal, Sparkles } from "lucide-react"

interface StepCustomizeProps {
  state: WizardState
  dispatch: Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}

const TEMPLATES: { id: TemplateStyle; label: string; description: string; icon: typeof Monitor }[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean, whitespace-focused, elegant typography",
    icon: Monitor,
  },
  {
    id: "developer",
    label: "Developer",
    description: "Terminal-inspired dark theme with code aesthetics",
    icon: Terminal,
  },
  {
    id: "creative",
    label: "Creative",
    description: "Bold colors, dynamic layout, expressive design",
    icon: Sparkles,
  },
]

export function StepCustomize({ state, dispatch, onNext, onBack }: StepCustomizeProps) {
  const { config } = state

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Customize Your Portfolio</h2>
        <p className="text-muted-foreground leading-relaxed">
          Choose a template style, color scheme, and which sections to include.
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Template Style</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((template) => {
            const Icon = template.icon
            const isSelected = config.template === template.id
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => dispatch({ type: "SET_CONFIG", config: { template: template.id } })}
                className={cn(
                  "flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  isSelected
                    ? "border-[var(--persona-accent)] bg-[var(--persona-accent)]/10"
                    : "border-muted/20 bg-muted/5 hover:border-[var(--persona-accent)]/30"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center size-10 rounded-lg transition-colors",
                    isSelected
                      ? "bg-[var(--persona-accent)] text-[var(--persona-bg)]"
                      : "bg-muted/20 text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", isSelected ? "text-[var(--persona-accent)]" : "text-foreground")}>
                    {template.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Color Scheme</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(Object.entries(COLOR_SCHEMES) as [ColorScheme, (typeof COLOR_SCHEMES)[ColorScheme]][]).map(
            ([key, scheme]) => {
              const isSelected = config.colorScheme === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => dispatch({ type: "SET_CONFIG", config: { colorScheme: key } })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? "border-[var(--persona-accent)] bg-[var(--persona-accent)]/5"
                      : "border-muted/20 bg-muted/5 hover:border-muted/40"
                  )}
                >
                  <div className="flex gap-1">
                    <div
                      className="size-5 rounded-full"
                      style={{ backgroundColor: scheme.primary }}
                    />
                    <div
                      className="size-5 rounded-full"
                      style={{ backgroundColor: scheme.secondary }}
                    />
                    <div
                      className="size-5 rounded-full"
                      style={{ backgroundColor: scheme.accent }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-[var(--persona-accent)]" : "text-muted-foreground"
                    )}
                  >
                    {scheme.label}
                  </span>
                </button>
              )
            }
          )}
        </div>
      </div>

      {/* Sections */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Sections to Include</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PORTFOLIO_SECTIONS.map((section) => {
            const isChecked = config.sections.includes(section.id as SectionId)
            return (
              <label
                key={section.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                  isChecked
                    ? "border-[var(--persona-accent)]/40 bg-[var(--persona-accent)]/5"
                    : "border-muted/20 bg-muted/5 hover:border-muted/30"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() =>
                    dispatch({ type: "TOGGLE_SECTION", section: section.id as SectionId })
                  }
                />
                <span className="text-sm text-foreground">{section.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={config.sections.length === 0}
          className="bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 gap-2"
          size="lg"
        >
          Generate Portfolio
          <Sparkles className="size-4" />
        </Button>
      </div>
    </div>
  )
}
