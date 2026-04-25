import { WizardShell } from "@/components/wizard/wizard-shell"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Subtle glow effect */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, var(--persona-accent) 0%, transparent 70%)",
          }}
        />

        {/* Theme toggle - top right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="relative flex flex-col items-center gap-4 px-4 pt-16 pb-8 sm:pt-20 sm:pb-10 text-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5 animate-fade-in-up">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[var(--persona-accent)] text-[var(--persona-bg)] shadow-lg shadow-[var(--persona-accent)]/20">
              <Sparkles className="size-5" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Persona<span className="text-[var(--persona-accent)]">AI</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed text-balance animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Generate a stunning portfolio from your GitHub, resume, and Notion
            in seconds with AI.
          </p>
        </div>
      </header>

      {/* Wizard */}
      <section className="px-4 pb-20">
        <WizardShell />
      </section>
    </main>
  )
}
