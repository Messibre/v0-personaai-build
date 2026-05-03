"use client"

import { useReducer, useCallback, useRef, useEffect } from "react"
import type { WizardState, WizardAction, AIGeneratedContent } from "@/lib/types"
import { StepStart } from "./step-start"
import { StepResume } from "./step-resume"
import { StepTargetRole } from "./step-target-role"
import { StepCustomize } from "./step-customize"
import { StepPreview } from "./step-preview"
import { cn } from "@/lib/utils"
import { Sparkles, FileText, Target, Palette, Eye, Check } from "lucide-react"

const STEPS = [
  { label: "Get Started", icon: Sparkles },
  { label: "Resume", icon: FileText },
  { label: "Target Role", icon: Target },
  { label: "Customize", icon: Palette },
  { label: "Preview", icon: Eye },
]

const initialState: WizardState = {
  step: 0,
  github: {
    username: "",
    profile: null,
    repos: [],
    loading: false,
    error: null,
  },
  resume: {
    file: null,
    text: null,
    loading: false,
    error: null,
  },
  notion: {
    url: "",
    content: null,
    loading: false,
    error: null,
  },
  photo: {
    file: null,
    dataUrl: null,
  },
  targetRole: {
    role: "",
    externalLinks: [],
  },
  aiContent: {
    projects: null,
    aboutMe: null,
    heroTagline: null,
    loading: false,
    error: null,
  },
  config: {
    template: "bold-portrait",
    colorScheme: "ocean",
    sections: ["about", "skills", "projects", "experience", "github-stats", "contact"],
    socialLinks: {},
    additionalPrompt: "",
  },
  portfolio: {
    html: null,
    title: null,
    loading: false,
    error: null,
  },
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step }
    case "SET_GITHUB_USERNAME":
      return { ...state, github: { ...state.github, username: action.username, error: null } }
    case "SET_GITHUB_LOADING":
      return { ...state, github: { ...state.github, loading: action.loading, error: null } }
    case "SET_GITHUB_DATA":
      return { ...state, github: { ...state.github, profile: action.profile, repos: action.repos, loading: false, error: null } }
    case "SET_GITHUB_ERROR":
      return { ...state, github: { ...state.github, error: action.error, loading: false } }
    case "CLEAR_GITHUB":
      return { ...state, github: { ...initialState.github } }
    case "SET_RESUME_FILE":
      return { ...state, resume: { ...state.resume, file: action.file, error: null } }
    case "SET_RESUME_LOADING":
      return { ...state, resume: { ...state.resume, loading: action.loading, error: null } }
    case "SET_RESUME_TEXT":
      return { ...state, resume: { ...state.resume, text: action.text, loading: false, error: null } }
    case "SET_RESUME_ERROR":
      return { ...state, resume: { ...state.resume, error: action.error, loading: false } }
    case "CLEAR_RESUME":
      return { ...state, resume: { ...initialState.resume } }
    case "SET_NOTION_URL":
      return { ...state, notion: { ...state.notion, url: action.url, error: null } }
    case "SET_NOTION_LOADING":
      return { ...state, notion: { ...state.notion, loading: action.loading, error: null } }
    case "SET_NOTION_CONTENT":
      return { ...state, notion: { ...state.notion, content: action.content, loading: false, error: null } }
    case "SET_NOTION_ERROR":
      return { ...state, notion: { ...state.notion, error: action.error, loading: false } }
    case "CLEAR_NOTION":
      return { ...state, notion: { ...initialState.notion } }
    case "SET_PHOTO":
      return { ...state, photo: { file: action.file, dataUrl: action.dataUrl } }
    case "CLEAR_PHOTO":
      return { ...state, photo: { file: null, dataUrl: null } }
    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.config } }
    case "TOGGLE_SECTION": {
      const sections = state.config.sections.includes(action.section)
        ? state.config.sections.filter((s) => s !== action.section)
        : [...state.config.sections, action.section]
      return { ...state, config: { ...state.config, sections } }
    }
    case "SET_SOCIAL_LINKS":
      return { ...state, config: { ...state.config, socialLinks: action.socialLinks } }
    case "SET_ADDITIONAL_PROMPT":
      return { ...state, config: { ...state.config, additionalPrompt: action.prompt } }
    case "SET_TARGET_ROLE":
      return { ...state, targetRole: { ...state.targetRole, role: action.role } }
    case "SET_EXTERNAL_LINKS":
      return { ...state, targetRole: { ...state.targetRole, externalLinks: action.links } }
    case "SET_AI_CONTENT_LOADING":
      return { ...state, aiContent: { ...state.aiContent, loading: action.loading, error: null } }
    case "SET_AI_CONTENT":
      return { ...state, aiContent: { ...state.aiContent, projects: action.content.projects, aboutMe: action.content.aboutMe, heroTagline: action.content.heroTagline, loading: false, error: null } }
    case "SET_AI_CONTENT_ERROR":
      return { ...state, aiContent: { ...state.aiContent, error: action.error, loading: false } }
    case "CLEAR_AI_CONTENT":
      return { ...state, aiContent: { ...initialState.aiContent } }
    case "SET_PORTFOLIO_LOADING":
      return { ...state, portfolio: { ...state.portfolio, loading: action.loading, error: null } }
    case "SET_PORTFOLIO":
      return { ...state, portfolio: { html: action.html, title: action.title, loading: false, error: null } }
    case "SET_PORTFOLIO_ERROR":
      return { ...state, portfolio: { ...state.portfolio, error: action.error, loading: false } }
    case "CLEAR_PORTFOLIO":
      return { ...state, portfolio: { ...initialState.portfolio } }
    default:
      return state
  }
}

export function WizardShell() {
  const [state, dispatch] = useReducer(wizardReducer, initialState)
  const wizardTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (wizardTopRef.current) {
      wizardTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [state.step])

  const canGoNext = useCallback(() => {
    switch (state.step) {
      case 0: // Get Started - need at least a profile (github, notion, or manual)
        return state.github.profile !== null || state.notion.content !== null
      case 1: // Resume - always optional
        return true
      case 2: // Target Role - always optional (can skip AI generation)
        return true
      case 3: // Customize
        return state.config.sections.length > 0
      default:
        return false
    }
  }, [state.step, state.github.profile, state.notion.content, state.config.sections.length])

  const goNext = useCallback(() => {
    if (state.step < 4 && canGoNext()) {
      dispatch({ type: "SET_STEP", step: state.step + 1 })
    }
  }, [state.step, canGoNext])

  const goBack = useCallback(() => {
    if (state.step > 0) {
      dispatch({ type: "SET_STEP", step: state.step - 1 })
    }
  }, [state.step])

  const goToStep = useCallback(
    (step: number) => {
      if (step <= state.step) {
        dispatch({ type: "SET_STEP", step })
      }
    },
    [state.step]
  )

  const progressPercent = (state.step / 4) * 100

  // Preview step gets its own full-width full-page layout
  const isPreviewStep = state.step === 4

  return (
    <div className="w-full">
      <div ref={wizardTopRef} className="scroll-mt-24" />

      {/* Step Indicators — hidden on preview step */}
      {!isPreviewStep && (
        <div className="px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-10 max-w-4xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5 relative">
            <div className="absolute top-5 left-[5%] right-[5%] h-px bg-[var(--persona-border)]" aria-hidden="true" />
            <div
              className="absolute top-5 left-[5%] h-px bg-[var(--persona-accent)] transition-all duration-700 ease-out"
              style={{ width: `${progressPercent * 0.9}%` }}
              aria-hidden="true"
            />
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = i === state.step
              const isCompleted = i < state.step
              return (
                <button
                  key={step.label}
                  onClick={() => goToStep(i)}
                  className={cn(
                    "relative z-10 flex flex-col items-center gap-2 transition-all duration-300 group",
                    isActive || isCompleted ? "cursor-pointer" : "cursor-default"
                  )}
                  disabled={i > state.step}
                  type="button"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-full border-2 transition-all duration-400 bg-background",
                      isActive
                        ? "border-[var(--persona-accent)] text-[var(--persona-accent)] scale-110 shadow-[0_0_16px_-2px] shadow-[var(--persona-accent)]/30"
                        : isCompleted
                          ? "border-[var(--persona-accent)] bg-[var(--persona-accent)] text-[var(--persona-bg)]"
                          : "border-[var(--persona-border)] text-muted-foreground/40"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-4 animate-check-pop" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors duration-300 hidden sm:block",
                      isActive
                        ? "text-[var(--persona-accent)]"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        </div>
      )}

      {/* Step Content */}
      <div key={state.step}>
        {!isPreviewStep ? (
          <div className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 max-w-4xl mx-auto min-h-[420px] animate-fade-in-up">
            {state.step === 0 && (
              <StepStart state={state} dispatch={dispatch} onNext={goNext} />
            )}
            {state.step === 1 && (
              <StepResume state={state} dispatch={dispatch} onNext={goNext} onBack={goBack} />
            )}
            {state.step === 2 && (
              <StepTargetRole state={state} dispatch={dispatch} onNext={goNext} onBack={goBack} />
            )}
            {state.step === 3 && (
              <StepCustomize state={state} dispatch={dispatch} onNext={goNext} onBack={goBack} />
            )}
          </div>
        ) : (
          <StepPreview state={state} dispatch={dispatch} onBack={goBack} />
        )}
      </div>
    </div>
  )
}
