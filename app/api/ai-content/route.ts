import type { EnrichedGitHubRepo, GitHubProfile, GitHubRepo, AIProject, AIGeneratedContent } from "@/lib/types"
import { enrichReposForAI } from "@/lib/github"
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
  debug?: boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  "vercel.app",
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
async function scrapeUrlOnce(url: string): Promise<string> {
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

async function scrapeUrl(url: string): Promise<string> {
  const delays = [0, 1000, 2000, 4000]

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt] > 0) {
      await sleep(delays[attempt])
    }

    const text = await scrapeUrlOnce(url)
    if (text) {
      return text
    }
  }

  return ""
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
            maxOutputTokens: 4096,
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

function extractJsonObject(text: string): string | null {
  const trimmed = text.trim()
  const start = trimmed.indexOf("{")
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < trimmed.length; index += 1) {
    const char = trimmed[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === "{") {
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        return trimmed.slice(start, index + 1)
      }
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    const data: AIContentRequest = await request.json()
    const {
      targetRole,
      externalLinks = [],
      github = { profile: null, repos: [] },
      resumeText = null,
      notionContent = null,
      additionalPrompt,
    } = data

    // targetRole is optional — if missing, AI generates based on repos/links alone
    const resolvedRole = targetRole?.trim() || "Software Developer"

    // Step 1: Scrape external links in parallel (max 5)
    const linksToScrape = externalLinks.slice(0, 5)
    const scrapedTexts = await Promise.all(linksToScrape.map(scrapeUrl))
    const scrapedContent = scrapedTexts.filter(Boolean).join("\n\n").substring(0, 4000)

    // Step 2: Prepare repo data for AI
    const reposForAI: EnrichedGitHubRepo[] = github.profile?.username
      ? await enrichReposForAI(github.profile.username, github.repos || [])
      : (github.repos || [])
          .filter((r) => !r.fork)
          .slice(0, 20)
          .map((r) => ({
            ...r,
            readmeText: "",
            detectedTech: "",
          }))

    const name = github.profile?.name || github.profile?.username || "User"
    const debugMode = Boolean((data as any)?.debug)

    // Step 3: Single Gemini call — personality-first approach
    // The scraped content is the PRIMARY signal for voice, tone, and personality.
    // Generic career bios are the failure mode we are explicitly avoiding.
     const systemPrompt = `You are a career copywriter who turns a candidate’s raw background into a human, professional portfolio narrative.

  Write the following for a portfolio website:

  1. About Me (3-4 sentences, first person):
    - Sound like a real person — warm, professional, and to the point.
    - Speak as the candidate using "I" / "my" / "me".
    - Highlight specific skills, technologies, or projects that define the candidate.
    - Frame the story around the target role; explain why they’re a great fit, not just what they’ve done.
    - Use plain English. If a 14-year-old wouldn’t understand a term, rephrase it.
    - Avoid empty buzzwords ("passionate", "dedicated") unless tied to a concrete achievement.

  2. Project descriptions (1-2 sentences per project):
    - Base them primarily on the project’s README or technical details, never on generic placeholders.
    - Say clearly what the project does, the core technology, and the real-world value.
    - For projects related to the target role, subtly connect them to the role’s requirements.
    - Use active voice and short, crisp sentences.

  3. Hero tagline (max 10 words):
    - A memorable, natural one-liner that captures the candidate’s professional identity.
    - e.g., “Full-stack developer building fast, accessible web apps.”

  Tone rules for everything you write:
  - Professional ≠ robotic. A human should enjoy reading it.
  - Specificity beats superlatives. Show what was done, don’t just call it amazing.
  - Simple language wins. Replace jargon with everyday words when possible.
  - If the candidate’s own writing (blog posts, LinkedIn, etc.) reveals a personal style, mirror it subtly.

  Return valid JSON only. No markdown. No code fences. No explanation outside the JSON.`

    const userPrompt = `You are building portfolio copy for ${name}, who is targeting the role: "${resolvedRole}".

  Use the system instructions exactly. The output must feel human, specific, and useful. Never default to generic summaries when the evidence supports a richer answer.

--- PERSONALITY SIGNALS (most important) ---
Read the content below carefully. Extract:
- Their writing style (casual? precise? humorous? blunt?)
- Recurring themes or interests (what do they keep coming back to?)
- Any strong opinions or stances they have
- How they describe their own work
- Their apparent values (speed, craft, open source, UX, etc.)
- Specific problems they seem to like solving
- The level of ambition in their work (small utilities, prototypes, production systems, research, infrastructure, etc.)
- Any repeated phrases, vocabulary, or tone cues that should influence the copy

Scraped from their links (LinkedIn, blog, Substack, etc.):
${scrapedContent || "None provided — rely on repos and resume instead."}

--- SUPPORTING SIGNALS ---
GitHub repos:
${JSON.stringify(reposForAI.map((r) => ({
  name: r.name,
  description: r.description || "",
  language: r.language || "",
  topics: r.topics || [],
  readmeText: (r.readmeText || "").substring(0, 500),
  detectedTech: r.detectedTech || "",
  stars: r.stargazers_count,
  forks: r.forks_count,
  url: r.html_url,
})), null, 2)}

Resume excerpt:
${resumeText?.substring(0, 3000) || "None"}

Notion content:
${notionContent?.substring(0, 2000) || "None"}

Additional instructions from the person:
${additionalPrompt || "None"}

--- QUALITY BAR ---
Write like you actually understand the person, not like you are filling a template.
Use concrete nouns, specific technologies, and real project details whenever possible.
Prefer phrasing that shows judgment, tradeoffs, or problem solving.
If the evidence is thin, make careful, grounded inferences instead of generic statements.

--- YOUR TASKS ---

1. PROJECT SELECTION & DESCRIPTIONS
   Pick up to 7 repos most relevant to "${resolvedRole}".
  For each, write a 2-4 sentence description that:
   - Highlights its relevance to the target role
  - Explains the problem it solves, the approach used, and why it matters
  - Uses language and framing consistent with how THIS PERSON talks about their work
  - Avoids generic phrases like "a full-stack app" or "built with React"
  - Includes at least one concrete detail from the README, repo description, detected tech, or scraped writing
  - If possible, mention scope, constraints, or impact (speed, reliability, simplicity, automation, maintainability, etc.)

2. ABOUT ME (3-4 sentences, first person)
  This is the most important field. Rules:
  - Mirror their actual writing style and tone from the scraped content
  - Make it feel grounded, intelligent, and human
  - Write in first person with natural confidence
  - Include 2-3 specific details across projects, technologies, or opinions
  - Show what problems they solve, not just what tools they use
  - Mention their likely strengths: judgment, speed, clarity, systems thinking, or craft
  - Do NOT use these banned phrases: "passionate about", "driven by", "dedicated to", "strong background in", "results-oriented", "leverages"
  - Sound like a person wrote this at 11pm, not a recruiter at 9am
  - It should read as a strong portfolio bio, not a placeholder summary

3. HERO TAGLINE (max 10 words, first person or noun phrase)
  Should feel like something this specific person would actually say.
  It should be specific, grounded, and memorable.
  Avoid: "Building the future", "Crafting experiences", "Turning ideas into reality", "Backend Developer — X"

4. WRITING STYLE
  Use simple English, but not childish English.
  Prefer concise sentences with punch.
  Vary sentence length so the copy feels natural.
  Do not repeat the same adjective across multiple projects.
  Make the descriptions feel like they were written by someone who built the thing, not someone summarizing it from a database.

5. OUTPUT DEPTH
  The about me section should feel complete and confident, not thin or placeholder-like.
  The project descriptions should sound like mini case studies, not labels.
  If the source material is strong, lean into concrete details and problem solving.

Return JSON in exactly this format:
{
  "projects": [
    {"name": "repo-name", "url": "https://github.com/...", "language": "JavaScript", "description": "...", "stars": 10, "forks": 2}
  ],
  "aboutMe": "...",
  "heroTagline": "..."
}`

    const aiResponse = await callGemini(userPrompt, systemPrompt, true)

    if (!aiResponse) {
      // Fallback: return repos as-is with default content
      const fallbackProjects: AIProject[] = reposForAI.slice(0, 7).map((r) => ({
        name: r.name,
        url: r.html_url,
        language: r.language,
        description: r.description || (r.readmeText ? r.readmeText.substring(0, 120) : `A ${r.detectedTech || r.language || "software"} project.`),
        stars: r.stargazers_count,
        forks: r.forks_count,
      }))

      const topLang = reposForAI[0]?.language || reposForAI[0]?.detectedTech || "software"
      const baseFallback = {
        projects: fallbackProjects,
        aboutMe: github.profile?.bio || `I work on ${topLang} projects and I’m currently targeting ${resolvedRole} roles.`,
        heroTagline: `${resolvedRole} — ${topLang}`,
      }

      if (debugMode) {
        return Response.json({
          ...baseFallback,
          debug: {
            geminiConfigured: GEMINI_KEYS.length > 0,
            reason: "aiResponse_missing_or_empty",
            scrapedContentLength: scrapedContent.length,
            reposCount: reposForAI.length,
            reposWithReadme: reposForAI.filter(r => (r as any).readmeText && (r as any).readmeText.length > 0).length,
            aiRaw: null
          }
        })
      }

      return Response.json(baseFallback)
    }

    // Parse AI response — strip markdown fences if Gemini wrapped the JSON
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    }

    const extractedJson = extractJsonObject(cleanedResponse)
    if (extractedJson) {
      cleanedResponse = extractedJson
    }

    try {
      const parsed = JSON.parse(cleanedResponse) as AIGeneratedContent

      // Validate and sanitize
      const projects: AIProject[] = (parsed.projects || []).slice(0, 7).map((p) => ({
        name: p.name || "Project",
        url: p.url || "#",
        language: p.language || null,
        description: p.description || "Open-source project. View on GitHub for details.",
        stars: typeof p.stars === "number" ? p.stars : 0,
        forks: typeof p.forks === "number" ? p.forks : 0,
      }))

      const base = {
        projects,
        aboutMe: parsed.aboutMe || `${name} is a ${resolvedRole} with diverse technical experience.`,
        heroTagline: parsed.heroTagline || resolvedRole,
      }

      if (debugMode) {
        return Response.json({
          ...base,
          debug: {
            geminiConfigured: GEMINI_KEYS.length > 0,
            reason: "aiResponse_parsed",
            scrapedContentLength: scrapedContent.length,
            reposCount: reposForAI.length,
            reposWithReadme: reposForAI.filter(r => (r as any).readmeText && (r as any).readmeText.length > 0).length,
            aiRaw: aiResponse?.substring(0, 2000) || null,
            extractedJsonLength: extractedJson?.length || 0
          }
        })
      }

      return Response.json(base)
    } catch {
      // JSON parse failed, return fallback
      const fallbackProjects: AIProject[] = reposForAI.slice(0, 7).map((r) => ({
        name: r.name,
        url: r.html_url,
        language: r.language,
        description: r.description || (r.readmeText ? r.readmeText.substring(0, 120) : `A ${r.detectedTech || r.language || "software"} project.`),
        stars: r.stargazers_count,
        forks: r.forks_count,
      }))

      const topLang2 = reposForAI[0]?.language || reposForAI[0]?.detectedTech || "software"
      const base2 = {
        projects: fallbackProjects,
        aboutMe: github.profile?.bio || `I build ${topLang2} projects and I’m currently seeking ${resolvedRole} roles.`,
        heroTagline: `${resolvedRole} — ${topLang2}`,
      }

      if (debugMode) {
        return Response.json({
          ...base2,
          debug: {
            geminiConfigured: GEMINI_KEYS.length > 0,
            reason: "aiResponse_parse_error",
            scrapedContentLength: scrapedContent.length,
            reposCount: reposForAI.length,
            reposWithReadme: reposForAI.filter(r => (r as any).readmeText && (r as any).readmeText.length > 0).length,
            aiRaw: aiResponse?.substring(0, 2000) || null,
            extractedJsonLength: extractedJson?.length || 0
          }
        })
      }

      return Response.json(base2)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate AI content"
    return Response.json({ error: message }, { status: 500 })
  }
}
