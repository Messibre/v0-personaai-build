import type { GitHubProfile, GitHubRepo, AIProject, AIGeneratedContent } from "@/lib/types"
import * as cheerio from "cheerio"

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[]

interface AIContentRequest {
  targetRole: string
  externalLinks: string[]
  github: {
    profile: GitHubProfile | null
    repos: GitHubRepo[]
  }
  resumeText: string | null
  notionContent: string | null
  additionalPrompt?: string
}

// Allowed domains for scraping (security: avoid SSRF)
const ALLOWED_DOMAINS = [
  "linkedin.com",
  "github.com",
  "medium.com",
  "dev.to",
  "hashnode.dev",
  "substack.com",
  "notion.so",
  "notion.site",
  "twitter.com",
  "x.com",
  "blog.",
  "portfolio.",
]

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    return ALLOWED_DOMAINS.some(
      (domain) => parsed.hostname.includes(domain) || parsed.hostname.endsWith(domain)
    )
  } catch {
    return false
  }
}

// Scrape text content from a URL
async function scrapeUrl(url: string): Promise<string> {
  if (!isAllowedUrl(url)) {
    return "" // Silently skip disallowed URLs
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      headers: {
        "User-Agent": "PersonaAI-Bot/1.0 (Portfolio Generator; +https://personaai.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) return ""

    const html = await res.text()
    const $ = cheerio.load(html)

    // Remove scripts, styles, nav, footer, etc.
    $("script, style, nav, footer, header, aside, iframe, noscript").remove()

    // Extract meaningful text
    const title = $("title").text().trim()
    const metaDesc = $('meta[name="description"]').attr("content") || ""
    const ogDesc = $('meta[property="og:description"]').attr("content") || ""

    // Get main content
    const mainContent =
      $("main").text() ||
      $("article").text() ||
      $('[role="main"]').text() ||
      $(".content").text() ||
      $("body").text()

    // Clean and truncate
    const text = [title, metaDesc, ogDesc, mainContent]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000)

    return text
  } catch {
    return ""
  }
}

// Call Gemini API with retry across multiple keys
async function callGemini(prompt: string, systemPrompt: string, expectJson = false): Promise<string | null> {
  if (GEMINI_KEYS.length === 0) return null

  for (const key of GEMINI_KEYS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            ...(expectJson && { responseMimeType: "application/json" }),
          },
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) continue
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (text && text.length > 10) return text
    } catch {
      continue
    }
  }
  return null
}

export async function POST(request: Request) {
  try {
    const data: AIContentRequest = await request.json()
    const { targetRole, externalLinks, github, resumeText, notionContent, additionalPrompt } = data

    if (!targetRole?.trim()) {
      return Response.json({ error: "Target role is required" }, { status: 400 })
    }

    // Step 1: Scrape external links in parallel (max 5)
    const linksToScrape = externalLinks.slice(0, 5)
    const scrapedTexts = await Promise.all(linksToScrape.map(scrapeUrl))
    const scrapedContent = scrapedTexts.filter(Boolean).join("\n\n").substring(0, 3000)

    // Step 2: Prepare repo data for AI
    const reposForAI = (github.repos || [])
      .filter((r) => !r.fork)
      .slice(0, 20)
      .map((r) => ({
        name: r.name,
        description: r.description || "",
        language: r.language || "",
        topics: r.topics || [],
        stars: r.stargazers_count,
        forks: r.forks_count,
        url: r.html_url,
      }))

    const name = github.profile?.name || github.profile?.username || "User"

    // Step 3: Single Gemini call for projects + aboutMe + tagline
    const systemPrompt = `You are a career content specialist. Output valid JSON only, no markdown, no code fences.`

    const userPrompt = `Given the following information:

Target Role: ${targetRole}

Name: ${name}

GitHub Repos (JSON):
${JSON.stringify(reposForAI, null, 2)}

Scraped Content from External Links (max 3000 chars):
${scrapedContent || "None provided"}

Resume Text (excerpt):
${resumeText?.substring(0, 1000) || "None provided"}

Notion Content (excerpt):
${notionContent?.substring(0, 500) || "None provided"}

Additional Instructions: ${additionalPrompt || "None"}

---

Task:
1. Choose up to 7 repositories most relevant to the target role "${targetRole}". For each, write a compelling 1-2 sentence description highlighting its relevance to the target role. If a repo has no description, infer one from its name, language, and topics.

2. Write a professional 3-4 sentence 'About Me' in third person, targeting the role "${targetRole}", based on all provided information. Sound like a real person, not a generic template. Use simple English.

3. Write a catchy 1-line hero tagline (max 10 words) that summarizes the person's expertise for the role "${targetRole}".

Return JSON in exactly this format:
{
  "projects": [
    {"name": "repo-name", "url": "https://github.com/...", "language": "JavaScript", "description": "Compelling description...", "stars": 10, "forks": 2}
  ],
  "aboutMe": "Professional bio text...",
  "heroTagline": "Catchy one-liner..."
}`

    const aiResponse = await callGemini(userPrompt, systemPrompt, true)

    if (!aiResponse) {
      // Fallback: return repos as-is with default content
      const fallbackProjects: AIProject[] = reposForAI.slice(0, 7).map((r) => ({
        name: r.name,
        url: r.url,
        language: r.language,
        description: r.description || `A ${r.language || "software"} project.`,
        stars: r.stars,
        forks: r.forks,
      }))

      return Response.json({
        projects: fallbackProjects,
        aboutMe: github.profile?.bio || `${name} is a professional specializing in ${targetRole}.`,
        heroTagline: targetRole,
      })
    }

    // Parse AI response
    try {
      const parsed = JSON.parse(aiResponse) as AIGeneratedContent

      // Validate and sanitize
      const projects: AIProject[] = (parsed.projects || []).slice(0, 7).map((p) => ({
        name: p.name || "Project",
        url: p.url || "#",
        language: p.language || null,
        description: p.description || "A software project.",
        stars: typeof p.stars === "number" ? p.stars : 0,
        forks: typeof p.forks === "number" ? p.forks : 0,
      }))

      return Response.json({
        projects,
        aboutMe: parsed.aboutMe || `${name} is a ${targetRole} with diverse technical experience.`,
        heroTagline: parsed.heroTagline || targetRole,
      })
    } catch {
      // JSON parse failed, return fallback
      const fallbackProjects: AIProject[] = reposForAI.slice(0, 7).map((r) => ({
        name: r.name,
        url: r.url,
        language: r.language,
        description: r.description || `A ${r.language || "software"} project.`,
        stars: r.stars,
        forks: r.forks,
      }))

      return Response.json({
        projects: fallbackProjects,
        aboutMe: github.profile?.bio || `${name} is a professional specializing in ${targetRole}.`,
        heroTagline: targetRole,
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate AI content"
    return Response.json({ error: message }, { status: 500 })
  }
}
