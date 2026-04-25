import { streamText } from "ai"
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
  "bold-portrait": `BOLD PORTRAIT TEMPLATE (inspired by dramatic "Hello" hero portfolio):
HERO SECTION - This is the STAR of the design:
- Full viewport height hero (100vh) with the person's photo as a LARGE background element
- If a photo is provided, display it as a massive grayscale image taking up ~60% of the right side of the hero
  Use: filter: grayscale(100%); object-fit: cover; position: absolute; right: 0; top: 0; height: 100%; width: 55%;
- Overlay a semi-transparent gradient from left: background: linear-gradient(90deg, #111 40%, transparent 80%)
- Place a MASSIVE "Hello" or greeting text on the left side: font-size: clamp(4rem, 10vw, 8rem); font-weight: 900; color: white
- Below the greeting, a smaller tagline/bio: font-size: clamp(0.9rem, 2vw, 1.2rem); color: #aaa
- Animated stat counters in the left area: "+{repos} Projects" "+{followers} Followers" in the accent color
- Minimal navigation at the very top: logo/name on left, text links on right, all in white/gray
- "Scroll down" indicator at bottom center with a small arrow animation

OVERALL DESIGN:
- Background: #111111 (very dark, almost black) for all sections
- Text: white (#fff) for headings, #aaa for body, accent color for highlights
- Font: system sans-serif, very clean. Hero heading ultra-bold (900 weight)
- Section padding: 100px top/bottom minimum
- Cards: dark (#1a1a1a) with thin 1px borders (#333), rounded 12px
- Hover effects: subtle glow using box-shadow with accent color at 20% opacity
- Navigation: fixed, transparent initially, solid dark on scroll (use CSS only)
- On mobile: photo becomes a circular element above the text, stacked vertically`,

  "typographic": `TYPOGRAPHIC TEMPLATE (inspired by "Bazil" web designer portfolio):
HERO SECTION - Typography IS the design:
- Full viewport height, white/very light background (#fafafa)
- Place the person's photo as a LARGE centered image (grayscale), taking up the middle ~40% of the viewport
- CRITICAL EFFECT: Overlay MASSIVE typography ON TOP of the photo
  - The person's role/title in font-size: clamp(3.5rem, 9vw, 7rem); font-weight: 900; color: #111; mix-blend-mode: multiply
  - The text should literally overlap/intersect with the photo creating depth
  - Use position: relative and z-index to layer text above and behind the image
- Small intro text above: "Hi, my name is {name} and I am a" in smaller font with a wave emoji
- Client/tech logos or skill icons in a horizontal scroll bar at the bottom of the hero
- Two CTA buttons below: styled as clean bordered rectangles

OVERALL DESIGN:
- Background: #fafafa (off-white), nearly all sections light
- Text: #111 for headings, #666 for body text
- Font: system sans-serif, the hero title must be EXTREMELY large and bold
- Very generous whitespace everywhere - this is a whitespace-driven design
- Cards: white with very subtle shadows (0 2px 8px rgba(0,0,0,0.06))
- Section titles: large (clamp(2rem, 4vw, 3rem)), bold, simple
- On mobile: photo becomes a centered circle, text wraps naturally below
- Accent color used sparingly: only links, buttons, and small decorative elements`,

  "split-editorial": `SPLIT EDITORIAL TEMPLATE (inspired by "Amazing branding mock-up" portfolio):
HERO SECTION - Dramatic split layout:
- Full viewport height, split exactly 50/50 vertically
- LEFT HALF: Very dark (#111 or #0a0a0a) background
  - Person's photo displayed large, grayscale, positioned to bleed into the center
  - Numbered navigation on the left edge: "1/5" style, small, vertical
  - Photo should be: filter: grayscale(100%); object-fit: cover; height: 80%; width: 80%; positioned right-aligned within the left half
- RIGHT HALF: Very light (#f5f5f5 or white) background
  - Bold headline text stacked vertically: each word on its own line
  - font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.1; color: #111
  - Small body text below the headline in #888
  - A "Show more" or CTA link with the accent color

OVERALL DESIGN:
- This is an EDITORIAL, magazine-style design
- Alternating dark/light sections as you scroll down
- Typography: very intentional, large headings with tight line-height (1.1)
- Cards: clean, minimal borders, lots of breathing room
- Images in project cards should also use the grayscale + accent color hover technique
- Navigation: minimal, positioned at edges (left for section numbers, right for menu)
- Footer: split layout matching the hero
- On mobile: stack vertically - dark section on top, light below, full-width photo`,

  "pastel-creative": `PASTEL CREATIVE TEMPLATE (inspired by "Leslie" interaction designer portfolio):
HERO SECTION - Playful color blocks:
- Full viewport height with TWO color blocks stacked:
  - Top ~65%: soft pastel blue/teal (derive lighter tint from the primary color, around 80% lightness)
  - Bottom ~35%: soft pastel pink/rose (derive from accent color, around 85% lightness)
- Person's photo: displayed with a creative effect - placed where the two color blocks meet
  - Slightly overlapping both sections
  - Apply a soft shadow and slight rotation (transform: rotate(-2deg))
  - Photo cutout style: object-fit: cover; border-radius: 16px; width: 280px on desktop
- Text on the left of the hero:
  - "Hey there, I am {name}" intro
  - Bold role title: font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; color: #222
  - Clean body text in #555

OVERALL DESIGN:
- Playful, contemporary, approachable
- Background: alternating between soft pastels derived from the color scheme and white
- Cards: white with rounded corners (16px), soft shadows, on the pastel backgrounds
- Project cards displayed in a grid with hover effects: scale(1.03) + deeper shadow
- Typography: clean sans-serif, medium weight, friendly feel
- Accent color used for buttons, links, and small decorative elements
- On mobile: stack everything vertically, photo above text, full-width cards`,

  "designer-coder": `DESIGNER & CODER TEMPLATE (inspired by "Designer + <coder>" split portfolio):
HERO SECTION - Split personality:
- Full viewport height, split vertically:
  - LEFT HALF: light/white background representing "designer" side
    - Text: "designer" in large lowercase font-size: clamp(2rem, 5vw, 3rem); font-weight: 800
    - Small description: "UI/UX Designer with a passion for..." in #666
  - RIGHT HALF: dark (#2a2a2a) background representing "coder" side
    - Text: "<coder>" in monospace font, same size, in lighter color (#ccc)
    - Code snippets floating in background: small, rotated, low opacity code text
    - Description: "Developer who focuses on..." in #999
- CENTERPIECE: Person's photo placed RIGHT in the middle, overlapping both halves
  - Style the photo with a creative colorful effect:
  - Normal photo but add colorful paint-splash-like box-shadows:
    box-shadow: -20px -15px 0 #f59e0b, 20px 15px 0 #3b82f6, -15px 20px 0 #ef4444, 15px -20px 0 #22c55e;
  - Circular crop: border-radius: 50%; width: clamp(180px, 25vw, 280px)
- Navigation: centered logo at top, social icons

OVERALL DESIGN:
- The duality theme continues throughout the page
- Skills section split: "Design Tools" on light bg, "Dev Tools" on dark bg
- Project cards: alternate between light and dark backgrounds
- Use the accent color as a bridge color that appears on both sides
- Code elements use monospace font, design elements use sans-serif
- Subtle animations: code text slowly scrolling on the dark side background
- On mobile: stack with designer section on top, coder below, photo between them`,

  "minimal-clean": `MINIMAL CLEAN TEMPLATE (ultra-refined, whitespace-first):
HERO SECTION:
- Full viewport height, pure white (#ffffff) or near-white background
- Person's photo: small-to-medium circle (120-160px) centered, with thin 2px border in accent color
- Below photo: name in clean font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 600
- Below name: role/title in smaller muted text
- Very subtle grid or dot pattern in background (nearly invisible, #f8f8f8 dots)
- Simple CTA button: outlined style, rounded, small

OVERALL DESIGN:
- Maximum whitespace - this design breathes
- Background: pure white (#fff) for all sections
- Text: #222 for headings, #888 for body
- Cards: no background color, just thin bottom borders to separate items
- Section titles: font-size: clamp(1.25rem, 2.5vw, 1.75rem); font-weight: 600; letter-spacing: 0.02em
- Skills: simple text list or minimal pills (1px border, no fill)
- Projects: list-style layout with project name, description, and a small arrow link
- Navigation: ultra-minimal, name on left, 3-4 links on right, thin bottom border
- Accent color: used only for links and the photo border - very restrained
- Hover effects: only color change on links, no scale or shadow effects
- On mobile: same clean feel, just stacked, generous padding
- Footer: just a single line of text, centered`,
}

function buildPrompt(data: GenerateRequest): string {
  const { github, resumeText, notionContent, config, photoDataUrl } = data
  const { profile, repos } = github
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]

  const topRepos = repos.slice(0, 8)
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))]
  const allTopics = [...new Set(repos.flatMap((r) => r.topics))]

  const templateInstructions = TEMPLATE_INSTRUCTIONS[config.template] || TEMPLATE_INSTRUCTIONS["bold-portrait"]

  let prompt = `You are a world-class web developer and visual designer. Generate a complete, standalone HTML document for a stunning personal portfolio website.

CRITICAL OUTPUT RULES:
1. Output ONLY the raw HTML document. No markdown fences (\`\`\`), no explanations, no comments before or after.
2. The HTML must be completely self-contained with ALL CSS in a <style> tag in the <head>.
3. Do NOT use any external CSS frameworks, CDNs, or JavaScript libraries.
4. Use Google Fonts loaded via a <link> tag in <head> for better typography:
   - For bold/modern templates: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
   - For editorial templates: also include Playfair+Display:wght@400;700;900
   - Apply via font-family: 'Inter', sans-serif
5. The page MUST be fully responsive. Use these MANDATORY techniques:
   - Mobile-first CSS: base styles for mobile, @media (min-width: 768px) for tablet, @media (min-width: 1024px) for desktop
   - CSS Grid or Flexbox with flex-wrap for ALL layouts
   - Navigation MUST collapse to a hamburger menu on mobile using the checkbox hack (no JS):
     <input type="checkbox" id="nav-toggle" hidden>
     <label for="nav-toggle" class="hamburger">...</label>
     <nav class="nav-links">...</nav>
     With CSS: .nav-links { display: none; } #nav-toggle:checked ~ .nav-links { display: flex; }
   - All images: max-width: 100%; height: auto;
   - Font sizes: ALWAYS use clamp() for fluid typography
   - Padding: 1rem on mobile, 2rem on tablet, 4rem on desktop
   - Project grid: 1 column mobile, 2 tablet, 3 desktop
6. Include: html { scroll-behavior: smooth; }
7. Use semantic HTML5: header, nav, main, section, footer
8. Add subtle CSS animations: @keyframes fadeInUp, slideIn, etc. for sections appearing
9. Make it visually STUNNING - this should look like a real professional portfolio, not a template

${templateInstructions}

COLOR SCHEME TO USE:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}
- Use these colors consistently throughout for buttons, links, borders, decorative elements, and hover states
- Derive lighter/darker tints using opacity or CSS color-mix() where needed

PERSON'S DATA:
- Name: ${profile.name || profile.username}
- GitHub: ${profile.html_url}
- Username: ${profile.username}
${profile.bio ? `- Bio: ${profile.bio}` : ""}
${profile.location ? `- Location: ${profile.location}` : ""}
${profile.company ? `- Company: ${profile.company}` : ""}
${profile.blog ? `- Website: ${profile.blog}` : ""}
- Stats: ${profile.public_repos} repositories, ${profile.followers} followers, ${profile.following} following
`

  if (photoDataUrl) {
    prompt += `
PROFILE PHOTO (CRITICAL - embed this EXACT data URL):
The user uploaded a profile photo. You MUST embed it using this exact data URL as the src attribute:
${photoDataUrl}
Display it prominently in the hero section as described in the template instructions above.
Apply appropriate styling: object-fit: cover; and responsive sizing.
`
  } else {
    prompt += `
PROFILE PHOTO:
Use the GitHub avatar: ${profile.avatar_url}
Display it in the hero section following the template instructions.
`
  }

  prompt += `
TECHNICAL SKILLS (derived from GitHub repos):
- Languages: ${languages.join(", ") || "Not specified"}
- Topics/Technologies: ${allTopics.join(", ") || "Various"}

TOP PROJECTS:
${topRepos.map((r) => `- ${r.name}: ${r.description || "No description"} | ${r.language || "Various"} | ${r.stargazers_count} stars | ${r.html_url}${r.homepage ? ` | Live: ${r.homepage}` : ""}`).join("\n")}
`

  if (resumeText) {
    prompt += `
RESUME (extract experience, education, skills, certifications):
${resumeText.substring(0, 4000)}
`
  }

  if (notionContent) {
    prompt += `
ADDITIONAL CONTENT:
${notionContent.substring(0, 2000)}
`
  }

  prompt += `
SECTIONS TO GENERATE (in order):
${config.sections.map((s) => `- ${s}`).join("\n")}

SECTION GUIDELINES:
- "about": Compelling 2-3 paragraph professional bio. Include personality, not just facts.
- "skills": Visual skill display (badges, bars, or grouped pills). Group by: Languages, Frameworks, Tools.
- "projects": Attractive project cards with name, description, language badge, star count, GitHub link, and live demo link if available.
- "contact": GitHub link, website/blog if available, professional contact section.
- "experience": Use resume data if available, otherwise create a timeline from GitHub activity.
- "education": Use resume data if available, otherwise omit gracefully.

MUST INCLUDE:
- Fixed/sticky navigation with smooth scroll to sections
- Full-viewport hero section as described in the template
- Consistent section transitions and spacing
- Footer with copyright, social links
- CSS animations for scroll-reveal effects (use @keyframes and animation-delay)
- Proper aria-labels for accessibility

Generate the complete HTML document now:`

  return prompt
}

export async function POST(request: Request) {
  try {
    const data: GenerateRequest = await request.json()

    if (!data.github?.profile) {
      return Response.json(
        { error: "GitHub profile data is required" },
        { status: 400 }
      )
    }

    const prompt = buildPrompt(data)
    
    // Use Vercel AI SDK with streaming
    const result = streamText({
      model: "google/gemini-2.5-flash",
      prompt,
      maxOutputTokens: 16000,
    })

    // Return a streaming response
    return result.toTextStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate portfolio"
    return Response.json({ error: message }, { status: 500 })
  }
}
