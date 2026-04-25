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

function e(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function getLangs(repos: GitHubRepo[]): string[] {
  return [...new Set(repos.map((r) => r.language).filter(Boolean))] as string[]
}

function getTopics(repos: GitHubRepo[]): string[] {
  return [...new Set(repos.flatMap((r) => r.topics).filter(Boolean))]
}

// Shared base styles injected into every template
function baseStyles(accent: string): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0f; color: #e8e8ef; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
    img { max-width: 100%; height: auto; }
    a { text-decoration: none; transition: all .3s; }
    a:hover { opacity: 0.85; }

    /* Background grid */
    .grid-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; 
      background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px; }
    .grid-bg::after { content: ''; position: absolute; inset: 0; 
      background: radial-gradient(ellipse 60% 40% at 50% 0%, ${accent}15, transparent 70%); }

    /* Sections */
    .section { position: relative; z-index: 1; padding: 100px 24px; }
    .container { max-width: 1100px; margin: 0 auto; }
    .section-label { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: ${accent}; font-weight: 600; margin-bottom: 12px; }
    .section-title { font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: #fff; margin-bottom: 20px; line-height: 1.2; }
    .section-desc { font-size: 16px; color: #888; line-height: 1.7; max-width: 600px; margin-bottom: 48px; }

    /* Nav */
    .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 24px; background: rgba(10,10,15,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .nav-brand { font-size: 18px; font-weight: 800; color: #fff; }
    .nav-brand span { color: ${accent}; }
    .nav-links { display: flex; gap: 28px; }
    .nav-links a { font-size: 13px; color: #999; font-weight: 500; letter-spacing: 0.3px; transition: color 0.3s; }
    .nav-links a:hover, .nav-links a.active { color: ${accent}; }
    .nav-cta { padding: 8px 20px; border-radius: 8px; background: ${accent}; color: #000; font-size: 13px; font-weight: 600; }
    .nav-cta:hover { opacity: 0.9; transform: translateY(-1px); }
    .nav-toggle { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
    .nav-toggle span { display: block; width: 22px; height: 2px; background: #fff; margin: 5px 0; transition: all .3s; }
    .mobile-menu { display: none; position: fixed; top: 64px; left: 0; right: 0; background: rgba(10,10,15,0.95); backdrop-filter: blur(20px); padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); z-index: 99; }
    .mobile-menu.open { display: flex; flex-direction: column; gap: 16px; }
    .mobile-menu a { font-size: 16px; color: #ccc; font-weight: 500; padding: 8px 0; }
    .mobile-menu a:hover { color: ${accent}; }

    /* Project cards */
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .project-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px; transition: all .4s cubic-bezier(.4,0,.2,1); position: relative; overflow: hidden; }
    .project-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, ${accent}40, transparent); opacity: 0; transition: opacity .4s; }
    .project-card:hover { border-color: ${accent}30; transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${accent}08; }
    .project-card:hover::before { opacity: 1; }
    .project-name { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .project-desc { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 16px; }
    .project-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .project-lang { font-size: 12px; padding: 4px 12px; border-radius: 20px; background: ${accent}12; color: ${accent}; font-weight: 500; }
    .project-link { font-size: 13px; color: ${accent}; font-weight: 500; margin-left: auto; }
    .project-stars { font-size: 12px; color: ${accent}; font-weight: 600; }

    /* Skills */
    .skill-badge { display: inline-block; padding: 8px 18px; border-radius: 24px; font-size: 13px; font-weight: 500; border: 1px solid ${accent}20; color: ${accent}; margin: 4px; background: ${accent}08; transition: all .3s; }
    .skill-badge:hover { background: ${accent}18; border-color: ${accent}40; transform: translateY(-2px); }

    /* Footer */
    .footer { position: relative; z-index: 1; padding: 40px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(5,5,10,0.8); }
    .footer p { font-size: 13px; color: #555; }
    .footer a { color: ${accent}; font-weight: 600; }

    /* GSAP reveal classes */
    .reveal { opacity: 0; transform: translateY(40px); }
    .reveal-left { opacity: 0; transform: translateX(-40px); }
    .reveal-right { opacity: 0; transform: translateX(40px); }
    .reveal-scale { opacity: 0; transform: scale(0.9); }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .nav-cta { display: none; }
      .nav-toggle { display: block; }
      .hero-split { flex-direction: column !important; }
      .hero-photo-side { position: relative !important; width: 100% !important; height: 300px !important; }
      .projects-grid { grid-template-columns: 1fr; }
      .stats-row { flex-direction: column; gap: 24px !important; }
      .section { padding: 60px 16px; }
    }
  `
}

// GSAP CDN + ScrollTrigger + init script
function gsapScript(): string {
  return `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"><\/script>
  <script>
    gsap.registerPlugin(ScrollTrigger);
    
    // Reveal animations
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
    gsap.utils.toArray('.reveal-left').forEach(el => {
      gsap.to(el, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
    gsap.utils.toArray('.reveal-right').forEach(el => {
      gsap.to(el, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
    gsap.utils.toArray('.reveal-scale').forEach(el => {
      gsap.to(el, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });

    // Stagger project cards
    ScrollTrigger.batch('.project-card', {
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out' }),
      start: 'top 85%', once: true
    });

    // Stagger skill badges
    ScrollTrigger.batch('.skill-badge', {
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, scale: 1, stagger: 0.04, duration: 0.4, ease: 'back.out(1.7)' }),
      start: 'top 90%', once: true
    });

    // Hero elements animate on load
    gsap.from('.hero-anim', { opacity: 0, y: 30, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.2 });

    // Parallax on hero photo
    const heroPhoto = document.querySelector('.hero-photo-parallax');
    if (heroPhoto) {
      gsap.to(heroPhoto, {
        y: -60,
        scrollTrigger: { trigger: heroPhoto, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }

    // Active nav link on scroll
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');
    document.querySelectorAll('section[id]').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveNav(sec.id),
        onEnterBack: () => setActiveNav(sec.id),
      });
    });
    function setActiveNav(id) {
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('data-section') === id);
      });
    }
  <\/script>`
}

function buildNav(name: string, sections: string[], accent: string): string {
  const navItems = ["home", ...sections.filter(s => s !== "home")]
  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="#home" class="nav-brand">${e(name.split(" ")[0])}<span>.</span></a>
      <div class="nav-links">
        ${navItems.map(s => `<a href="#${s}" data-section="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</a>`).join("")}
      </div>
      <a href="#contact" class="nav-cta">Contact Me</a>
      <button class="nav-toggle" onclick="document.getElementById('mobileMenu').classList.toggle('open')" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div id="mobileMenu" class="mobile-menu">
    ${navItems.map(s => `<a href="#${s}" onclick="document.getElementById('mobileMenu').classList.remove('open')">${s.charAt(0).toUpperCase() + s.slice(1)}</a>`).join("")}
    <a href="#contact" onclick="document.getElementById('mobileMenu').classList.remove('open')" style="color:${accent};font-weight:700">Contact Me</a>
  </div>`
}

function buildProjects(repos: GitHubRepo[], accent: string): string {
  return repos.filter(r => !r.fork).slice(0, 6).map(r => `
    <div class="project-card reveal" style="opacity:0;transform:translateY(40px)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <h3 class="project-name">${e(r.name)}</h3>
        ${r.stargazers_count > 0 ? `<span class="project-stars">&#9733; ${r.stargazers_count}</span>` : ""}
      </div>
      <p class="project-desc">${e(r.description || "A project built with care and attention to detail.")}</p>
      <div class="project-meta">
        ${r.language ? `<span class="project-lang">${e(r.language)}</span>` : ""}
        <a href="${r.html_url}" target="_blank" rel="noopener" class="project-link">View Code &rarr;</a>
        ${r.homepage ? `<a href="${r.homepage}" target="_blank" rel="noopener" class="project-link" style="color:#888">Live &rarr;</a>` : ""}
      </div>
    </div>`).join("")
}

function buildSkills(langs: string[], topics: string[]): string {
  return [...langs, ...topics].slice(0, 14).map(s => 
    `<span class="skill-badge reveal-scale" style="opacity:0;transform:scale(0.9)">${e(s)}</span>`
  ).join("")
}

function buildAbout(profile: GitHubProfile, aiBio: string | null, accent: string): string {
  const bio = aiBio || profile.bio || "A passionate developer dedicated to crafting exceptional digital experiences."
  return `
  <section id="about" class="section" style="background:rgba(255,255,255,0.01)">
    <div class="container">
      <p class="section-label reveal">About</p>
      <h2 class="section-title reveal">A little about me</h2>
      <p class="section-desc reveal" style="max-width:700px">${e(bio)}</p>
      <div style="display:flex;gap:32px;flex-wrap:wrap" class="reveal">
        ${profile.location ? `<div style="display:flex;align-items:center;gap:8px"><span style="color:${accent}">&#9679;</span><span style="font-size:14px;color:#aaa">${e(profile.location)}</span></div>` : ""}
        ${profile.company ? `<div style="display:flex;align-items:center;gap:8px"><span style="color:${accent}">&#9679;</span><span style="font-size:14px;color:#aaa">${e(profile.company)}</span></div>` : ""}
        ${profile.blog ? `<div style="display:flex;align-items:center;gap:8px"><span style="color:${accent}">&#9679;</span><a href="${profile.blog.startsWith("http") ? profile.blog : "https://" + profile.blog}" target="_blank" style="font-size:14px;color:${accent}">${e(profile.blog)}</a></div>` : ""}
      </div>
    </div>
  </section>`
}

function buildContact(profile: GitHubProfile, accent: string): string {
  return `
  <section id="contact" class="section" style="background:rgba(255,255,255,0.01)">
    <div class="container" style="text-align:center">
      <p class="section-label reveal">Contact</p>
      <h2 class="section-title reveal" style="margin-left:auto;margin-right:auto">Let&rsquo;s work together</h2>
      <p class="section-desc reveal" style="margin-left:auto;margin-right:auto;text-align:center">Have a project in mind? I&rsquo;d love to hear about it.</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap" class="reveal">
        <a href="${profile.html_url}" target="_blank" rel="noopener" style="padding:14px 32px;background:${accent};color:#000;border-radius:10px;font-weight:700;font-size:15px;display:inline-flex;align-items:center;gap:8px">GitHub Profile &rarr;</a>
        ${profile.blog ? `<a href="${profile.blog.startsWith("http") ? profile.blog : "https://" + profile.blog}" target="_blank" rel="noopener" style="padding:14px 32px;border:2px solid ${accent};color:${accent};border-radius:10px;font-weight:700;font-size:15px">Website</a>` : ""}
      </div>
    </div>
  </section>`
}

function buildFooter(name: string, accent: string): string {
  return `
  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} ${e(name)}. Built with <a href="https://personaai.dev" target="_blank">PersonaAI</a></p>
  </footer>`
}

function shell(accent: string, extraStyles: string, bodyContent: string, name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${e(name)} - Portfolio</title>
<style>${baseStyles(accent)}${extraStyles}</style>
</head>
<body>
<div class="grid-bg"></div>
${bodyContent}
${gsapScript()}
</body>
</html>`
}

/* ===== TEMPLATE: BOLD PORTRAIT ===== */
function buildBoldPortrait(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio } = data
  const c = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLangs(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const img = photoUrl || profile.avatar_url

  const extra = `
    .hero { min-height: 100vh; display: flex; align-items: center; position: relative; overflow: hidden; }
    .hero-img { position: absolute; right: 0; top: 0; width: 50%; height: 100%; object-fit: cover; filter: grayscale(100%); opacity: 0.5; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, #0a0a0f 40%, transparent 80%); }
    .hero-content { position: relative; z-index: 2; padding: 120px 6vw 80px; max-width: 650px; }
    .hero h1 { font-size: clamp(3.5rem, 9vw, 7rem); font-weight: 900; line-height: 0.95; color: #fff; margin-bottom: 20px; }
    .hero h1 span { color: ${c.accent}; }
    .hero-bio { font-size: clamp(1rem, 1.5vw, 1.15rem); color: #999; line-height: 1.7; margin-bottom: 40px; }
    .stats-row { display: flex; gap: 48px; }
    .stat-num { font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 800; color: ${c.accent}; }
    .stat-label { font-size: 13px; color: #666; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    @media (max-width:768px) {
      .hero-img { position: relative; width: 100%; height: 250px; opacity: 0.4; }
      .hero { flex-direction: column; }
      .hero-overlay { background: linear-gradient(180deg, transparent, #0a0a0f 60%); }
      .hero-content { padding: 40px 24px 60px; }
    }
  `
  const body = `
  ${buildNav(name, config.sections, c.accent)}
  <section id="home" class="hero">
    <img src="${img}" alt="${e(name)}" class="hero-img hero-photo-parallax" crossorigin="anonymous">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1 class="hero-anim">Hello<span>.</span></h1>
      <p class="hero-bio hero-anim">${e(profile.bio || `I'm ${name}, a developer building exceptional digital experiences.`)}</p>
      <div class="stats-row hero-anim">
        <div><div class="stat-num">+${profile.public_repos}</div><div class="stat-label">Projects</div></div>
        <div><div class="stat-num">+${profile.followers}</div><div class="stat-label">Followers</div></div>
        <div><div class="stat-num">${langs.length}</div><div class="stat-label">Languages</div></div>
      </div>
    </div>
  </section>
  <main>
  ${config.sections.includes("about") ? buildAbout(profile, aiBio, c.accent) : ""}
  ${config.sections.includes("skills") ? `<section id="skills" class="section"><div class="container"><p class="section-label reveal">Expertise</p><h2 class="section-title reveal">Skills & Technologies</h2><div style="display:flex;flex-wrap:wrap;gap:0">${buildSkills(langs, topics)}</div></div></section>` : ""}
  ${config.sections.includes("projects") ? `<section id="projects" class="section" style="background:rgba(255,255,255,0.01)"><div class="container"><p class="section-label reveal">Work</p><h2 class="section-title reveal">Featured Projects</h2><div class="projects-grid">${buildProjects(repos, c.accent)}</div></div></section>` : ""}
  ${config.sections.includes("contact") ? buildContact(profile, c.accent) : ""}
  </main>
  ${buildFooter(name, c.accent)}`

  return shell(c.accent, extra, body, name)
}

/* ===== TEMPLATE: TYPOGRAPHIC ===== */
function buildTypographic(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio } = data
  const c = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLangs(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const img = photoUrl || profile.avatar_url
  const role = langs.length > 0 ? `${langs[0]} Developer` : "Developer"

  const extra = `
    .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 24px; }
    .hero-photo { width: clamp(180px, 25vw, 280px); height: clamp(180px, 25vw, 280px); border-radius: 50%; object-fit: cover; filter: grayscale(90%); position: relative; z-index: 1; box-shadow: 0 0 80px ${c.accent}25; }
    .hero-title { position: absolute; font-size: clamp(3.5rem, 12vw, 9rem); font-weight: 900; color: rgba(255,255,255,0.08); z-index: 2; text-align: center; line-height: 0.95; pointer-events: none; text-transform: uppercase; letter-spacing: -0.03em; }
    .hero-name { position: relative; z-index: 3; margin-top: 24px; font-size: clamp(1rem, 1.5vw, 1.2rem); color: #aaa; text-align: center; letter-spacing: 4px; text-transform: uppercase; font-weight: 500; }
    .hero-role { font-size: 14px; color: ${c.accent}; text-align: center; margin-top: 8px; letter-spacing: 2px; text-transform: uppercase; }
    @media (max-width:768px) { .hero-title { font-size: clamp(3rem, 16vw, 5rem); } .hero-photo { width: 160px; height: 160px; } }
  `
  const body = `
  ${buildNav(name, config.sections, c.accent)}
  <section id="home" class="hero">
    <div class="hero-title hero-anim">${e(role)}</div>
    <img src="${img}" alt="${e(name)}" class="hero-photo hero-anim hero-photo-parallax" crossorigin="anonymous">
    <div class="hero-name hero-anim">${e(name)}</div>
    <div class="hero-role hero-anim">${e(profile.location || "Worldwide")}</div>
  </section>
  <main>
  ${config.sections.includes("about") ? buildAbout(profile, aiBio, c.accent) : ""}
  ${config.sections.includes("skills") ? `<section id="skills" class="section"><div class="container"><p class="section-label reveal">Skills</p><h2 class="section-title reveal">What I work with</h2><div style="display:flex;flex-wrap:wrap;gap:0">${buildSkills(langs, topics)}</div></div></section>` : ""}
  ${config.sections.includes("projects") ? `<section id="projects" class="section" style="background:rgba(255,255,255,0.01)"><div class="container"><p class="section-label reveal">Projects</p><h2 class="section-title reveal">Selected Work</h2><div class="projects-grid">${buildProjects(repos, c.accent)}</div></div></section>` : ""}
  ${config.sections.includes("contact") ? buildContact(profile, c.accent) : ""}
  </main>
  ${buildFooter(name, c.accent)}`

  return shell(c.accent, extra, body, name)
}

/* ===== TEMPLATE: SPLIT EDITORIAL ===== */
function buildSplitEditorial(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio } = data
  const c = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLangs(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const img = photoUrl || profile.avatar_url

  const extra = `
    .hero { min-height: 100vh; display: flex; }
    .hero-dark { flex: 1; background: #050508; display: flex; align-items: center; justify-content: center; padding: 40px; position: relative; }
    .hero-dark img { width: 80%; max-width: 380px; height: 85vh; max-height: 550px; object-fit: cover; filter: grayscale(100%); border-radius: 8px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
    .hero-dark .num { position: absolute; top: 100px; left: 40px; font-size: 60px; font-weight: 200; color: rgba(255,255,255,0.08); }
    .hero-light { flex: 1; background: #12121a; display: flex; flex-direction: column; justify-content: center; padding: 60px; border-left: 1px solid rgba(255,255,255,0.06); }
    .hero-light h1 { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 800; line-height: 1.15; color: #fff; margin-bottom: 20px; }
    .hero-light h1 span { color: ${c.accent}; font-style: italic; }
    .hero-light p { font-size: 15px; color: #888; line-height: 1.7; margin-bottom: 28px; max-width: 400px; }
    .hero-light a.cta { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: ${c.accent}; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    @media (max-width:768px) {
      .hero { flex-direction: column; min-height: auto; }
      .hero-dark { min-height: 350px; } .hero-dark img { width: 60%; height: auto; aspect-ratio: 3/4; }
      .hero-light { padding: 40px 24px; border-left: none; border-top: 1px solid rgba(255,255,255,0.06); }
    }
  `
  const body = `
  ${buildNav(name, config.sections, c.accent)}
  <section id="home" class="hero hero-split">
    <div class="hero-dark">
      <span class="num hero-anim">01</span>
      <img src="${img}" alt="${e(name)}" class="hero-anim hero-photo-parallax" crossorigin="anonymous">
    </div>
    <div class="hero-light">
      <h1 class="hero-anim">${e(name)}<br><span>Portfolio</span></h1>
      <p class="hero-anim">${e(profile.bio || "Creating impactful digital experiences with code and design.")}</p>
      <a href="#projects" class="cta hero-anim">View Projects &darr;</a>
    </div>
  </section>
  <main>
  ${config.sections.includes("about") ? buildAbout(profile, aiBio, c.accent) : ""}
  ${config.sections.includes("skills") ? `<section id="skills" class="section"><div class="container"><p class="section-label reveal">Expertise</p><h2 class="section-title reveal">Technologies</h2><div style="display:flex;flex-wrap:wrap;gap:0">${buildSkills(langs, topics)}</div></div></section>` : ""}
  ${config.sections.includes("projects") ? `<section id="projects" class="section" style="background:rgba(255,255,255,0.01)"><div class="container"><p class="section-label reveal">Work</p><h2 class="section-title reveal">Projects</h2><div class="projects-grid">${buildProjects(repos, c.accent)}</div></div></section>` : ""}
  ${config.sections.includes("contact") ? buildContact(profile, c.accent) : ""}
  </main>
  ${buildFooter(name, c.accent)}`

  return shell(c.accent, extra, body, name)
}

/* ===== TEMPLATE: PASTEL CREATIVE (now dark premium) ===== */
function buildPastelCreative(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio } = data
  const c = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLangs(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const img = photoUrl || profile.avatar_url

  const extra = `
    .hero { min-height: 100vh; display: flex; align-items: center; position: relative; padding: 120px 24px 80px; }
    .hero-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 60px; width: 100%; }
    .hero-text { flex: 1; }
    .hero-text .tag { font-size: 14px; color: ${c.accent}; font-weight: 600; margin-bottom: 12px; display: inline-block; padding: 6px 16px; border: 1px solid ${c.accent}30; border-radius: 20px; background: ${c.accent}08; }
    .hero-text h1 { font-size: clamp(2.2rem, 4.5vw, 3.5rem); font-weight: 800; color: #fff; line-height: 1.15; margin-bottom: 16px; }
    .hero-text p { font-size: 16px; color: #888; line-height: 1.7; margin-bottom: 32px; max-width: 480px; }
    .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
    .hero-ctas a { padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; }
    .hero-ctas .primary { background: ${c.accent}; color: #000; }
    .hero-ctas .secondary { border: 2px solid rgba(255,255,255,0.12); color: #ccc; }
    .hero-photo-wrap { position: relative; flex-shrink: 0; }
    .hero-photo-wrap img { width: clamp(200px, 22vw, 300px); height: clamp(250px, 28vw, 380px); object-fit: cover; border-radius: 20px; border: 2px solid rgba(255,255,255,0.06); }
    .hero-photo-wrap::before { content: ''; position: absolute; inset: -8px; border-radius: 24px; border: 2px solid ${c.accent}20; }
    .hero-photo-wrap::after { content: ''; position: absolute; inset: 0; border-radius: 20px; box-shadow: 0 0 60px ${c.accent}15, 0 30px 80px rgba(0,0,0,0.3); pointer-events: none; }
    @media (max-width:768px) {
      .hero-inner { flex-direction: column-reverse; text-align: center; }
      .hero-photo-wrap img { width: 200px; height: 260px; }
      .hero-ctas { justify-content: center; }
    }
  `
  const body = `
  ${buildNav(name, config.sections, c.accent)}
  <section id="home" class="hero">
    <div class="hero-inner">
      <div class="hero-text">
        <span class="tag hero-anim">Available for hire</span>
        <h1 class="hero-anim">${e(name)}</h1>
        <p class="hero-anim">${e(profile.bio || "A creative developer making beautiful, functional digital experiences.")}</p>
        <div class="hero-ctas hero-anim">
          <a href="#projects" class="primary">View Projects</a>
          <a href="#contact" class="secondary">Get in Touch</a>
        </div>
      </div>
      <div class="hero-photo-wrap hero-anim">
        <img src="${img}" alt="${e(name)}" class="hero-photo-parallax" crossorigin="anonymous">
      </div>
    </div>
  </section>
  <main>
  ${config.sections.includes("about") ? buildAbout(profile, aiBio, c.accent) : ""}
  ${config.sections.includes("skills") ? `<section id="skills" class="section"><div class="container"><p class="section-label reveal">Skills</p><h2 class="section-title reveal">My Toolkit</h2><div style="display:flex;flex-wrap:wrap;gap:0">${buildSkills(langs, topics)}</div></div></section>` : ""}
  ${config.sections.includes("projects") ? `<section id="projects" class="section" style="background:rgba(255,255,255,0.01)"><div class="container"><p class="section-label reveal">Portfolio</p><h2 class="section-title reveal">Recent Projects</h2><div class="projects-grid">${buildProjects(repos, c.accent)}</div></div></section>` : ""}
  ${config.sections.includes("contact") ? buildContact(profile, c.accent) : ""}
  </main>
  ${buildFooter(name, c.accent)}`

  return shell(c.accent, extra, body, name)
}

/* ===== TEMPLATE: DESIGNER CODER ===== */
function buildDesignerCoder(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio } = data
  const c = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLangs(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const img = photoUrl || profile.avatar_url

  const extra = `
    .hero { min-height: 100vh; display: flex; position: relative; }
    .hero-left { flex: 1; background: #0e0e14; display: flex; flex-direction: column; justify-content: center; padding: 60px; }
    .hero-left h2 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; color: #fff; letter-spacing: -0.02em; }
    .hero-left p { font-size: 14px; color: #666; line-height: 1.7; margin-top: 12px; max-width: 280px; }
    .hero-right { flex: 1; background: #0a0a10; display: flex; flex-direction: column; justify-content: center; padding: 60px; border-left: 1px solid rgba(255,255,255,0.04); }
    .hero-right h2 { font-family: 'JetBrains Mono', monospace; font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; color: ${c.accent}; }
    .hero-right p { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #666; line-height: 1.7; margin-top: 12px; max-width: 280px; }
    .hero-center-photo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: clamp(140px, 18vw, 220px); height: clamp(140px, 18vw, 220px); border-radius: 50%; object-fit: cover; border: 4px solid #0a0a0f; z-index: 10; box-shadow: 0 0 60px ${c.accent}25, -20px -12px 0 ${c.accent}, 20px 12px 0 ${c.primary}; }
    @media (max-width:768px) {
      .hero { flex-direction: column; min-height: auto; }
      .hero-left, .hero-right { padding: 60px 24px; min-height: 40vh; }
      .hero-right { border-left: none; border-top: 1px solid rgba(255,255,255,0.04); }
      .hero-center-photo { position: relative; left: auto; top: auto; transform: none; margin: -40px auto; }
    }
  `
  const body = `
  ${buildNav(name, config.sections, c.accent)}
  <section id="home" class="hero hero-split">
    <div class="hero-left">
      <h2 class="hero-anim">designer</h2>
      <p class="hero-anim">Creative mind with an eye for detail, UX, and visual storytelling.</p>
    </div>
    <div class="hero-right">
      <h2 class="hero-anim">&lt;coder&gt;</h2>
      <p class="hero-anim">Building robust, clean, and performant applications.</p>
    </div>
    <img src="${img}" alt="${e(name)}" class="hero-center-photo hero-anim hero-photo-parallax" crossorigin="anonymous">
  </section>
  <main>
  ${config.sections.includes("about") ? buildAbout(profile, aiBio, c.accent) : ""}
  ${config.sections.includes("skills") ? `<section id="skills" class="section"><div class="container"><p class="section-label reveal">Stack</p><h2 class="section-title reveal">Tech Stack</h2><div style="display:flex;flex-wrap:wrap;gap:0">${buildSkills(langs, topics)}</div></div></section>` : ""}
  ${config.sections.includes("projects") ? `<section id="projects" class="section" style="background:rgba(255,255,255,0.01)"><div class="container"><p class="section-label reveal">Work</p><h2 class="section-title reveal">Projects</h2><div class="projects-grid">${buildProjects(repos, c.accent)}</div></div></section>` : ""}
  ${config.sections.includes("contact") ? buildContact(profile, c.accent) : ""}
  </main>
  ${buildFooter(name, c.accent)}`

  return shell(c.accent, extra, body, name)
}

/* ===== TEMPLATE: MINIMAL CLEAN (now premium dark minimal) ===== */
function buildMinimalClean(data: TemplateData): string {
  const { profile, repos, config, photoUrl, aiBio } = data
  const c = COLOR_SCHEMES[config.colorScheme as ColorScheme]
  const langs = getLangs(repos)
  const topics = getTopics(repos)
  const name = profile.name || profile.username
  const img = photoUrl || profile.avatar_url

  const extra = `
    .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; }
    .hero-photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid ${c.accent}40; margin-bottom: 28px; box-shadow: 0 0 40px ${c.accent}15; }
    .hero h1 { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 600; color: #fff; margin-bottom: 8px; letter-spacing: 0.01em; }
    .hero p { font-size: 15px; color: #888; letter-spacing: 0.5px; }
    .hero .cta { display: inline-block; margin-top: 28px; padding: 12px 32px; border: 1.5px solid ${c.accent}; color: ${c.accent}; border-radius: 8px; font-weight: 500; font-size: 14px; letter-spacing: 0.5px; }
    .hero .cta:hover { background: ${c.accent}; color: #000; }
    .project-list { display: flex; flex-direction: column; }
    .project-item { padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; gap: 16px; transition: all .3s; }
    .project-item:hover { padding-left: 12px; border-color: ${c.accent}30; }
    .project-item h3 { font-size: 16px; font-weight: 600; color: #ddd; }
    .project-item p { font-size: 13px; color: #777; margin-top: 4px; }
    .project-item a { font-size: 13px; color: ${c.accent}; white-space: nowrap; font-weight: 500; }
  `
  const body = `
  ${buildNav(name, config.sections, c.accent)}
  <section id="home" class="hero">
    <img src="${img}" alt="${e(name)}" class="hero-photo hero-anim hero-photo-parallax" crossorigin="anonymous">
    <h1 class="hero-anim">${e(name)}</h1>
    <p class="hero-anim">${e(profile.bio || "Developer & Creator")}</p>
    <a href="#projects" class="cta hero-anim">View Work</a>
  </section>
  <main>
  ${config.sections.includes("about") ? buildAbout(profile, aiBio, c.accent) : ""}
  ${config.sections.includes("skills") ? `<section id="skills" class="section"><div class="container"><p class="section-label reveal">Skills</p><h2 class="section-title reveal">Technologies</h2><div style="display:flex;flex-wrap:wrap;gap:0">${buildSkills(langs, topics)}</div></div></section>` : ""}
  ${config.sections.includes("projects") ? `
  <section id="projects" class="section" style="background:rgba(255,255,255,0.01)">
    <div class="container">
      <p class="section-label reveal">Work</p>
      <h2 class="section-title reveal">Projects</h2>
      <div class="project-list">
        ${repos.filter(r => !r.fork).slice(0, 8).map(r => `
          <div class="project-item reveal">
            <div><h3>${e(r.name)}</h3><p>${e(r.description || "A carefully crafted project.")}</p></div>
            <a href="${r.html_url}" target="_blank" rel="noopener">&rarr;</a>
          </div>`).join("")}
      </div>
    </div>
  </section>` : ""}
  ${config.sections.includes("contact") ? buildContact(profile, c.accent) : ""}
  </main>
  ${buildFooter(name, c.accent)}`

  return shell(c.accent, extra, body, name)
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
