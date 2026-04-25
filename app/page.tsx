import { WizardShell } from "@/components/wizard/wizard-shell"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles, ArrowRight, Check, Github, FileText, Palette } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jade",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklch, var(--persona-accent) 15%, transparent), transparent)"
          }}
        />
        
        {/* Navigation */}
        <nav className="relative z-20 flex items-center justify-between px-4 sm:px-8 lg:px-12 py-4 sm:py-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-xl bg-[var(--persona-accent)] text-[var(--persona-bg)] shadow-lg shadow-[var(--persona-accent)]/20">
              <Sparkles className="size-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Persona<span className="text-[var(--persona-accent)]">AI</span>
            </span>
          </div>

          {/* Nav links - hidden on mobile */}
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="#templates" className="hover:text-foreground transition-colors">Templates</Link>
            <Link href="#examples" className="hover:text-foreground transition-colors">Examples</Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left side - Headline */}
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] text-balance animate-fade-in-up">
                Create a{" "}
                <span className="italic font-serif text-[var(--persona-accent)] relative">stunning</span>{" "}
                portfolio that gets you noticed
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed text-balance animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                Amazing Portfolio for Every Professional, Students, Solo Entrepreneurs, Freelancers, and More.
              </p>

              {/* Social proof */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center gap-3">
                  <Link href="#examples" className="text-sm font-medium text-[var(--persona-accent)] hover:underline underline-offset-4">
                    Show Examples
                  </Link>
                  {/* Avatar stack */}
                  <div className="flex -space-x-2">
                    {AVATARS.map((avatar, i) => (
                      <div 
                        key={i} 
                        className="size-8 rounded-full border-2 border-background bg-muted overflow-hidden"
                      >
                        <Image 
                          src={avatar} 
                          alt="" 
                          width={32} 
                          height={32}
                          className="size-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  Joined by 2,400+ creators
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-2 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">1,942</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Portfolios Generated</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">120</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Seconds to Create</div>
                </div>
              </div>
            </div>

            {/* Right side - Quick start card */}
            <div className="relative flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              {/* "try it" label */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2 text-muted-foreground">
                <span className="text-sm italic">try it</span>
                <ArrowRight className="size-4 animate-float" />
              </div>

              {/* Card */}
              <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-6 space-y-5">
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Sparkles className="size-3" />
                    AI-Powered
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    Get your portfolio in 120 sec
                  </h3>
                </div>

                {/* Data sources */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data Sources
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-secondary/50 border border-transparent hover:border-[var(--persona-accent)]/30 transition-colors cursor-default">
                      <Github className="size-5 text-foreground" />
                      <span className="text-xs text-muted-foreground">GitHub</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-secondary/50 border border-transparent hover:border-[var(--persona-accent)]/30 transition-colors cursor-default">
                      <FileText className="size-5 text-foreground" />
                      <span className="text-xs text-muted-foreground">Resume</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-secondary/50 border border-transparent hover:border-[var(--persona-accent)]/30 transition-colors cursor-default">
                      <Palette className="size-5 text-foreground" />
                      <span className="text-xs text-muted-foreground">Style</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>6 stunning templates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>Mobile-responsive design</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="size-4 text-green-500 shrink-0" />
                    <span>Export & deploy anywhere</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="#wizard"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[var(--persona-accent)] text-[var(--persona-bg)] font-semibold text-sm shadow-lg shadow-[var(--persona-accent)]/25 hover:shadow-xl hover:shadow-[var(--persona-accent)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <Sparkles className="size-4" />
                  Generate Portfolio
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Wizard Section */}
      <section id="wizard" className="px-4 pb-20 scroll-mt-8">
        <WizardShell />
      </section>

      {/* Examples Gallery */}
      <section id="examples" className="px-4 pb-16 sm:pb-24 scroll-mt-8">
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
