"use client"

import { useReducer, useCallback, useRef, useEffect } from "react"
import type { WizardState, WizardAction } from "@/lib/types"
import { StepGithub } from "./step-github"
import { StepResume } from "./step-resume"
import { StepNotion } from "./step-notion"
import { StepCustomize } from "./step-customize"
import { StepPreview } from "./step-preview"
import { cn } from "@/lib/utils"
import { Github, FileText, StickyNote, Palette, Eye, Check } from "lucide-react"

const STEPS = [
  { label: "GitHub", icon: Github },
  { label: "Resume", icon: FileText },
  { label: "Notion", icon: StickyNote },
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
  config: {
    template: "bold-portrait",
    colorScheme: "ocean",
    sections: ["about", "skills", "projects", "experience", "contact"],
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

  // Scroll to wizard top when step changes (not to bottom of page)
  useEffect(() => {
    if (wizardTopRef.current) {
      wizardTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [state.step])

  const canGoNext = useCallback(() => {
    switch (state.step) {
      case 0:
        return state.github.profile !== null
      case 1:
        return true
      case 2:
        return true
      case 3:
        return state.config.sections.length > 0
      default:
        return false
    }
  }, [state.step, state.github.profile, state.config.sections.length])

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

  const progressPercent = ((state.step) / 4) * 100

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div ref={wizardTopRef} className="scroll-mt-24" />
      {/* Step Indicators */}
      <div className="mb-10">
        {/* Steps row */}
        <div className="flex items-center justify-between mb-5 relative">
          {/* Connecting line */}
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

      {/* Step Content with animation */}
      <div className="min-h-[420px]" key={state.step}>
        <div className="animate-fade-in-up">
          {state.step === 0 && (
            <StepGithub state={state} dispatch={dispatch} onNext={goNext} />
          )}
          {state.step === 1 && (
            <StepResume state={state} dispatch={dispatch} onNext={goNext} onBack={goBack} />
          )}
          {state.step === 2 && (
            <StepNotion state={state} dispatch={dispatch} onNext={goNext} onBack={goBack} />
          )}
          {state.step === 3 && (
            <StepCustomize state={state} dispatch={dispatch} onNext={goNext} onBack={goBack} />
          )}
          {state.step === 4 && (
            <StepPreview state={state} dispatch={dispatch} onBack={goBack} />
          )}
        </div>
      </div>
    </div>
  )
}
