import type { GitHubProfile, GitHubRepo, PortfolioConfig, ColorScheme } from "./types"
import { COLOR_SCHEMES } from "./types"

interface TemplateData {
  profile: GitHubProfile
  repos: GitHubRepo[]
  resumeText: string | null
  notionContent: string | null
  config: PortfolioConfig
  photoUrl: string | null
  aiBio: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function getLanguages(repos: GitHubRepo[]): string[] {
  return [...new Set(repos.map((r) => r.language).filter(Boolean))] as string[]
}

function getTopics(repos: GitHubRepo[]): string[] {
  return [...new Set(repos.flatMap((r) => r.topics).filter(Boolean))]
}

function buildSkillBadges(languages: string[], topics: string[], accent: string): string {
  const all = [...languages, ...topics].slice(0, 12)
  return all
    .map(
      (s) =>
        `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:500;border:1px solid ${accent}33;color:${accent};margin:4px;background:${accent}0D;transition:all .3s">${escapeHtml(s)}</span>`
    )
    .join("")
}

function buildProjectCards(repos: GitHubRepo[], colors: { primary: string; accent: string }, dark: boolean): string {
  const topRepos = repos.filter((r) => !r.fork).slice(0, 6)
  const bg = dark ? "#1a1a1a" : "#ffffff"
  const border = dark ? "#333" : "#e5e5e5"
  const textColor = dark ? "#e5e5e5" : "#333"
  const mutedColor = dark ? "#999" : "#666"

  return topRepos
    .map(
      (r) => `
      <div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:24px;transition:all .3s;position:relative;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <h3 style="font-size:18px;font-weight:700;color:${textColor};margin:0">${escapeHtml(r.name)}</h3>
          ${r.stargazers_count > 0 ? `<span style="font-size:12px;color:${colors.accent};font-weight:600">&#9733; ${r.stargazers_count}</span>` : ""}
        </div>
        <p style="font-size:14px;color:${mutedColor};margin:0 0 16px 0;line-height:1.6">${escapeHtml(r.description || "No description provided")}</p>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          ${r.language ? `<span style="font-size:12px;padding:3px 10px;border-radius:12px;background:${colors.accent}1A;color:${colors.accent};font-weight:500">${escapeHtml(r.language)}</span>` : ""}
          <a href="${r.html_url}" target="_blank" rel="noopener" style="font-size:13px;color:${colors.accent};text-decoration:none;font-weight:500;margin-left:auto">View Code &rarr;</a>
          ${r.homepage ? `<a href="${r.homepage}" target="_blank" rel="noopener" style="font-size:13px;color:${mutedColor};text-decoration:none;font-weight:500">Live Demo &rarr;</a>` : ""}
        </div>
      </div>`
    )
    .join("")
}

function buildNav(name: string, sections: string[], dark: boolean, accent: string): string {
  const bg = dark ? "rgba(17,17,17,0.95)" : "rgba(255,255,255,0.95)"
  const textColor = dark ? "#e5e5e5" : "#333"
  return `
  <input type="checkbox" id="nav-toggle" hidden>
  <header style="position:fixed;top:0;left:0;right:0;z-index:1000;background:${bg};backdrop-filter:blur(12px);border-bottom:1px solid ${dark ? "#222" : "#eee"};padding:0 24px">
    <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px">
      <a href="#" style="font-size:20px;font-weight:800;color:${accent};text-decoration:none">${escapeHtml(name)}</a>
      <label for="nav-toggle" style="display:none;cursor:pointer;flex-direction:column;gap:5px;padding:8px" class="hamburger">
        <span style="display:block;width:24px;height:2px;background:${textColor};transition:all .3s"></span>
        <span style="display:block;width:24px;height:2px;background:${textColor};transition:all .3s"></span>
        <span style="display:block;width:18px;height:2px;background:${textColor};transition:all .3s"></span>
      </label>
      <nav class="nav-links" style="display:flex;align-items:center;gap:28px">
        ${sections.map((s) => `<a href="#${s}" style="font-size:14px;color:${textColor};text-decoration:none;font-weight:500;transition:color .3s">${s.charAt(0).toUpperCase() + s.slice(1)}</a>`).join("")}
      </nav>
    </div>
  </header>`
}

function buildFooter(profile: GitHubProfile, accent: string, dark: boolean): string {
  const bg = dark ? "#0a0a0a" : "#f5f5f5"
  const textColor = dark ? "#888" : "#666"
  return `
  <footer style="background:${bg};padding:40px 24px;text-align:center;border-top:1px solid ${dark ? "#222" : "#eee"}">
    <div style="max-width:1200px;margin:0 auto">
      <p style="font-size:13px;color:${textColor};margin:0">
        &copy; ${new Date().getFullYear()} ${escapeHtml(profile.name || profile.username)}. Built with
        <a href="https://personaai.dev" target="_blank" rel="noopener" style="color:${accent};text-decoration:none;font-weight:600"> PersonaAI</a>
      </p>
    </div>
  </footer>`
}

function buildAboutSection(profile: GitHubProfile, aiBio: string | null, resumeText: string | null, dark: boolean, accent: string): string {
  const textColor = dark ? "#e5e5e5" : "#333"
  const mutedColor = dark ? "#aaa" : "#666"
  const bio = aiBio || profile.bio || "A passionate developer building amazing things."
  const bgColor = dark ? "#111" : "#fff"

  return `
  <section id="about" style="padding:80px 24px;background:${bgColor}">
    <div style="max-width:900px;margin:0 auto">
      <h2 style="font-size:clamp(1.5rem,3vw,2.2rem);font-weight:800;color:${textColor};margin:0 0 24px 0">About Me</h2>
      <p style="font-size:17px;line-height:1.8;color:${mutedColor};margin:0 0 16px 0">${escapeHtml(bio)}</p>
      ${profile.location ? `<p style="font-size:14px;color:${accent};margin:0 0 8px 0">&#128205; ${escapeHtml(profile.location)}</p>` : ""}
      ${profile.company ? `<p style="font-size:14px;color:${mutedColor};margin:0">&#127970; ${escapeHtml(profile.company)}</p>` : ""}
    </div>
  </section>`
}

function buildContactSection(profile: GitHubProfile, dark: boolean, accent: string): string {
  const textColor = dark ? "#e5e5e5" : "#333"
  const mutedColor = dark ? "#aaa" : "#666"
  const bgColor = dark ? "#0d0d0d" : "#fafafa"

  return `
  <section id="contact" style="padding:80px 24px;background:${bgColor}">
    <div style="max-width:900px;margin:0 auto;text-align:center">
      <h2 style="font-size:clamp(1.5rem,3vw,2.2rem);font-weight:800;color:${textColor};margin:0 0 16px 0">Get In Touch</h2>
      <p style="font-size:16px;color:${mutedColor};margin:0 0 32px 0">Interested in working together? Let&rsquo;s connect.</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
        <a href="${profile.html_url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:${accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;transition:all .3s">GitHub Profile</a>
        ${profile.blog ? `<a href="${profile.blog.startsWith("http") ? profile.blog : "https://" + profile.blog}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border:2px solid ${accent};color:${accent};text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;transition:all .3s">Website</a>` : ""}
      </div>
    </div>
  </section>`
}

function commonStyles(accent: string): string {
  return `
    html { scroll-behavior: smooth; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow-x: hidden; }
    img { max-width: 100%; height: auto; }
    a { transition: opacity .3s; }
    a:hover { opacity: 0.8; }

    @media (max-width: 768px) {
      .hamburger { display: flex !important; }
      .nav-links { 
        display: none !important; 
        position: fixed; top: 64px; left: 0; right: 0; 
        background: inherit; flex-direction: column; 
        padding: 24px; gap: 20px !important; 
        border-bottom: 1px solid #333;
      }
      #nav-toggle:checked ~ .nav-links { display: flex !important; }
      .hero-split { flex-direction: column !important; }
      .hero-photo { 
        position: relative !important; width: 100% !important; 
        height: 300px !important; right: auto !important; 
      }
      .hero-text { padding: 40px 24px !important; }
      .project-grid { grid-template-columns: 1fr !important; }
      .skills-wrap { justify-content: center; }
      .stat-row { flex-direction: column; gap: 16px !important; }
    }

    @keyframes fadeInUp { 
      from { opacity: 0; transform: translateY(30px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .anim { animation: fadeInUp 0.6s ease-out both; }
    .anim-d1 { animation-delay: 0.1s; }
    .anim-d2 { animation-delay: 0.2s; }
    .anim-d3 { animation-delay: 0.3s; }
    .anim-d4 { animation-delay: 0.4s; }
  `
}

/* ========== TEMPLATE BUILDERS ========== */

function buildBoldPortrait(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio, resumeText } = data
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLanguages(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const imgSrc = photoUrl || profile.avatar_url

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} - Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
${commonStyles(colors.accent)}
body { background: #111; color: #e5e5e5; }
.hero { height: 100vh; position: relative; display: flex; align-items: center; overflow: hidden; }
.hero-photo { position: absolute; right: 0; top: 0; width: 55%; height: 100%; object-fit: cover; filter: grayscale(100%); opacity: 0.7; }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, #111 35%, transparent 80%); }
.hero-content { position: relative; z-index: 2; padding: 0 6vw; max-width: 600px; }
.hero h1 { font-size: clamp(3rem, 8vw, 6rem); font-weight: 900; line-height: 1; margin-bottom: 16px; color: #fff; }
.hero p { font-size: clamp(0.9rem, 1.5vw, 1.1rem); color: #aaa; line-height: 1.6; margin-bottom: 32px; }
.stat-row { display: flex; gap: 40px; }
.stat { text-align: left; }
.stat-num { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: ${colors.accent}; }
.stat-label { font-size: 13px; color: #888; margin-top: 4px; }
.section { padding: 80px 24px; }
.container { max-width: 1100px; margin: 0 auto; }
.section-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #fff; margin-bottom: 40px; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.project-grid > div:hover { border-color: ${colors.accent}44; box-shadow: 0 0 20px ${colors.accent}15; transform: translateY(-2px); }
@media (max-width: 768px) {
  .hero-photo { position: relative; width: 100%; height: 280px; border-radius: 0; opacity: 0.5; }
  .hero { flex-direction: column; height: auto; min-height: 100vh; }
  .hero-overlay { background: linear-gradient(180deg, transparent 0%, #111 60%); }
  .hero-content { padding: 40px 24px; }
}
</style>
</head>
<body>
${buildNav(name, config.sections, true, colors.accent)}
<div class="hero">
  <img src="${imgSrc}" alt="${escapeHtml(name)}" class="hero-photo anim" crossorigin="anonymous">
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h1 class="anim">Hello</h1>
    <p class="anim anim-d1">${escapeHtml(profile.bio || `I'm ${name}, a developer building great things.`)}</p>
    <div class="stat-row anim anim-d2">
      <div class="stat"><div class="stat-num">+${profile.public_repos}</div><div class="stat-label">Projects</div></div>
      <div class="stat"><div class="stat-num">+${profile.followers}</div><div class="stat-label">Followers</div></div>
      <div class="stat"><div class="stat-num">${langs.length}</div><div class="stat-label">Languages</div></div>
    </div>
  </div>
</div>
<main>
${config.sections.includes("about") ? buildAboutSection(profile, aiBio, resumeText, true, colors.accent) : ""}
${config.sections.includes("skills") ? `
<section id="skills" class="section" style="background:#0d0d0d">
  <div class="container">
    <h2 class="section-title">Skills & Technologies</h2>
    <div class="skills-wrap" style="display:flex;flex-wrap:wrap;gap:0">${buildSkillBadges(langs, topics, colors.accent)}</div>
  </div>
</section>` : ""}
${config.sections.includes("projects") ? `
<section id="projects" class="section" style="background:#111">
  <div class="container">
    <h2 class="section-title">Featured Projects</h2>
    <div class="project-grid">${buildProjectCards(repos, colors, true)}</div>
  </div>
</section>` : ""}
${config.sections.includes("contact") ? buildContactSection(profile, true, colors.accent) : ""}
</main>
${buildFooter(profile, colors.accent, true)}
</body>
</html>`
}

function buildTypographic(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio, resumeText } = data
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLanguages(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const imgSrc = photoUrl || profile.avatar_url
  const role = langs.length > 0 ? `${langs[0]} Developer` : "Developer"

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} - Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
${commonStyles(colors.accent)}
body { background: #fafafa; color: #333; }
.hero { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 24px; }
.hero-photo { width: clamp(200px, 30vw, 320px); height: clamp(200px, 30vw, 320px); border-radius: 50%; object-fit: cover; filter: grayscale(80%); position: relative; z-index: 1; }
.hero-title { position: absolute; font-size: clamp(3rem, 10vw, 8rem); font-weight: 900; color: #111; z-index: 2; mix-blend-mode: multiply; text-align: center; line-height: 0.95; pointer-events: none; }
.hero-sub { margin-top: 24px; font-size: clamp(0.85rem, 1.5vw, 1rem); color: #888; text-align: center; z-index: 3; position: relative; }
.section { padding: 80px 24px; }
.container { max-width: 1000px; margin: 0 auto; }
.section-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #111; margin-bottom: 40px; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.project-grid > div:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
@media (max-width: 768px) {
  .hero-title { font-size: clamp(2.5rem, 14vw, 4rem); }
  .hero-photo { width: 180px; height: 180px; }
}
</style>
</head>
<body>
${buildNav(name, config.sections, false, colors.accent)}
<div class="hero">
  <span class="hero-sub anim" style="margin-bottom:12px">Hi, my name is ${escapeHtml(name)} and I am a</span>
  <img src="${imgSrc}" alt="${escapeHtml(name)}" class="hero-photo anim anim-d1" crossorigin="anonymous">
  <div class="hero-title anim anim-d2">${escapeHtml(role)}</div>
  <span class="hero-sub anim anim-d3">${escapeHtml(profile.location || "")}</span>
</div>
<main>
${config.sections.includes("about") ? buildAboutSection(profile, aiBio, resumeText, false, colors.accent) : ""}
${config.sections.includes("skills") ? `
<section id="skills" class="section" style="background:#f0f0f0">
  <div class="container">
    <h2 class="section-title">Skills</h2>
    <div class="skills-wrap" style="display:flex;flex-wrap:wrap;gap:0">${buildSkillBadges(langs, topics, colors.accent)}</div>
  </div>
</section>` : ""}
${config.sections.includes("projects") ? `
<section id="projects" class="section" style="background:#fafafa">
  <div class="container">
    <h2 class="section-title">Projects</h2>
    <div class="project-grid">${buildProjectCards(repos, colors, false)}</div>
  </div>
</section>` : ""}
${config.sections.includes("contact") ? buildContactSection(profile, false, colors.accent) : ""}
</main>
${buildFooter(profile, colors.accent, false)}
</body>
</html>`
}

function buildSplitEditorial(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio, resumeText } = data
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLanguages(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const imgSrc = photoUrl || profile.avatar_url

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} - Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
<style>
${commonStyles(colors.accent)}
body { background: #111; color: #e5e5e5; }
.hero { height: 100vh; display: flex; }
.hero-dark { flex: 1; background: #0a0a0a; display: flex; align-items: center; justify-content: flex-end; padding: 40px; position: relative; overflow: hidden; }
.hero-dark img { width: 80%; max-width: 400px; height: 80%; object-fit: cover; filter: grayscale(100%); border-radius: 4px; }
.hero-light { flex: 1; background: #f5f5f5; display: flex; flex-direction: column; justify-content: center; padding: 60px; }
.hero-light h1 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 900; line-height: 1.1; color: #111; margin-bottom: 24px; }
.hero-light p { font-size: 15px; color: #888; line-height: 1.7; margin-bottom: 24px; }
.hero-light a { color: ${colors.accent}; text-decoration: none; font-weight: 600; font-size: 14px; }
.section { padding: 80px 24px; }
.container { max-width: 1100px; margin: 0 auto; }
.section-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; margin-bottom: 40px; }
.section-dark { background: #111; color: #e5e5e5; }
.section-dark .section-title { color: #fff; }
.section-light { background: #f5f5f5; color: #333; }
.section-light .section-title { color: #111; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.project-grid > div:hover { transform: translateY(-2px); }
@media (max-width: 768px) {
  .hero { flex-direction: column; height: auto; }
  .hero-dark { min-height: 300px; justify-content: center; }
  .hero-dark img { width: 60%; height: auto; aspect-ratio: 3/4; }
  .hero-light { padding: 40px 24px; }
}
</style>
</head>
<body>
${buildNav(name, config.sections, true, colors.accent)}
<div class="hero hero-split">
  <div class="hero-dark"><img src="${imgSrc}" alt="${escapeHtml(name)}" class="anim" crossorigin="anonymous"></div>
  <div class="hero-light">
    <h1 class="anim anim-d1">${escapeHtml(name)}<br>Portfolio</h1>
    <p class="anim anim-d2">${escapeHtml(profile.bio || "Building amazing digital experiences.")}</p>
    <a href="#projects" class="anim anim-d3">View Projects &darr;</a>
  </div>
</div>
<main>
${config.sections.includes("about") ? `<div class="section-light">${buildAboutSection(profile, aiBio, resumeText, false, colors.accent)}</div>` : ""}
${config.sections.includes("skills") ? `
<section id="skills" class="section section-dark">
  <div class="container">
    <h2 class="section-title">Expertise</h2>
    <div class="skills-wrap" style="display:flex;flex-wrap:wrap;gap:0">${buildSkillBadges(langs, topics, colors.accent)}</div>
  </div>
</section>` : ""}
${config.sections.includes("projects") ? `
<section id="projects" class="section section-light">
  <div class="container">
    <h2 class="section-title" style="color:#111">Projects</h2>
    <div class="project-grid">${buildProjectCards(repos, colors, false)}</div>
  </div>
</section>` : ""}
${config.sections.includes("contact") ? buildContactSection(profile, true, colors.accent) : ""}
</main>
${buildFooter(profile, colors.accent, true)}
</body>
</html>`
}

function buildPastelCreative(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio, resumeText } = data
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLanguages(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const imgSrc = photoUrl || profile.avatar_url

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} - Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
${commonStyles(colors.accent)}
body { background: #fafafa; color: #333; }
.hero { min-height: 100vh; display: flex; align-items: center; position: relative; overflow: hidden; }
.hero-bg-top { position: absolute; top: 0; left: 0; right: 0; height: 65%; background: ${colors.primary}22; }
.hero-bg-bot { position: absolute; bottom: 0; left: 0; right: 0; height: 35%; background: ${colors.accent}15; }
.hero-inner { position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; padding: 100px 24px 60px; display: flex; align-items: center; gap: 60px; width: 100%; }
.hero-text { flex: 1; }
.hero-text h1 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; color: #222; line-height: 1.2; margin-bottom: 16px; }
.hero-text p { font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 24px; }
.hero-img { width: clamp(200px, 25vw, 300px); height: clamp(250px, 30vw, 380px); object-fit: cover; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); transform: rotate(-2deg); }
.section { padding: 80px 24px; }
.container { max-width: 1100px; margin: 0 auto; }
.section-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #222; margin-bottom: 40px; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.project-grid > div:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
@media (max-width: 768px) {
  .hero-inner { flex-direction: column-reverse; padding-top: 100px; gap: 32px; text-align: center; }
  .hero-img { width: 200px; height: 240px; transform: rotate(0); }
}
</style>
</head>
<body>
${buildNav(name, config.sections, false, colors.accent)}
<div class="hero">
  <div class="hero-bg-top"></div>
  <div class="hero-bg-bot"></div>
  <div class="hero-inner">
    <div class="hero-text">
      <p class="anim" style="font-size:14px;color:${colors.accent};font-weight:600;margin-bottom:8px">Hey there, I am</p>
      <h1 class="anim anim-d1">${escapeHtml(name)}</h1>
      <p class="anim anim-d2">${escapeHtml(profile.bio || "A creative developer making beautiful digital experiences.")}</p>
      <a href="#projects" class="anim anim-d3" style="display:inline-block;padding:12px 32px;background:${colors.accent};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">View Projects</a>
    </div>
    <img src="${imgSrc}" alt="${escapeHtml(name)}" class="hero-img anim anim-d2" crossorigin="anonymous">
  </div>
</div>
<main>
${config.sections.includes("about") ? buildAboutSection(profile, aiBio, resumeText, false, colors.accent) : ""}
${config.sections.includes("skills") ? `
<section id="skills" class="section" style="background:${colors.primary}0A">
  <div class="container">
    <h2 class="section-title">Skills</h2>
    <div class="skills-wrap" style="display:flex;flex-wrap:wrap;gap:0">${buildSkillBadges(langs, topics, colors.accent)}</div>
  </div>
</section>` : ""}
${config.sections.includes("projects") ? `
<section id="projects" class="section">
  <div class="container">
    <h2 class="section-title">Projects</h2>
    <div class="project-grid">${buildProjectCards(repos, colors, false)}</div>
  </div>
</section>` : ""}
${config.sections.includes("contact") ? buildContactSection(profile, false, colors.accent) : ""}
</main>
${buildFooter(profile, colors.accent, false)}
</body>
</html>`
}

function buildDesignerCoder(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio, resumeText } = data
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLanguages(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const imgSrc = photoUrl || profile.avatar_url

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} - Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
${commonStyles(colors.accent)}
body { background: #111; color: #e5e5e5; }
.hero { height: 100vh; display: flex; position: relative; }
.hero-design { flex: 1; background: #f8f8f8; display: flex; flex-direction: column; justify-content: center; padding: 60px; }
.hero-design h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; color: #111; }
.hero-design p { font-size: 14px; color: #666; line-height: 1.7; margin-top: 12px; max-width: 300px; }
.hero-code { flex: 1; background: #1a1a1a; display: flex; flex-direction: column; justify-content: center; padding: 60px; position: relative; overflow: hidden; }
.hero-code h2 { font-family: 'JetBrains Mono', monospace; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; color: ${colors.accent}; }
.hero-code p { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #888; line-height: 1.7; margin-top: 12px; max-width: 300px; }
.hero-photo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: clamp(150px, 20vw, 250px); height: clamp(150px, 20vw, 250px); border-radius: 50%; object-fit: cover; border: 4px solid #111; box-shadow: -15px -10px 0 ${colors.accent}, 15px 10px 0 ${colors.primary}, -10px 15px 0 #f59e0b, 10px -15px 0 #22c55e; z-index: 10; }
.section { padding: 80px 24px; }
.container { max-width: 1100px; margin: 0 auto; }
.section-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #fff; margin-bottom: 40px; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.project-grid > div:hover { border-color: ${colors.accent}55; }
@media (max-width: 768px) {
  .hero { flex-direction: column; height: auto; min-height: 100vh; }
  .hero-design, .hero-code { padding: 60px 24px; min-height: 40vh; }
  .hero-photo { position: relative; left: auto; top: auto; transform: none; margin: -40px auto; }
}
</style>
</head>
<body>
${buildNav(name, config.sections, true, colors.accent)}
<div class="hero hero-split">
  <div class="hero-design">
    <h2 class="anim">designer</h2>
    <p class="anim anim-d1">Creative mind with an eye for detail and user experience.</p>
  </div>
  <div class="hero-code">
    <h2 class="anim">&lt;coder&gt;</h2>
    <p class="anim anim-d1">Building robust, clean, and efficient applications.</p>
  </div>
  <img src="${imgSrc}" alt="${escapeHtml(name)}" class="hero-photo anim anim-d2" crossorigin="anonymous">
</div>
<main>
${config.sections.includes("about") ? buildAboutSection(profile, aiBio, resumeText, true, colors.accent) : ""}
${config.sections.includes("skills") ? `
<section id="skills" class="section" style="background:#0d0d0d">
  <div class="container">
    <h2 class="section-title">Tech Stack</h2>
    <div class="skills-wrap" style="display:flex;flex-wrap:wrap;gap:0">${buildSkillBadges(langs, topics, colors.accent)}</div>
  </div>
</section>` : ""}
${config.sections.includes("projects") ? `
<section id="projects" class="section" style="background:#111">
  <div class="container">
    <h2 class="section-title">Projects</h2>
    <div class="project-grid">${buildProjectCards(repos, colors, true)}</div>
  </div>
</section>` : ""}
${config.sections.includes("contact") ? buildContactSection(profile, true, colors.accent) : ""}
</main>
${buildFooter(profile, colors.accent, true)}
</body>
</html>`
}

function buildMinimalClean(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio, resumeText } = data
  const colors = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLanguages(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const imgSrc = photoUrl || profile.avatar_url

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)} - Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
${commonStyles(colors.accent)}
body { background: #fff; color: #222; }
.hero { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; }
.hero-photo { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 2px solid ${colors.accent}; margin-bottom: 24px; }
.hero h1 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 600; color: #222; margin-bottom: 8px; }
.hero p { font-size: 15px; color: #888; }
.hero .cta { display: inline-block; margin-top: 24px; padding: 10px 28px; border: 2px solid ${colors.accent}; color: ${colors.accent}; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; transition: all .3s; }
.hero .cta:hover { background: ${colors.accent}; color: #fff; }
.section { padding: 80px 24px; border-top: 1px solid #eee; }
.container { max-width: 800px; margin: 0 auto; }
.section-title { font-size: clamp(1.25rem, 2.5vw, 1.75rem); font-weight: 600; color: #222; margin-bottom: 32px; letter-spacing: 0.02em; }
.project-list { display: flex; flex-direction: column; gap: 0; }
.project-item { padding: 24px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.project-item h3 { font-size: 16px; font-weight: 600; color: #222; }
.project-item p { font-size: 14px; color: #888; margin-top: 4px; }
.project-item a { font-size: 13px; color: ${colors.accent}; text-decoration: none; white-space: nowrap; }
</style>
</head>
<body>
${buildNav(name, config.sections, false, colors.accent)}
<div class="hero">
  <img src="${imgSrc}" alt="${escapeHtml(name)}" class="hero-photo anim" crossorigin="anonymous">
  <h1 class="anim anim-d1">${escapeHtml(name)}</h1>
  <p class="anim anim-d2">${escapeHtml(profile.bio || "Developer & Creator")}</p>
  <a href="#projects" class="cta anim anim-d3">View Work</a>
</div>
<main>
${config.sections.includes("about") ? buildAboutSection(profile, aiBio, resumeText, false, colors.accent) : ""}
${config.sections.includes("skills") ? `
<section id="skills" class="section">
  <div class="container">
    <h2 class="section-title">Skills</h2>
    <div class="skills-wrap" style="display:flex;flex-wrap:wrap;gap:0">${buildSkillBadges(langs, topics, colors.accent)}</div>
  </div>
</section>` : ""}
${config.sections.includes("projects") ? `
<section id="projects" class="section">
  <div class="container">
    <h2 class="section-title">Projects</h2>
    <div class="project-list">
      ${repos.filter(r => !r.fork).slice(0, 6).map(r => `
        <div class="project-item">
          <div>
            <h3>${escapeHtml(r.name)}</h3>
            <p>${escapeHtml(r.description || "No description")}</p>
          </div>
          <a href="${r.html_url}" target="_blank" rel="noopener">&rarr;</a>
        </div>`).join("")}
    </div>
  </div>
</section>` : ""}
${config.sections.includes("contact") ? buildContactSection(profile, false, colors.accent) : ""}
</main>
${buildFooter(profile, colors.accent, false)}
</body>
</html>`
}

/* ========== MAIN EXPORT ========== */

const TEMPLATE_BUILDERS: Record<string, (data: TemplateData) => string> = {
  "bold-portrait": buildBoldPortrait,
  "typographic": buildTypographic,
  "split-editorial": buildSplitEditorial,
  "pastel-creative": buildPastelCreative,
  "designer-coder": buildDesignerCoder,
  "minimal-clean": buildMinimalClean,
}

export function buildPortfolioHtml(data: TemplateData): string {
  const builder = TEMPLATE_BUILDERS[data.config.template] || buildBoldPortrait
  return builder(data)
}
