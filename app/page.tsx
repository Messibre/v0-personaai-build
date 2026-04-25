import { WizardShell } from "@/components/wizard/wizard-shell"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles } from "lucide-react"
import Image from "next/image"

const EXAMPLE_PORTFOLIOS = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20260425_132300_338-iHWRiOPN7oiiaDBUXjcDTxGReKBzo8.jpg",
    alt: "Bold Portrait template - Hello hero design with large typography overlay",
    label: "Bold Portrait",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20260425_132300_147-G7tnz4jOQXTgtYf8tUNuvsIK9jjfJS.jpg",
    alt: "Typographic template - Oversized text with photo depth effect",
    label: "Typographic",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20260425_132300_299-2LbFYTPFXFFgrpcAzJvE3REdl7NfHM.jpg",
    alt: "Split Editorial template - Magazine style dark/light split layout",
    label: "Split Editorial",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20260425_132300_615-dAreLsgkXOvqmwRk33HdcUNK947NnT.jpg",
    alt: "Pastel Creative template - Soft colors with contemporary card design",
    label: "Pastel Creative",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_20260425_132259_890-EjaC1tHIX2LBu6Kr3tsFpgaa5mNhsK.jpg",
    alt: "Designer Coder template - Split personality creative developer design",
    label: "Designer & Coder",
  },
]

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

      {/* Examples Gallery */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Design Inspiration
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto text-balance">
              Our AI-powered templates are inspired by these stunning portfolio designs. Pick a style and make it yours.
            </p>
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {EXAMPLE_PORTFOLIOS.map((example, i) => (
              <div
                key={example.label}
                className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-[var(--persona-accent)]/5 hover:-translate-y-1 hover:border-[var(--persona-accent)]/30"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={example.src}
                    alt={example.alt}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="inline-block px-3 py-1.5 text-sm font-medium text-white bg-black/70 backdrop-blur-sm rounded-full">
                    {example.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-7 rounded-lg bg-[var(--persona-accent)] text-[var(--persona-bg)]">
                <Sparkles className="size-3.5" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                Persona<span className="text-[var(--persona-accent)]">AI</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Built with AI</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
