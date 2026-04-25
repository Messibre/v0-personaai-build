export interface GitHubProfile {
  username: string
  name: string | null
  bio: string | null
  avatar_url: string
  followers: number
  following: number
  public_repos: number
  html_url: string
  location: string | null
  blog: string | null
  company: string | null
}

export interface GitHubRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  html_url: string
  fork: boolean
  topics: string[]
  homepage: string | null
}

export interface ResumeData {
  raw_text: string
}

export interface NotionData {
  content: string | null
  title?: string
  error?: string
}

export type TemplateStyle =
  | "minimal"
  | "developer"
  | "creative"
  | "glassmorphism"
  | "retro"
  | "elegant"

export type ColorScheme =
  | "ocean"
  | "sunset"
  | "forest"
  | "midnight"
  | "ember"
  | "arctic"
  | "lavender"
  | "rose"

export const COLOR_SCHEMES: Record<ColorScheme, { label: string; primary: string; secondary: string; accent: string }> = {
  ocean: { label: "Ocean", primary: "#0ea5e9", secondary: "#0284c7", accent: "#38bdf8" },
  sunset: { label: "Sunset", primary: "#f97316", secondary: "#ea580c", accent: "#fb923c" },
  forest: { label: "Forest", primary: "#22c55e", secondary: "#16a34a", accent: "#4ade80" },
  midnight: { label: "Midnight", primary: "#6366f1", secondary: "#4f46e5", accent: "#818cf8" },
  ember: { label: "Ember", primary: "#ef4444", secondary: "#dc2626", accent: "#f87171" },
  arctic: { label: "Arctic", primary: "#06b6d4", secondary: "#0891b2", accent: "#22d3ee" },
  lavender: { label: "Lavender", primary: "#a855f7", secondary: "#9333ea", accent: "#c084fc" },
  rose: { label: "Rose", primary: "#f43f5e", secondary: "#e11d48", accent: "#fb7185" },
}

export const TEMPLATE_OPTIONS = [
  {
    id: "minimal" as const,
    label: "Minimal",
    description: "Clean lines, generous whitespace, elegant sans-serif typography",
    preview: "light",
  },
  {
    id: "developer" as const,
    label: "Developer",
    description: "Terminal-inspired dark theme with monospace type and neon accents",
    preview: "dark",
  },
  {
    id: "creative" as const,
    label: "Creative",
    description: "Bold asymmetric layouts, large typography, expressive color blocks",
    preview: "colorful",
  },
  {
    id: "glassmorphism" as const,
    label: "Glass",
    description: "Frosted glass cards over subtle gradient backgrounds with blur",
    preview: "glass",
  },
  {
    id: "retro" as const,
    label: "Retro",
    description: "Pixel-inspired details, chunky borders, warm nostalgic palette",
    preview: "retro",
  },
  {
    id: "elegant" as const,
    label: "Elegant",
    description: "Serif headings, muted tones, editorial magazine-style layout",
    preview: "elegant",
  },
] as const

export const PORTFOLIO_SECTIONS = [
  { id: "about", label: "About Me" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
] as const

export type SectionId = (typeof PORTFOLIO_SECTIONS)[number]["id"]

export interface PortfolioConfig {
  template: TemplateStyle
  colorScheme: ColorScheme
  sections: SectionId[]
}

export interface GeneratedPortfolio {
  html: string
  title: string
}

export interface WizardState {
  step: number
  github: {
    username: string
    profile: GitHubProfile | null
    repos: GitHubRepo[]
    loading: boolean
    error: string | null
  }
  resume: {
    file: File | null
    text: string | null
    loading: boolean
    error: string | null
  }
  notion: {
    url: string
    content: string | null
    loading: boolean
    error: string | null
  }
  photo: {
    file: File | null
    dataUrl: string | null
  }
  config: PortfolioConfig
  portfolio: {
    html: string | null
    title: string | null
    loading: boolean
    error: string | null
  }
}

export type WizardAction =
  | { type: "SET_STEP"; step: number }
  | { type: "SET_GITHUB_USERNAME"; username: string }
  | { type: "SET_GITHUB_LOADING"; loading: boolean }
  | { type: "SET_GITHUB_DATA"; profile: GitHubProfile; repos: GitHubRepo[] }
  | { type: "SET_GITHUB_ERROR"; error: string }
  | { type: "CLEAR_GITHUB" }
  | { type: "SET_RESUME_FILE"; file: File }
  | { type: "SET_RESUME_LOADING"; loading: boolean }
  | { type: "SET_RESUME_TEXT"; text: string }
  | { type: "SET_RESUME_ERROR"; error: string }
  | { type: "CLEAR_RESUME" }
  | { type: "SET_NOTION_URL"; url: string }
  | { type: "SET_NOTION_LOADING"; loading: boolean }
  | { type: "SET_NOTION_CONTENT"; content: string }
  | { type: "SET_NOTION_ERROR"; error: string }
  | { type: "CLEAR_NOTION" }
  | { type: "SET_PHOTO"; file: File; dataUrl: string }
  | { type: "CLEAR_PHOTO" }
  | { type: "SET_CONFIG"; config: Partial<PortfolioConfig> }
  | { type: "TOGGLE_SECTION"; section: SectionId }
  | { type: "SET_PORTFOLIO_LOADING"; loading: boolean }
  | { type: "SET_PORTFOLIO"; html: string; title: string }
  | { type: "SET_PORTFOLIO_ERROR"; error: string }
  | { type: "CLEAR_PORTFOLIO" }
