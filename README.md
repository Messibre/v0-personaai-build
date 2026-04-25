# PersonaAI

**Generate stunning portfolio websites from your GitHub, resume, and Notion in seconds using AI.**

PersonaAI is an AI-powered portfolio generator that creates beautiful, responsive, and professional portfolio websites. Simply connect your GitHub profile, upload your resume, and let AI craft a personalized portfolio that showcases your work.

## Features

- **GitHub Integration** - Automatically fetches your profile, repositories, and contribution data
- **Resume Parsing** - Upload a PDF resume and extract skills, experience, and education
- **Notion Import** - Optionally import content from public Notion pages
- **6 Premium Templates** - Choose from professionally designed templates:
  - Bold Portrait - Full-screen photo with dramatic typography
  - Typographic - Oversized text with photo depth effects
  - Split Editorial - Magazine-style dark/light layout
  - Pastel Creative - Soft colors with playful card layouts
  - Designer & Coder - Split personality dual-theme design
  - Minimal Clean - Ultra-refined whitespace design
- **AI-Powered Generation** - Uses Google Gemini 2.5 Flash for intelligent content generation
- **Streaming Preview** - Watch your portfolio generate in real-time
- **Responsive Output** - All generated portfolios are mobile-first and fully responsive
- **Photo Upload** - Add your own photo for a personalized touch
- **Light/Dark Mode** - Full theme support for the app interface
- **Export Options** - Copy HTML, download as file, or open in v0

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **AI**: Vercel AI SDK + Google Gemini 2.5 Flash
- **PDF Parsing**: pdf-parse
- **Animations**: tw-animate-css
- **Theme**: next-themes

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Environment Variables

Create a `.env.local` file with:

```env
GEMINI_API_KEY_1=your_gemini_api_key
GEMINI_API_KEY_2=your_backup_gemini_api_key  # Optional, for failover
```

Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

```bash
# Clone the repository
git clone https://github.com/Messibre/v0-personaai-build.git
cd v0-personaai-build

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

1. **Enter GitHub Username** - We fetch your public profile and top repositories
2. **Upload Resume (Optional)** - PDF parsing extracts your professional background
3. **Add Notion URL (Optional)** - Import additional content from public Notion pages
4. **Customize** - Choose a template, color scheme, and toggle sections
5. **Generate** - AI creates a complete, standalone HTML portfolio
6. **Export** - Copy, download, or continue editing in v0

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── generate/      # AI portfolio generation endpoint
│   │   ├── github/        # GitHub API proxy
│   │   ├── notion/        # Notion content fetcher
│   │   └── parse-resume/  # PDF resume parser
│   ├── globals.css        # Tailwind + theme variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Landing page + hero
├── components/
│   ├── portfolio/         # Portfolio preview renderer
│   ├── ui/                # shadcn/ui components
│   └── wizard/            # Multi-step wizard components
├── lib/
│   ├── gemini.ts          # Gemini API client with key rotation
│   ├── github.ts          # GitHub API helpers
│   ├── types.ts           # TypeScript definitions
│   └── utils.ts           # Utility functions
└── public/
    └── icon.svg           # App favicon
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/github` | POST | Fetches GitHub profile and repositories |
| `/api/parse-resume` | POST | Parses PDF resume and extracts text |
| `/api/notion` | POST | Fetches public Notion page content |
| `/api/generate` | POST | Generates portfolio HTML using Gemini AI |

## Built with v0

This project was built with [v0](https://v0.app). You can continue developing by visiting:

[Continue working on v0](https://v0.app/chat/projects/prj_Qmv1tsUcl01qYd1V7dVb4tcibrTI)

## License

MIT

---

<a href="https://v0.app/chat/api/kiro/clone/Messibre/v0-personaai-build" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
