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
}

function buildPrompt(data: GenerateRequest): string {
  const { github, resumeText, notionContent, config } = data
  const { profile, repos } = github
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]

  const topRepos = repos.slice(0, 8)
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))]
  const allTopics = [...new Set(repos.flatMap((r) => r.topics))]

  let prompt = `You are an expert web developer and designer. Generate a complete, standalone HTML document for a personal portfolio website.

IMPORTANT RULES:
- Output ONLY the HTML document, nothing else. No markdown fences, no explanations.
- The HTML must be completely self-contained with ALL CSS inline in a <style> tag.
- Do NOT use any external CSS frameworks, fonts CDNs, or JavaScript libraries.
- Use system fonts only: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- The design must be fully responsive (mobile-first).
- Include smooth scroll behavior.
- Use semantic HTML5 elements.
- Make it visually impressive and professional.

TEMPLATE STYLE: ${config.template.toUpperCase()}
${config.template === "minimal" ? "Clean, whitespace-focused, elegant typography, subtle animations, light background with strategic use of the primary color." : ""}
${config.template === "developer" ? "Dark theme with code-inspired aesthetics, monospace headings, terminal-like cards, subtle neon accent glows, dark background (#0d1117 or similar)." : ""}
${config.template === "creative" ? "Bold and expressive, asymmetric layouts, large typography, creative use of colors and shapes, dynamic visual hierarchy with the primary color prominently featured." : ""}

COLOR SCHEME:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}

PERSON'S INFORMATION:
- Name: ${profile.name || profile.username}
- GitHub: ${profile.html_url}
- Username: ${profile.username}
${profile.bio ? `- Bio: ${profile.bio}` : ""}
${profile.location ? `- Location: ${profile.location}` : ""}
${profile.company ? `- Company: ${profile.company}` : ""}
${profile.blog ? `- Website: ${profile.blog}` : ""}
- GitHub Stats: ${profile.public_repos} repos, ${profile.followers} followers

TECHNICAL SKILLS (from GitHub):
- Languages: ${languages.join(", ") || "Not specified"}
- Topics/Technologies: ${allTopics.join(", ") || "Various"}

TOP PROJECTS (from GitHub):
${topRepos.map((r) => `- ${r.name}: ${r.description || "No description"} (${r.language || "Various"}, ${r.stargazers_count} stars) - ${r.html_url}`).join("\n")}
`

  if (resumeText) {
    prompt += `
RESUME CONTENT:
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
SECTIONS TO INCLUDE (in this order):
${config.sections.map((s) => `- ${s}`).join("\n")}

For the "projects" section, create attractive project cards with the GitHub data provided.
For the "skills" section, create visual skill indicators using the languages and topics.
For the "contact" section, include links to GitHub and any other available contact info.
For the "about" section, write a compelling professional bio based on all available data.
For the "experience" section, use resume data if available, otherwise create a section based on GitHub activity.
For the "education" section, use resume data if available.

Include a navigation bar at the top with links to each section.
Include a hero/header section with the person's name and a tagline.

Generate the complete HTML document now:`

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
      // Try to wrap it if it's partial
      if (html.includes("<head") || html.includes("<body")) {
        html = `<!DOCTYPE html>\n<html lang="en">\n${html}\n</html>`
      } else {
        return NextResponse.json(
          { error: "AI did not generate valid HTML. Please try again." },
          { status: 500 }
        )
      }
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
