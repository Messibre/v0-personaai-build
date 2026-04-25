"use client"

import { useReducer, useCallback } from "react"
import type { WizardState, WizardAction } from "@/lib/types"
import { StepGithub } from "./step-github"
import { StepResume } from "./step-resume"
import { StepNotion } from "./step-notion"
import { StepCustomize } from "./step-customize"
import { StepPreview } from "./step-preview"
import { cn } from "@/lib/utils"
import { Github, FileText, StickyNote, Palette, Eye } from "lucide-react"

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
  config: {
    template: "developer",
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

  const canGoNext = useCallback(() => {
    switch (state.step) {
      case 0:
        return state.github.profile !== null
      case 1:
        return true // resume is optional
      case 2:
        return true // notion is optional
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
      // Only allow going to completed steps or the current step + 1
      if (step <= state.step) {
        dispatch({ type: "SET_STEP", step })
      }
    },
    [state.step]
  )

  const progressPercent = ((state.step) / 4) * 100

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isActive = i === state.step
            const isCompleted = i < state.step
            return (
              <button
                key={step.label}
                onClick={() => goToStep(i)}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-all duration-300 group",
                  isActive || isCompleted ? "cursor-pointer" : "cursor-default opacity-40"
                )}
                disabled={i > state.step}
                type="button"
              >
                <div
                  className={cn(
                    "flex items-center justify-center size-10 rounded-full border-2 transition-all duration-300",
                    isActive
                      ? "border-[var(--persona-accent)] bg-[var(--persona-accent)]/10 text-[var(--persona-accent)] scale-110"
                      : isCompleted
                        ? "border-[var(--persona-accent)] bg-[var(--persona-accent)] text-[var(--persona-bg)]"
                        : "border-muted-foreground/30 text-muted-foreground/30"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors hidden sm:block",
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
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--persona-accent)] to-[var(--persona-glow)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
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
  )
}
