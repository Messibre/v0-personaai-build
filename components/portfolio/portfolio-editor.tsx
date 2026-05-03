"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Pencil,
  Eye,
  ImagePlus,
  Type,
  Undo2,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react"

interface PortfolioEditorProps {
  html: string
  onHtmlChange: (html: string) => void
  templateName?: string
}

type ViewportSize = "desktop" | "tablet" | "mobile"

const VIEWPORTS: { id: ViewportSize; label: string; icon: typeof Monitor; width: string; frameWidth: number }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%", frameWidth: 1280 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px", frameWidth: 768 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "390px", frameWidth: 390 },
]

// Script injected into the iframe to enable editing
function getEditorScript(): string {
  return `
<script>
(function() {
  let editMode = false;
  let imageInput = null;
  let targetImg = null;

  window.addEventListener('message', function(e) {
    if (e.data.type === 'TOGGLE_EDIT') {
      editMode = e.data.enabled;
      toggleEditMode(editMode);
    }
    if (e.data.type === 'REPLACE_IMAGE' && e.data.dataUrl && targetImg) {
      targetImg.src = e.data.dataUrl;
      targetImg = null;
      notifyParent();
    }
  });

  function toggleEditMode(on) {
    document.body.classList.toggle('persona-edit-mode', on);

    const textEls = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,.project-desc,.section-desc,.hero-bio,.stat-label,.stat-num,.hero-name,.hero-role,.project-name,.section-label,.section-title,.section-desc,.hero-anim,.tag,.skill-badge');
    textEls.forEach(function(el) {
      if (on) {
        if (el.children.length > 3) return;
        el.contentEditable = 'true';
        el.style.outline = 'none';
        el.addEventListener('focus', handleFocus);
        el.addEventListener('blur', handleBlur);
        el.addEventListener('input', handleInput);
      } else {
        el.contentEditable = 'false';
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('input', handleInput);
      }
    });

    const imgs = document.querySelectorAll('img');
    imgs.forEach(function(img) {
      if (on) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', handleImageClick);
        addImageOverlay(img);
      } else {
        img.style.cursor = '';
        img.removeEventListener('click', handleImageClick);
        removeImageOverlay(img);
      }
    });
  }

  function handleFocus(e) {
    e.target.style.outline = '2px solid #7c5cfc';
    e.target.style.outlineOffset = '2px';
    e.target.style.borderRadius = '4px';
  }

  function handleBlur(e) {
    e.target.style.outline = 'none';
    e.target.style.outlineOffset = '';
    e.target.style.borderRadius = '';
    notifyParent();
  }

  function handleInput() {
    clearTimeout(window._editTimer);
    window._editTimer = setTimeout(notifyParent, 500);
  }

  function handleImageClick(e) {
    e.preventDefault();
    e.stopPropagation();
    targetImg = e.target;
    window.parent.postMessage({ type: 'REQUEST_IMAGE_UPLOAD' }, '*');
  }

  function addImageOverlay(img) {
    if (img.parentElement.querySelector('.img-edit-overlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'img-edit-overlay';
    overlay.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Replace</span>';
    overlay.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(0,0,0,0.55);opacity:0;transition:opacity .2s;cursor:pointer;pointer-events:none;z-index:50;border-radius:inherit;';
    overlay.querySelector('span').style.cssText = 'font-size:11px;color:white;font-weight:600;letter-spacing:0.5px;';
    var parent = img.parentElement;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    parent.appendChild(overlay);
    img.addEventListener('mouseenter', function() { overlay.style.opacity='1'; overlay.style.pointerEvents='auto'; });
    img.addEventListener('mouseleave', function() { overlay.style.opacity='0'; overlay.style.pointerEvents='none'; });
    overlay.addEventListener('mouseenter', function() { overlay.style.opacity='1'; overlay.style.pointerEvents='auto'; });
    overlay.addEventListener('mouseleave', function() { overlay.style.opacity='0'; overlay.style.pointerEvents='none'; });
    overlay.addEventListener('click', function() { handleImageClick({ preventDefault:function(){}, stopPropagation:function(){}, target: img }); });
  }

  function removeImageOverlay(img) {
    var overlay = img.parentElement && img.parentElement.querySelector('.img-edit-overlay');
    if (overlay) overlay.remove();
  }

  function notifyParent() {
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
    clone.querySelectorAll('.img-edit-overlay').forEach(function(el) { el.remove(); });
    clone.querySelectorAll('.persona-edit-mode').forEach(function(el) { el.classList.remove('persona-edit-mode'); });
    clone.querySelectorAll('script').forEach(function(el) { el.remove(); });
    var originalScripts = document.querySelectorAll('script');
    var body = clone.querySelector('body');
    originalScripts.forEach(function(s) {
      var ns = document.createElement('script');
      if (s.src) ns.src = s.src;
      else ns.textContent = s.textContent;
      body.appendChild(ns);
    });
    window.parent.postMessage({ type: 'HTML_UPDATED', html: '<!DOCTYPE html>\\n' + clone.outerHTML }, '*');
  }
})();
<\/script>
<style>
  .persona-edit-mode [contenteditable="true"]:hover {
    outline: 1px dashed rgba(124,92,252,0.5) !important;
    outline-offset: 2px !important;
    border-radius: 4px !important;
  }
  .persona-edit-mode img:hover { filter: brightness(0.7) !important; }
</style>`
}

export function PortfolioEditor({ html, onHtmlChange, templateName }: PortfolioEditorProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [editMode, setEditMode] = useState(false)
  const [editHistory, setEditHistory] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(680)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentViewport = VIEWPORTS.find((v) => v.id === viewport)!

  // Inject editor script
  const editorHtml = html.replace("</body>", getEditorScript() + "</body>")

  // Auto-size iframe height based on viewport height
  useEffect(() => {
    function updateHeight() {
      if (isFullscreen) {
        setIframeHeight(window.innerHeight - 56) // toolbar is 56px
      } else {
        // Fill most of the viewport — sticky header (56px) + preview toolbar (~52px) + body padding (~40px) + url banner (~0)
        const h = Math.max(600, window.innerHeight - 160)
        setIframeHeight(h)
      }
    }
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [isFullscreen])

  const toggleEdit = useCallback(() => {
    const newMode = !editMode
    if (newMode) setEditHistory((prev) => [...prev.slice(-9), html])
    setEditMode(newMode)
    iframeRef.current?.contentWindow?.postMessage({ type: "TOGGLE_EDIT", enabled: newMode }, "*")
  }, [editMode, html])

  const undo = useCallback(() => {
    if (editHistory.length === 0) return
    const prev = editHistory[editHistory.length - 1]
    setEditHistory((h) => h.slice(0, -1))
    onHtmlChange(prev)
  }, [editHistory, onHtmlChange])

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data.type === "HTML_UPDATED" && e.data.html) onHtmlChange(e.data.html)
      if (e.data.type === "REQUEST_IMAGE_UPLOAD") fileInputRef.current?.click()
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onHtmlChange])

  const handleImageFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !file.type.startsWith("image/")) return
      if (file.size > 5 * 1024 * 1024) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setEditHistory((prev) => [...prev.slice(-9), html])
        iframeRef.current?.contentWindow?.postMessage({ type: "REPLACE_IMAGE", dataUrl }, "*")
      }
      reader.readAsDataURL(file)
      e.target.value = ""
    },
    [html]
  )

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        {/* Fullscreen toolbar */}
        <div className="flex items-center gap-2 px-4 h-12 border-b border-[var(--persona-border)] bg-[var(--persona-surface)] shrink-0">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="size-2.5 rounded-full bg-red-400/60" />
            <div className="size-2.5 rounded-full bg-amber-400/60" />
            <div className="size-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-mono">
              {templateName ? `${templateName} — ` : ""}portfolio.html
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* Viewport */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-muted/30 border border-[var(--persona-border)]">
              {VIEWPORTS.map((vp) => {
                const Icon = vp.icon
                return (
                  <Button
                    key={vp.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewport(vp.id)}
                    className={cn(
                      "h-6 px-2 text-xs rounded-full",
                      viewport === vp.id
                        ? "bg-[var(--persona-accent)] text-[var(--persona-bg)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3" />
                    <span className="hidden sm:inline ml-1">{vp.label}</span>
                  </Button>
                )
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEdit}
              className={cn(
                "gap-1.5 text-xs h-7",
                editMode ? "text-[var(--persona-accent)]" : "text-muted-foreground"
              )}
            >
              {editMode ? <Eye className="size-3.5" /> : <Pencil className="size-3.5" />}
              {editMode ? "Done" : "Edit"}
            </Button>
            {editHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={undo} className="h-7 text-muted-foreground hover:text-foreground">
                <Undo2 className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="h-7 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Fullscreen iframe */}
        <div className="flex-1 flex justify-center items-start overflow-auto bg-[var(--persona-surface)] p-0 sm:p-4">
          <div
            className="transition-all duration-300 w-full h-full"
            style={{ maxWidth: currentViewport.width }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={editorHtml}
              title="Portfolio preview"
              className="w-full border-0 bg-white"
              style={{ height: `${iframeHeight}px` }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: edit controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={toggleEdit}
            className={cn(
              "gap-1.5 text-xs transition-all duration-300 h-8",
              editMode
                ? "bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 shadow-sm shadow-[var(--persona-accent)]/20"
                : "border-[var(--persona-border)]"
            )}
          >
            {editMode ? <Eye className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editMode ? "Done Editing" : "Edit Portfolio"}
          </Button>
          {editMode && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 px-2 py-1 rounded-md bg-muted/30 border border-[var(--persona-border)]">
                <Type className="size-3 shrink-0" aria-hidden="true" />
                Click text to edit
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 px-2 py-1 rounded-md bg-muted/30 border border-[var(--persona-border)]">
                <ImagePlus className="size-3 shrink-0" aria-hidden="true" />
                Hover image to swap
              </span>
            </div>
          )}
          {editHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
              title="Undo last change"
              aria-label="Undo last change"
            >
              <Undo2 className="size-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
          )}
          {editMode && (
            <span className="sm:hidden text-[11px] text-muted-foreground/70 px-2 py-1 rounded-md bg-muted/30 border border-[var(--persona-border)]">
              Tap text to edit
            </span>
          )}
        </div>

        {/* Right: viewport + fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-1 rounded-full bg-[var(--persona-surface)] border border-[var(--persona-border)]">
            {VIEWPORTS.map((vp) => {
              const Icon = vp.icon
              const isActive = viewport === vp.id
              return (
                <Button
                  key={vp.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewport(vp.id)}
                  className={cn(
                    "gap-1.5 text-xs rounded-full h-7 transition-all duration-300",
                    isActive
                      ? "bg-[var(--persona-accent)] text-[var(--persona-bg)] shadow-sm hover:bg-[var(--persona-accent)]/90"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{vp.label}</span>
                </Button>
              )
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Open fullscreen preview"
            aria-label="Open fullscreen preview"
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />

      {/* Preview frame */}
      <div className="flex justify-center rounded-xl border border-[var(--persona-border)] bg-[var(--persona-surface)] overflow-hidden">
        <div
          className="transition-all duration-500 ease-out w-full"
          style={{ maxWidth: currentViewport.width }}
        >
          <div
            className={cn(
              "rounded-none sm:rounded-lg overflow-hidden border-0 sm:border shadow-none sm:shadow-xl transition-all duration-300",
              editMode ? "sm:border-[var(--persona-accent)]/30" : "sm:border-[var(--persona-border)]"
            )}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--persona-surface-hover)] border-b border-[var(--persona-border)]">
              <div className="flex gap-1.5 shrink-0" aria-hidden="true">
                <div className="size-2.5 rounded-full bg-red-400/70" />
                <div className="size-2.5 rounded-full bg-amber-400/70" />
                <div className="size-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 mx-2">
                <div className="h-[22px] rounded-md bg-muted/30 border border-[var(--persona-border)] flex items-center px-2.5 gap-1.5">
                  <svg className="size-2.5 text-muted-foreground/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span className="text-[10px] text-muted-foreground/60 font-mono truncate">
                    {templateName ? `${templateName.toLowerCase().replace(/\s+/g, "-")}-portfolio.html` : "portfolio.html"}
                  </span>
                </div>
              </div>
              {editMode && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--persona-accent)]/10 border border-[var(--persona-accent)]/20 shrink-0">
                  <div className="size-1.5 rounded-full bg-[var(--persona-accent)] animate-pulse" aria-hidden="true" />
                  <span className="text-[9px] font-semibold text-[var(--persona-accent)] tracking-wide uppercase">Editing</span>
                </div>
              )}
            </div>

            {/* Iframe */}
            <iframe
              ref={iframeRef}
              srcDoc={editorHtml}
              title={`Portfolio preview — ${templateName || "portfolio"}`}
              className="w-full border-0 bg-white block"
              style={{ height: `${iframeHeight}px` }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
