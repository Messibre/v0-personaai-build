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
  Sparkles,
  Camera,
  X,
  ImagePlus,
  Check,
  User,
} from "lucide-react"

interface StepCustomizeProps {
  state: WizardState
  dispatch: Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}

/* Mini SVG preview for each template style */
function TemplatePreview({ templateId, isSelected }: { templateId: TemplateStyle; isSelected: boolean }) {
  const accent = isSelected ? "var(--persona-accent)" : "currentColor"

  switch (templateId) {
    case "bold-portrait":
      return (
        <svg viewBox="0 0 160 90" className="w-full h-full" aria-hidden="true">
          <rect width="160" height="90" fill="#111" />
          {/* Large portrait silhouette */}
          <circle cx="100" cy="50" r="30" fill="#333" />
          <ellipse cx="100" cy="35" rx="12" ry="14" fill="#444" />
          {/* Big "Hello" text */}
          <text x="12" y="42" fontSize="22" fontWeight="900" fill="#fff" fontFamily="sans-serif">Hello</text>
          {/* Stats */}
          <text x="12" y="58" fontSize="6" fill={accent} fontFamily="sans-serif">+200</text>
          <text x="42" y="58" fontSize="6" fill={accent} fontFamily="sans-serif">+50</text>
          {/* Nav dots */}
          <circle cx="12" cy="10" r="2" fill="#555" />
          <rect x="70" y="8" width="16" height="3" rx="1" fill="#444" />
          <rect x="90" y="8" width="16" height="3" rx="1" fill="#444" />
          <rect x="110" y="8" width="16" height="3" rx="1" fill="#444" />
        </svg>
      )
    case "typographic":
      return (
        <svg viewBox="0 0 160 90" className="w-full h-full" aria-hidden="true">
          <rect width="160" height="90" fill="#fafafa" />
          {/* Portrait behind text */}
          <circle cx="80" cy="45" r="28" fill="#ddd" />
          <ellipse cx="80" cy="32" rx="10" ry="12" fill="#ccc" />
          {/* Oversized text overlay */}
          <text x="10" y="55" fontSize="20" fontWeight="900" fill="#111" opacity="0.85" fontFamily="sans-serif">Web</text>
          <text x="8" y="72" fontSize="16" fontWeight="900" fill={accent} opacity="0.7" fontFamily="sans-serif">{"Designer"}</text>
          {/* Small intro */}
          <text x="12" y="22" fontSize="5" fill="#888" fontFamily="sans-serif">my name is...</text>
          {/* Nav */}
          <rect x="100" y="8" width="14" height="3" rx="1" fill="#ccc" />
          <rect x="118" y="8" width="14" height="3" rx="1" fill="#ccc" />
          <rect x="136" y="8" width="14" height="3" rx="1" fill="#ccc" />
        </svg>
      )
    case "split-editorial":
      return (
        <svg viewBox="0 0 160 90" className="w-full h-full" aria-hidden="true">
          {/* Split dark/light */}
          <rect width="80" height="90" fill="#1a1a1a" />
          <rect x="80" width="80" height="90" fill="#f5f5f5" />
          {/* Portrait on dark side */}
          <circle cx="55" cy="50" r="22" fill="#333" />
          <ellipse cx="55" cy="38" rx="9" ry="10" fill="#444" />
          {/* Text on light side */}
          <text x="88" y="30" fontSize="8" fontWeight="800" fill="#111" fontFamily="sans-serif">Amazing</text>
          <text x="88" y="42" fontSize="8" fontWeight="800" fill="#111" fontFamily="sans-serif">branding</text>
          <text x="88" y="54" fontSize="8" fontWeight="800" fill="#111" fontFamily="sans-serif">mock-up</text>
          {/* Number */}
          <text x="10" y="30" fontSize="14" fontWeight="300" fill="#555" fontFamily="sans-serif">1/5</text>
          {/* Accent line */}
          <rect x="88" y="60" width="30" height="1" fill={accent} />
        </svg>
      )
    case "pastel-creative":
      return (
        <svg viewBox="0 0 160 90" className="w-full h-full" aria-hidden="true">
          {/* Pastel background blocks */}
          <rect width="160" height="55" fill="#d4eaf7" />
          <rect y="55" width="160" height="35" fill="#f5d5e0" />
          {/* Portrait */}
          <circle cx="100" cy="35" r="20" fill="#9cc" opacity="0.5" />
          <ellipse cx="100" cy="25" rx="8" ry="10" fill="#8bb" opacity="0.6" />
          {/* Text */}
          <text x="12" y="30" fontSize="8" fontWeight="800" fill="#222" fontFamily="sans-serif">Hey there,</text>
          <text x="12" y="42" fontSize="7" fontWeight="800" fill="#222" fontFamily="sans-serif">Interaction</text>
          <text x="12" y="52" fontSize="7" fontWeight="800" fill="#222" fontFamily="sans-serif">Designer</text>
          {/* Project cards */}
          <rect x="20" y="62" width="35" height="20" rx="3" fill="#fff" opacity="0.8" />
          <rect x="62" y="62" width="35" height="20" rx="3" fill="#fff" opacity="0.8" />
          <rect x="104" y="62" width="35" height="20" rx="3" fill="#fff" opacity="0.8" />
        </svg>
      )
    case "designer-coder":
      return (
        <svg viewBox="0 0 160 90" className="w-full h-full" aria-hidden="true">
          {/* Split gradient */}
          <rect width="80" height="90" fill="#f8f8f8" />
          <rect x="80" width="80" height="90" fill="#2a2a2a" />
          {/* Colorful portrait center */}
          <circle cx="80" cy="45" r="24" fill={accent} opacity="0.3" />
          <circle cx="80" cy="45" r="18" fill="#eee" />
          <ellipse cx="80" cy="35" rx="8" ry="10" fill="#ddd" />
          {/* Paint splashes */}
          <circle cx="62" cy="30" r="5" fill="#f59e0b" opacity="0.6" />
          <circle cx="98" cy="60" r="4" fill="#3b82f6" opacity="0.6" />
          <circle cx="70" cy="65" r="3" fill="#ef4444" opacity="0.6" />
          {/* Labels */}
          <text x="10" y="45" fontSize="9" fontWeight="800" fill="#333" fontFamily="sans-serif">designer</text>
          <text x="95" y="45" fontSize="8" fontWeight="600" fill="#aaa" fontFamily="monospace">{"<coder>"}</text>
          {/* Nav */}
          <circle cx="80" cy="8" r="4" fill="none" stroke="#888" strokeWidth="0.5" />
        </svg>
      )
    case "minimal-clean":
      return (
        <svg viewBox="0 0 160 90" className="w-full h-full" aria-hidden="true">
          <rect width="160" height="90" fill="#fff" />
          {/* Clean grid lines */}
          <line x1="0" y1="18" x2="160" y2="18" stroke="#f0f0f0" strokeWidth="0.5" />
          {/* Simple portrait */}
          <circle cx="80" cy="42" r="14" fill="#f0f0f0" />
          <ellipse cx="80" cy="35" rx="6" ry="7" fill="#e5e5e5" />
          {/* Clean text */}
          <text x="55" y="68" fontSize="7" fontWeight="600" fill="#222" fontFamily="sans-serif" textAnchor="start">John Doe</text>
          <text x="55" y="76" fontSize="4" fill="#999" fontFamily="sans-serif" textAnchor="start">Software Engineer</text>
          {/* Minimal nav */}
          <rect x="10" y="8" width="20" height="3" rx="1" fill="#222" />
          <rect x="110" y="8" width="12" height="3" rx="1" fill="#eee" />
          <rect x="126" y="8" width="12" height="3" rx="1" fill="#eee" />
          <rect x="142" y="8" width="12" height="3" rx="1" fill="#eee" />
          {/* Accent dot */}
          <circle cx="80" cy="83" r="2" fill={accent} />
        </svg>
      )
  }
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
          Choose a design inspired by world-class portfolios, pick your colors, and add your photo.
        </p>
      </div>

      {/* Photo Upload */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Camera className="size-4 text-[var(--persona-accent)]" />
          Your Photo
          <span className="text-xs font-normal text-muted-foreground">(adds a personal touch)</span>
        </h3>
        <div className="flex items-center gap-4">
          {photo.dataUrl ? (
            <div className="relative group">
              <img
                src={photo.dataUrl}
                alt="Your photo"
                className="size-24 rounded-2xl object-cover border-2 border-[var(--persona-accent)]/30 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
              />
              <button
                type="button"
                onClick={() => dispatch({ type: "CLEAR_PHOTO" })}
                className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:scale-110"
                aria-label="Remove photo"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex flex-col items-center justify-center size-24 rounded-2xl border-2 border-dashed border-[var(--persona-border)] bg-[var(--persona-surface)] hover:border-[var(--persona-accent)]/50 hover:bg-[var(--persona-surface-hover)] transition-all duration-300 cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-1 group-hover:bg-[var(--persona-accent)]/10 transition-colors">
                <User className="size-5 text-muted-foreground group-hover:text-[var(--persona-accent)] transition-colors" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Add Photo</span>
            </button>
          )}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-foreground font-medium">
              {photo.dataUrl ? "Looking great!" : "Upload a profile photo"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {photo.dataUrl
                ? photo.file?.name
                : "Your photo will be featured prominently in the hero section. Max 5MB."}
            </p>
            {photo.dataUrl && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-xs text-[var(--persona-accent)] hover:underline w-fit transition-colors"
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {TEMPLATE_OPTIONS.map((template) => {
            const isSelected = config.template === template.id
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => dispatch({ type: "SET_CONFIG", config: { template: template.id } })}
                className={cn(
                  "flex flex-col items-start gap-0 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden group",
                  isSelected
                    ? "border-[var(--persona-accent)] shadow-lg shadow-[var(--persona-accent)]/15 scale-[1.02]"
                    : "border-[var(--persona-border)] hover:border-[var(--persona-accent)]/30 hover:shadow-md"
                )}
              >
                {/* SVG Preview */}
                <div className={cn(
                  "w-full aspect-video flex items-center justify-center overflow-hidden transition-all duration-300",
                  isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-90"
                )}>
                  <TemplatePreview templateId={template.id} isSelected={isSelected} />
                </div>
                <div className="flex flex-col gap-1 p-3 w-full bg-[var(--persona-surface)] border-t border-[var(--persona-border)]">
                  <div className="flex items-center gap-2">
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
                      : "border-[var(--persona-border)] hover:border-muted-foreground/30 hover:scale-[1.03]"
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
                  "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]",
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
