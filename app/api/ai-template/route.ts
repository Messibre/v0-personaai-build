import type { GitHubProfile, AIProject, SocialLinks } from "@/lib/types"

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[]

interface AITemplateRequest {
  targetRole: string
  name: string
  aboutMe: string
  heroTagline: string
  projects: AIProject[]
  skills: string[]
  photoUrl: string | null
  socialLinks: SocialLinks
  colorScheme: string
  refinementPrompt?: string // For chat-based refinement
  existingHtml?: string // For refinement
}

// Call Gemini API
async function callGemini(prompt: string, systemPrompt: string): Promise<string | null> {
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
            temperature: 0.8,
            maxOutputTokens: 8000,
          },
        }),
        signal: AbortSignal.timeout(30000), // 30s for template generation
      })

      if (!res.ok) continue
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (text && text.length > 100) return text
    } catch {
      continue
    }
  }
  return null
}

// Extract HTML from response (remove markdown code fences if present)
function extractHtml(response: string): string {
  // Remove markdown code fences
  let html = response
    .replace(/^```html?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  // Ensure it starts with DOCTYPE
  if (!html.toLowerCase().startsWith("<!doctype")) {
    const doctypeMatch = html.match(/<!DOCTYPE\s+html[^>]*>/i)
    if (doctypeMatch) {
      html = html.substring(html.indexOf(doctypeMatch[0]))
    }
  }

  return html
}

export async function POST(request: Request) {
  try {
    const data: AITemplateRequest = await request.json()
    const {
      targetRole,
      name,
      aboutMe,
      heroTagline,
      projects,
      skills,
      photoUrl,
      socialLinks,
      colorScheme,
      refinementPrompt,
      existingHtml,
    } = data

    if (!name?.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 })
    }

    const systemPrompt = `You are a world-class creative web designer. Output only raw HTML/CSS with inline styles. Never use markdown code fences. Never add explanations. Start directly with <!DOCTYPE html>.`

    let userPrompt: string

    if (refinementPrompt && existingHtml) {
      // Refinement mode: modify existing HTML
      userPrompt = `Here is the current HTML of a portfolio website:

${existingHtml}

User wants to refine it with this instruction: "${refinementPrompt}"

Apply the requested changes while keeping the overall structure and content intact. Output the complete modified HTML starting with <!DOCTYPE html>.`
    } else {
      // Generation mode: create new template
      const projectsHtml = projects
        .map(
          (p) => `
        - ${p.name}: ${p.description} (${p.language || "Various"}, ${p.stars} stars)
          URL: ${p.url}`
        )
        .join("\n")

      const socialLinksText = Object.entries(socialLinks || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")

      userPrompt = `Create a single-page portfolio website for a ${targetRole} named ${name}.

Content to include:

HERO SECTION:
- Name: ${name}
- Tagline: ${heroTagline}
- Photo URL: ${photoUrl || "Use a placeholder gradient circle"}
- CTA buttons: "View My Work" and "Contact Me"

ABOUT SECTION:
${aboutMe}

PROJECTS SECTION (show all):
${projectsHtml}

SKILLS:
${skills.join(", ") || "Various programming languages and frameworks"}

CONTACT SECTION:
- GitHub and social links: ${socialLinksText || "Include GitHub link"}

Design Requirements:
- Use ${colorScheme} as the primary color scheme accent
- Modern, original, visually stunning design
- Fully responsive (mobile-first)
- Smooth scroll navigation
- Subtle animations on scroll (use CSS animations or minimal JS)
- Use Google Fonts (Inter for body, plus one display font)
- Dark mode friendly
- Include proper meta tags for SEO
- Use inline CSS (no external stylesheets)
- Minimal JavaScript (only for smooth scroll and simple animations)

Output the complete HTML starting with <!DOCTYPE html>. Make it deployable as-is.`
    }

    const aiResponse = await callGemini(userPrompt, systemPrompt)

    if (!aiResponse) {
      return Response.json({ error: "Failed to generate template. Please try again." }, { status: 500 })
    }

    const html = extractHtml(aiResponse)

    // Validate it looks like HTML
    if (!html.toLowerCase().includes("<html") || !html.toLowerCase().includes("<body")) {
      return Response.json({ error: "Generated content is not valid HTML. Please try again." }, { status: 500 })
    }

    return Response.json({ html })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate template"
    return Response.json({ error: message }, { status: 500 })
  }
}
