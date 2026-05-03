import type { GitHubProfile, GitHubRepo, PortfolioConfig, AIProject, AIGeneratedContent } from "@/lib/types"
import { buildPortfolioHtml } from "@/lib/templates"

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[]

interface GenerateRequest {
  github: {
    profile: GitHubProfile | null
    repos: GitHubRepo[]
  }
  resumeText: string | null
  notionContent: string | null
  config: PortfolioConfig
  photoDataUrl: string | null
  aiContent: AIGeneratedContent | null
  targetRole: string | null
}

async function getAiBio(profile: GitHubProfile, repos: GitHubRepo[], resumeText: string | null, notionContent: string | null, additionalPrompt?: string): Promise<string | null> {
  if (GEMINI_KEYS.length === 0) return null

  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))].slice(0, 6)
  const prompt = `Write a compelling 2-3 sentence professional bio for a developer portfolio. Be concise, confident, and write in first person.

Name: ${profile.name || profile.username}
Bio: ${profile.bio || "N/A"}
${profile.company ? `Role: ${profile.company}` : ""}
Languages: ${langs.join(", ") || "Various"}
Repos: ${profile.public_repos}
${resumeText ? `Resume excerpt: ${resumeText.substring(0, 3000)}` : ""}
${notionContent ? `Additional context: ${notionContent.substring(0, 2000)}` : ""}
${additionalPrompt ? `User instructions: ${additionalPrompt}` : ""}

Output ONLY the bio text, no quotes, no labels.`

  for (const key of GEMINI_KEYS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
        }),
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) continue
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (text && text.length > 20) return text
    } catch {
      continue
    }
  }
  return null
}

export async function POST(request: Request) {
  try {
    const data: GenerateRequest = await request.json()

    // Need at least a profile (from github, notion+manual, or manual)
    if (!data.github?.profile) {
      return Response.json({ error: "Profile data is required. Please go back and enter your info." }, { status: 400 })
    }

    // Use AI-generated content if available, otherwise fall back to generating a bio
    let aiBio: string | null = null
    let aiProjects: AIProject[] | null = null
    let heroTagline: string | null = null

    if (data.aiContent?.aboutMe) {
      aiBio = data.aiContent.aboutMe
      heroTagline = data.aiContent.heroTagline || null
      aiProjects = data.aiContent.projects || null
    } else {
      // Fall back to bio generation + build project descriptions from raw repo data
      // so the template never renders "A TypeScript project." placeholders
      aiBio = await getAiBio(data.github.profile, data.github.repos || [], data.resumeText, data.notionContent, data.config.additionalPrompt)
      aiProjects = (data.github.repos || [])
        .filter((r) => !r.fork)
        .slice(0, 7)
        .map((r) => ({
          name: r.name,
          url: r.html_url,
          language: r.language || null,
          description: r.description?.trim()
            || (r.topics?.length
              ? `A ${r.language || "software"} project focused on ${r.topics.slice(0, 2).join(" and ")}.`
              : `A ${r.language || "software"} project — click to view on GitHub.`),
          stars: r.stargazers_count,
          forks: r.forks_count,
        }))
    }

    const html = buildPortfolioHtml({
      profile: data.github.profile,
      repos: data.github.repos || [],
      resumeText: data.resumeText,
      notionContent: data.notionContent,
      config: data.config,
      photoUrl: data.photoDataUrl || null,
      aiBio,
      socialLinks: data.config.socialLinks,
      aiProjects,
      aiResume: data.aiContent?.resume || undefined,
      heroTagline,
      targetRole: data.targetRole,
    })

    return Response.json({ html, title: `${data.github.profile.name || data.github.profile.username} - Portfolio` })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate portfolio"
    return Response.json({ error: message }, { status: 500 })
  }
}
