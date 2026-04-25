import type { GitHubProfile, GitHubRepo, PortfolioConfig } from "@/lib/types"
import { buildPortfolioHtml } from "@/lib/templates"

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[]

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

// Try to get a short AI-generated bio (non-blocking, fast)
async function getAiBio(profile: GitHubProfile, repos: GitHubRepo[], resumeText: string | null): Promise<string | null> {
  if (GEMINI_KEYS.length === 0) return null

  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))].slice(0, 6)
  const prompt = `Write a compelling 2-3 sentence professional bio for a developer portfolio. Be concise, confident, third-person.

Name: ${profile.name || profile.username}
Bio: ${profile.bio || "N/A"}
Languages: ${langs.join(", ") || "Various"}
Repos: ${profile.public_repos}
${resumeText ? `Resume excerpt: ${resumeText.substring(0, 500)}` : ""}

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
        signal: AbortSignal.timeout(8000), // 8 second timeout
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

    if (!data.github?.profile) {
      return Response.json({ error: "GitHub profile data is required" }, { status: 400 })
    }

    // Generate AI bio in the background (best-effort, fast timeout)
    const aiBio = await getAiBio(data.github.profile, data.github.repos, data.resumeText)

    // Build HTML instantly from pre-built templates
    const html = buildPortfolioHtml({
      profile: data.github.profile,
      repos: data.github.repos,
      resumeText: data.resumeText,
      notionContent: data.notionContent,
      config: data.config,
      photoUrl: data.photoDataUrl || null,
      aiBio,
    })

    return Response.json({ html, title: `${data.github.profile.name || data.github.profile.username} - Portfolio` })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate portfolio"
    return Response.json({ error: message }, { status: 500 })
  }
}
