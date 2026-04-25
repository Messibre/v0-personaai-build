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
} from "lucide-react"

interface PortfolioEditorProps {
  html: string
  onHtmlChange: (html: string) => void
}

type ViewportSize = "desktop" | "tablet" | "mobile"

const VIEWPORTS: { id: ViewportSize; label: string; icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "375px" },
]

// Script injected into the iframe to enable editing
function getEditorScript(): string {
  return `
<script>
(function() {
  let editMode = false;
  let imageInput = null;
  let targetImg = null;

  // Listen for messages from parent
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
    
    // Make all text elements editable
    const textEls = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, div.project-desc, div.section-desc, div.hero-bio, div.stat-label, div.stat-num, div.hero-name, div.hero-role, .project-name, .project-desc, .section-label, .section-title, .section-desc, .hero-anim, .tag, .skill-badge');
    textEls.forEach(function(el) {
      if (on) {
        // Skip containers that have many children
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

    // Make images clickable to replace
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
    // Debounced notify
    clearTimeout(window._editTimer);
    window._editTimer = setTimeout(notifyParent, 500);
  }

  function handleImageClick(e) {
    e.preventDefault();
    e.stopPropagation();
    targetImg = e.target;
    // Ask parent to open file picker
    window.parent.postMessage({ type: 'REQUEST_IMAGE_UPLOAD' }, '*');
  }

  function addImageOverlay(img) {
    if (img.parentElement.querySelector('.img-edit-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'img-edit-overlay';
    overlay.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Click to replace</span>';
    overlay.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(0,0,0,0.5);opacity:0;transition:opacity .2s;cursor:pointer;pointer-events:none;z-index:50;border-radius:inherit;';
    overlay.querySelector('span').style.cssText = 'font-size:11px;color:white;font-weight:600;letter-spacing:0.5px;';
    
    // Ensure parent is positioned
    const parent = img.parentElement;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(overlay);
    
    img.addEventListener('mouseenter', function() { overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto'; });
    img.addEventListener('mouseleave', function() { overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; });
    overlay.addEventListener('mouseenter', function() { overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto'; });
    overlay.addEventListener('mouseleave', function() { overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; });
    overlay.addEventListener('click', function(ev) { handleImageClick({ preventDefault: function(){}, stopPropagation: function(){}, target: img }); });
  }

  function removeImageOverlay(img) {
    const overlay = img.parentElement?.querySelector('.img-edit-overlay');
    if (overlay) overlay.remove();
  }

  function notifyParent() {
    // Send updated HTML back to parent
    // Clone to remove editing artifacts
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
    clone.querySelectorAll('.img-edit-overlay').forEach(function(el) { el.remove(); });
    clone.querySelectorAll('.persona-edit-mode').forEach(function(el) { el.classList.remove('persona-edit-mode'); });
    clone.querySelectorAll('script').forEach(function(el) { el.remove(); });
    
    // Re-add the original scripts
    const originalScripts = document.querySelectorAll('script');
    const body = clone.querySelector('body');
    originalScripts.forEach(function(s) {
      const ns = document.createElement('script');
      if (s.src) ns.src = s.src;
      else ns.textContent = s.textContent;
      body.appendChild(ns);
    });

    window.parent.postMessage({ 
      type: 'HTML_UPDATED', 
      html: '<!DOCTYPE html>\\n' + clone.outerHTML 
    }, '*');
  }
})();
<\/script>
<style>
  .persona-edit-mode [contenteditable="true"]:hover {
    outline: 1px dashed rgba(124,92,252,0.4) !important;
    outline-offset: 2px !important;
    border-radius: 4px !important;
  }
  .persona-edit-mode img:hover {
    filter: brightness(0.7) !important;
  }
</style>`
}

export function PortfolioEditor({ html, onHtmlChange }: PortfolioEditorProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [editMode, setEditMode] = useState(false)
  const [editHistory, setEditHistory] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentViewport = VIEWPORTS.find((v) => v.id === viewport)!

  // Inject editor script into the HTML
  const editorHtml = html.replace("</body>", getEditorScript() + "</body>")

  // Toggle edit mode in iframe
  const toggleEdit = useCallback(() => {
    const newMode = !editMode
    if (newMode && !editMode) {
      // Save current state to history before editing
      setEditHistory((prev) => [...prev.slice(-9), html])
    }
    setEditMode(newMode)
    iframeRef.current?.contentWindow?.postMessage(
      { type: "TOGGLE_EDIT", enabled: newMode },
      "*"
    )
  }, [editMode, html])

  // Undo last change
  const undo = useCallback(() => {
    if (editHistory.length === 0) return
    const prev = editHistory[editHistory.length - 1]
    setEditHistory((h) => h.slice(0, -1))
    onHtmlChange(prev)
  }, [editHistory, onHtmlChange])

  // Listen for messages from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data.type === "HTML_UPDATED" && e.data.html) {
        onHtmlChange(e.data.html)
      }
      if (e.data.type === "REQUEST_IMAGE_UPLOAD") {
        fileInputRef.current?.click()
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onHtmlChange])

  // Handle image file selection
  const handleImageFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !file.type.startsWith("image/")) return
      if (file.size > 5 * 1024 * 1024) return

      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        // Save history before image change
        setEditHistory((prev) => [...prev.slice(-9), html])
        iframeRef.current?.contentWindow?.postMessage(
          { type: "REPLACE_IMAGE", dataUrl },
          "*"
        )
      }
      reader.readAsDataURL(file)
      // Reset input so the same file can be selected again
      e.target.value = ""
    },
    [html]
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Edit controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={toggleEdit}
            className={cn(
              "gap-1.5 text-xs transition-all duration-300",
              editMode
                ? "bg-[var(--persona-accent)] text-[var(--persona-bg)] hover:bg-[var(--persona-accent)]/90 shadow-lg shadow-[var(--persona-accent)]/20"
                : "border-[var(--persona-border)]"
            )}
          >
            {editMode ? (
              <>
                <Eye className="size-3.5" />
                Done Editing
              </>
            ) : (
              <>
                <Pencil className="size-3.5" />
                Edit Portfolio
              </>
            )}
          </Button>
          {editMode && (
            <>
              <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-md bg-secondary/50 border border-[var(--persona-border)]">
                <Type className="size-3" />
                <span className="hidden sm:inline">Click text to edit</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-md bg-secondary/50 border border-[var(--persona-border)]">
                <ImagePlus className="size-3" />
                <span className="hidden sm:inline">Hover images to replace</span>
              </div>
            </>
          )}
          {editHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="size-3.5" />
              Undo
            </Button>
          )}
        </div>

        {/* Right: Viewport toggle */}
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
                  "gap-1.5 text-xs rounded-full transition-all duration-300",
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
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />

      {/* Iframe Container */}
      <div className="flex justify-center rounded-xl border border-[var(--persona-border)] bg-[var(--persona-surface)] p-4 overflow-hidden">
        <div
          className="transition-all duration-500 ease-out"
          style={{ width: currentViewport.width, maxWidth: "100%" }}
        >
          <div className={cn(
            "rounded-lg overflow-hidden border shadow-xl transition-all duration-300",
            editMode
              ? "border-[var(--persona-accent)]/40 shadow-[var(--persona-accent)]/10"
              : "border-[var(--persona-border)]"
          )}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--persona-surface-hover)] border-b border-[var(--persona-border)]">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-red-400/60" />
                <div className="size-2.5 rounded-full bg-amber-400/60" />
                <div className="size-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-5 rounded-md bg-muted/20 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/50 font-mono">
                    {editMode ? "editing - portfolio.html" : "portfolio.html"}
                  </span>
                </div>
              </div>
              {editMode && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--persona-accent)]/10 border border-[var(--persona-accent)]/20">
                  <div className="size-1.5 rounded-full bg-[var(--persona-accent)] animate-pulse" />
                  <span className="text-[9px] font-medium text-[var(--persona-accent)]">EDIT MODE</span>
                </div>
              )}
            </div>
            {/* Iframe */}
            <iframe
              ref={iframeRef}
              srcDoc={editorHtml}
              title="Portfolio preview"
              className="w-full border-0 bg-white"
              style={{ height: "600px" }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
