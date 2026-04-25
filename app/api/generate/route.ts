import { NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini"
import type { GitHubProfile, GitHubRepo, PortfolioConfig, ColorScheme } from "@/lib/types"
import { COLOR_SCHEMES } from "@/lib/types"

interface GenerateRequest {
  github: {
    profile: GitHubProfile
    repos: GitHubRepo[]
  }
  resumeText: string | null
  notionContent: string | null
  config: PortfolioConfig
  photoDataUrl: string | null
}

const TEMPLATE_INSTRUCTIONS: Record<string, string> = {
  minimal: `MINIMAL TEMPLATE:
- Light background (#fafafa or #ffffff), dark text
- Generous whitespace, at least 80px section padding
- Elegant sans-serif typography, restrained use of color only for accents and links
- Subtle hover effects (opacity changes, underlines)
- Clean card layouts with thin borders or subtle shadows
- Navigation: simple text links, sticky top bar with white background`,

  developer: `DEVELOPER TEMPLATE:
- Dark background (#0d1117 or #1a1b26), light text (#e6edf3)
- Monospace font for headings and code-like elements (use font-family: 'Courier New', monospace)
- Terminal/code-inspired aesthetic: cards look like code blocks with rounded corners
- Neon accent glow effects using box-shadow with the primary color
- Subtle grid or dot pattern background (use CSS repeating-linear-gradient)
- Navigation: terminal-style with > prefix or command palette look`,

  creative: `CREATIVE TEMPLATE:
- Bold, high-contrast design with large typography (hero heading 4rem+)
- Asymmetric layouts using CSS grid with overlapping elements
- Primary color used prominently in large blocks and backgrounds
- Dynamic hover effects (scale transforms, color shifts)
- Mixed font sizes for visual hierarchy
- Navigation: bold, playful, possibly vertical or unconventional placement`,

  glassmorphism: `GLASSMORPHISM TEMPLATE:
- Gradient background (use the primary and secondary colors in a 135deg gradient)
- Frosted glass cards: background rgba(255,255,255,0.08), backdrop-filter: blur(20px), border: 1px solid rgba(255,255,255,0.15)
- Soft shadows and rounded corners (16px+)
- Light text on the gradient background
- Floating, layered feel with subtle depth
- Navigation: glass-style bar with blur effect`,

  retro: `RETRO TEMPLATE:
- Warm cream/paper background (#fef9ef or #fffbeb)
- Chunky 3px+ borders, sharp corners mixed with rounded ones
- Pixel-art inspired decorative elements (use box-shadow pixel art technique for small accents)
- Bold, warm color palette based on provided colors
- Playful typography: mix of sans-serif and monospace
- Card style: thick colored borders, slight shadow offset (3px 3px 0)
- Navigation: tab-like buttons with thick bottom borders`,

  elegant: `ELEGANT TEMPLATE:
- Dark sophisticated background (#1c1917 or #18181b)
- Serif font for headings (Georgia, 'Times New Roman', serif), sans-serif for body
- Editorial/magazine-style layout with generous line-height (1.8)
- Muted, desaturated version of accent colors
- Thin elegant borders, letter-spacing on headings (0.05em)
- Subtle horizontal rules to separate sections
- Navigation: refined, small caps, widely spaced`,
}

function buildPrompt(data: GenerateRequest): string {
  const { github, resumeText, notionContent, config, photoDataUrl } = data
  const { profile, repos } = github
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]

  const topRepos = repos.slice(0, 8)
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))]
  const allTopics = [...new Set(repos.flatMap((r) => r.topics))]

  const templateInstructions = TEMPLATE_INSTRUCTIONS[config.template] || TEMPLATE_INSTRUCTIONS.developer

  let prompt = `You are an expert web developer and designer. Generate a complete, standalone HTML document for a personal portfolio website.

CRITICAL RULES:
1. Output ONLY the raw HTML document. No markdown fences (\`\`\`), no explanations, no comments before or after.
2. The HTML must be completely self-contained with ALL CSS in a <style> tag in the <head>.
3. Do NOT use any external CSS frameworks, CDNs, or JavaScript libraries.
4. Use system fonts only: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif (and monospace/serif variants as specified by template).
5. The page MUST be pixel-perfect on all screen sizes. Use these MANDATORY responsive techniques:
   - Mobile-first CSS (base styles for mobile, then @media (min-width: 768px) for tablet, @media (min-width: 1024px) for desktop)
   - Use CSS Grid or Flexbox with flex-wrap for all layouts
   - Navigation must collapse to a hamburger menu on mobile (implement with a checkbox hack - no JS libraries needed)
   - Images must use max-width: 100% and height: auto
   - Font sizes must use clamp() for fluid typography: e.g., font-size: clamp(1.5rem, 4vw, 3rem)
   - Horizontal padding: 1rem on mobile, 2rem on tablet, 4rem on desktop
   - Project cards: 1 column on mobile, 2 on tablet, 3 on desktop
6. Include smooth scroll behavior (html { scroll-behavior: smooth })
7. Use semantic HTML5 elements (header, nav, main, section, footer)
8. Make it visually impressive, professional, and production-ready

${templateInstructions}

COLOR SCHEME:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}
- Use these colors consistently for buttons, links, borders, and decorative elements

PERSON'S INFORMATION:
- Name: ${profile.name || profile.username}
- GitHub: ${profile.html_url}
- Username: ${profile.username}
${profile.bio ? `- Bio: ${profile.bio}` : ""}
${profile.location ? `- Location: ${profile.location}` : ""}
${profile.company ? `- Company: ${profile.company}` : ""}
${profile.blog ? `- Website: ${profile.blog}` : ""}
- GitHub Stats: ${profile.public_repos} repos, ${profile.followers} followers
`

  if (photoDataUrl) {
    prompt += `
PROFILE PHOTO:
The user has provided a profile photo. Embed it in the HTML using this exact data URL as the src attribute of an <img> tag:
${photoDataUrl}
Place the photo prominently in the hero/header section next to the name. Style it as a rounded image (border-radius: 50% for circular, or 16px for rounded rectangle) with a subtle border using the primary color. Size: approximately 120-160px on desktop, 80-100px on mobile.
`
  } else {
    prompt += `
PROFILE PHOTO:
Use the GitHub avatar from this URL: ${profile.avatar_url}
Place it in the hero/header section, styled as a rounded image with the primary color border.
`
  }

  prompt += `
TECHNICAL SKILLS (from GitHub):
- Languages: ${languages.join(", ") || "Not specified"}
- Topics/Technologies: ${allTopics.join(", ") || "Various"}

TOP PROJECTS (from GitHub):
${topRepos.map((r) => `- ${r.name}: ${r.description || "No description"} | Language: ${r.language || "Various"} | Stars: ${r.stargazers_count} | URL: ${r.html_url}${r.homepage ? ` | Live: ${r.homepage}` : ""}`).join("\n")}
`

  if (resumeText) {
    prompt += `
RESUME CONTENT (extract relevant experience, education, and skills):
${resumeText.substring(0, 4000)}
`
  }

  if (notionContent) {
    prompt += `
ADDITIONAL CONTENT FROM NOTION:
${notionContent.substring(0, 2000)}
`
  }

  prompt += `
SECTIONS TO INCLUDE (in this exact order):
${config.sections.map((s) => `- ${s}`).join("\n")}

SECTION REQUIREMENTS:
- "about": Write a compelling 2-3 paragraph professional bio. Include location, company if available.
- "skills": Create visual skill badges/pills using the languages and topics. Group by category (Languages, Frameworks, Tools).
- "projects": Create attractive project cards with name, description, language badge, star count, and link to GitHub. Add "Live Demo" link if homepage is available.
- "contact": GitHub link, blog/website if available, and a mailto link or contact section.
- "experience": Use resume data if available, otherwise create a timeline showing GitHub contributions and activity.
- "education": Use resume data if available, otherwise omit gracefully.

NAVIGATION: Include a fixed/sticky navigation bar at the top with smooth scroll links to each section.
HERO: Full-viewport-height hero section with name, tagline (derive from bio or create one), and a CTA button.
FOOTER: Simple footer with copyright and links.

Now generate the complete HTML document:`

  return prompt
}

export async function POST(request: Request) {
  try {
    const data: GenerateRequest = await request.json()

    if (!data.github?.profile) {
      return NextResponse.json(
        { error: "GitHub profile data is required" },
        { status: 400 }
      )
    }

    const prompt = buildPrompt(data)
    const rawResponse = await callGemini(prompt)

    // Strip markdown code fences if present
    let html = rawResponse.trim()
    if (html.startsWith("```html")) {
      html = html.slice(7)
    } else if (html.startsWith("```")) {
      html = html.slice(3)
    }
    if (html.endsWith("```")) {
      html = html.slice(0, -3)
    }
    html = html.trim()

    // Validate it looks like HTML
    if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
      if (html.includes("<head") || html.includes("<body")) {
        html = `<!DOCTYPE html>\n<html lang="en">\n${html}\n</html>`
      } else {
        return NextResponse.json(
          { error: "AI did not generate valid HTML. Please try again." },
          { status: 500 }
        )
      }
    }

    // Ensure viewport meta tag exists for responsive design
    if (!html.includes("viewport")) {
      html = html.replace(
        "<head>",
        '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">'
      )
    }

    const title = data.github.profile.name
      ? `${data.github.profile.name} - Portfolio`
      : `${data.github.profile.username} - Portfolio`

    return NextResponse.json({ html, title })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate portfolio"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
