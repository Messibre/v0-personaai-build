import { WizardShell } from "@/components/wizard/wizard-shell"
import { Sparkles } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Subtle glow effect */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, var(--persona-accent) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex flex-col items-center gap-4 px-4 pt-16 pb-10 sm:pt-20 sm:pb-12 text-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[var(--persona-accent)] text-[var(--persona-bg)]">
              <Sparkles className="size-5" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Persona<span className="text-[var(--persona-accent)]">AI</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed text-balance">
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
