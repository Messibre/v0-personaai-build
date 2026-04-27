import type { GitHubProfile, GitHubRepo, PortfolioConfig } from "@/lib/types"
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
}

async function getAiBio(profile: GitHubProfile, repos: GitHubRepo[], resumeText: string | null, notionContent: string | null, additionalPrompt?: string): Promise<string | null> {
  if (GEMINI_KEYS.length === 0) return null

  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))].slice(0, 6)
  const prompt = `Write a compelling 2-3 sentence professional bio for a developer portfolio. Be concise, confident, third-person.

Name: ${profile.name || profile.username}
Bio: ${profile.bio || "N/A"}
${profile.company ? `Role: ${profile.company}` : ""}
Languages: ${langs.join(", ") || "Various"}
Repos: ${profile.public_repos}
${resumeText ? `Resume excerpt: ${resumeText.substring(0, 500)}` : ""}
${notionContent ? `Additional context: ${notionContent.substring(0, 500)}` : ""}
${additionalPrompt ? `User instructions: ${additionalPrompt}` : ""}

Output ONLY the bio text, no quotes, no labels.`

  for (const key of GEMINI_KEYS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
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

    const aiBio = await getAiBio(data.github.profile, data.github.repos || [], data.resumeText, data.notionContent, data.config.additionalPrompt)

    const html = buildPortfolioHtml({
      profile: data.github.profile,
      repos: data.github.repos || [],
      resumeText: data.resumeText,
      notionContent: data.notionContent,
      config: data.config,
      photoUrl: data.photoDataUrl || null,
      aiBio,
      socialLinks: data.config.socialLinks,
    })

    return Response.json({ html, title: `${data.github.profile.name || data.github.profile.username} - Portfolio` })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate portfolio"
    return Response.json({ error: message }, { status: 500 })
  }
}
