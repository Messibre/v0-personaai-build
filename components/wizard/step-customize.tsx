"use client"

import { useCallback, useRef, type Dispatch } from "react"
import type { WizardState, WizardAction, TemplateStyle, ColorScheme, SectionId } from "@/lib/types"
import { COLOR_SCHEMES, PORTFOLIO_SECTIONS, TEMPLATE_OPTIONS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  ArrowLeft,
  Monitor,
  Terminal,
  Sparkles,
  Layers,
  Gamepad2,
  BookOpen,
  Camera,
  X,
  ImagePlus,
  Check,
} from "lucide-react"

interface StepCustomizeProps {
  state: WizardState
  dispatch: Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}

const TEMPLATE_ICONS: Record<TemplateStyle, typeof Monitor> = {
  minimal: Monitor,
  developer: Terminal,
  creative: Sparkles,
  glassmorphism: Layers,
  retro: Gamepad2,
  elegant: BookOpen,
}

/* Preview gradient representing each template */
const TEMPLATE_PREVIEWS: Record<TemplateStyle, { bg: string; bars: string[] }> = {
  minimal: { bg: "#fafafa", bars: ["#e5e5e5", "#d4d4d4", "#e5e5e5"] },
  developer: { bg: "#0d1117", bars: ["#21262d", "#30363d", "#21262d"] },
  creative: { bg: "#fef3c7", bars: ["#fbbf24", "#f59e0b", "#fbbf24"] },
  glassmorphism: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", bars: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.2)"] },
  retro: { bg: "#fef9ef", bars: ["#d97706", "#92400e", "#d97706"] },
  elegant: { bg: "#1c1917", bars: ["#44403c", "#57534e", "#44403c"] },
}

export function StepCustomize({ state, dispatch, onNext, onBack }: StepCustomizeProps) {
  const { config, photo } = state
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return
      if (file.size > 5 * 1024 * 1024) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        dispatch({ type: "SET_PHOTO", file, dataUrl })
      }
      reader.readAsDataURL(file)
    },
    [dispatch]
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">Customize Your Portfolio</h2>
        <p className="text-muted-foreground leading-relaxed">
          Pick a template, color scheme, your photo, and which sections to include.
        </p>
      </div>

      {/* Photo Upload */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Camera className="size-4 text-[var(--persona-accent)]" />
          Your Photo
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </h3>
        <div className="flex items-center gap-4">
          {photo.dataUrl ? (
            <div className="relative group">
              <img
                src={photo.dataUrl}
                alt="Your photo"
                className="size-20 rounded-xl object-cover border-2 border-[var(--persona-accent)]/30 shadow-md transition-transform duration-300 group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => dispatch({ type: "CLEAR_PHOTO" })}
                className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                aria-label="Remove photo"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex flex-col items-center justify-center size-20 rounded-xl border-2 border-dashed border-[var(--persona-border)] bg-[var(--persona-surface)] hover:border-[var(--persona-accent)]/50 hover:bg-[var(--persona-surface-hover)] transition-all duration-300 cursor-pointer group"
            >
              <ImagePlus className="size-5 text-muted-foreground group-hover:text-[var(--persona-accent)] transition-colors" />
              <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
            </button>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              {photo.dataUrl ? photo.file?.name : "Add a profile photo for your portfolio"}
            </p>
            {photo.dataUrl && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-xs text-[var(--persona-accent)] hover:underline w-fit"
              >
                Change photo
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handlePhotoUpload(file)
            }}
            className="hidden"
            aria-label="Upload profile photo"
          />
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Template Style</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
          {TEMPLATE_OPTIONS.map((template) => {
            const Icon = TEMPLATE_ICONS[template.id]
            const preview = TEMPLATE_PREVIEWS[template.id]
            const isSelected = config.template === template.id
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => dispatch({ type: "SET_CONFIG", config: { template: template.id } })}
                className={cn(
                  "flex flex-col items-start gap-0 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden group",
                  isSelected
                    ? "border-[var(--persona-accent)] shadow-md shadow-[var(--persona-accent)]/10 scale-[1.02]"
                    : "border-[var(--persona-border)] hover:border-[var(--persona-accent)]/30 hover:shadow-sm"
                )}
              >
                {/* Mini preview */}
                <div
                  className="w-full h-16 flex items-end justify-center gap-1 p-2 transition-all duration-300"
                  style={{ background: preview.bg }}
                >
                  {preview.bars.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-sm transition-all duration-300"
                      style={{
                        backgroundColor: color,
                        height: `${[60, 80, 50][idx % 3]}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-1 p-3 w-full bg-[var(--persona-surface)]">
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      "size-4 transition-colors",
                      isSelected ? "text-[var(--persona-accent)]" : "text-muted-foreground"
                    )} />
                    <p className={cn(
                      "text-sm font-semibold transition-colors",
                      isSelected ? "text-[var(--persona-accent)]" : "text-foreground"
                    )}>
                      {template.label}
                    </p>
                    {isSelected && <Check className="size-3.5 text-[var(--persona-accent)] ml-auto animate-check-pop" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
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
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {(Object.entries(COLOR_SCHEMES) as [ColorScheme, (typeof COLOR_SCHEMES)[ColorScheme]][]).map(
            ([key, scheme]) => {
              const isSelected = config.colorScheme === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => dispatch({ type: "SET_CONFIG", config: { colorScheme: key } })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-300",
                    isSelected
                      ? "border-[var(--persona-accent)] shadow-md shadow-[var(--persona-accent)]/10 scale-105"
                      : "border-[var(--persona-border)] hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex gap-0.5">
                    <div
                      className="size-4 rounded-full transition-transform duration-300"
                      style={{ backgroundColor: scheme.primary, transform: isSelected ? "scale(1.15)" : "" }}
                    />
                    <div
                      className="size-4 rounded-full"
                      style={{ backgroundColor: scheme.accent }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors",
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PORTFOLIO_SECTIONS.map((section) => {
            const isChecked = config.sections.includes(section.id as SectionId)
            return (
              <label
                key={section.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300",
                  isChecked
                    ? "border-[var(--persona-accent)]/40 bg-[var(--persona-accent)]/5"
                    : "border-[var(--persona-border)] hover:border-muted-foreground/30"
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
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={config.sections.length === 0}
          className="bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 gap-2 shadow-lg shadow-[var(--persona-accent)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--persona-accent)]/30 hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
        >
          Generate Portfolio
          <Sparkles className="size-4" />
        </Button>
      </div>
    </div>
  )
}
