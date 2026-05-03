import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      )
    }

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    // First, try `pdfjs-dist` (Vercel-recommended) if it's available in the runtime.
    try {
      // dynamic import so it only loads when present
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js')
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        // eslint-disable-next-line no-await-in-loop
        const page = await pdf.getPage(i)
        // eslint-disable-next-line no-await-in-loop
        const content = await page.getTextContent()
        const pageText = content.items.map((it: any) => it.str).join(' ')
        fullText += pageText + '\n'
      }

      const trimmed = fullText.trim()
      if (trimmed) {
        return NextResponse.json({ text: trimmed })
      }
      // if pdfjs parsed nothing, fall through to fallback
    } catch (e) {
      // ignore and fallback to pdf-parse shim approach
    }

    // Fallback: many PDF parsing libraries historically call the deprecated Buffer() constructor.
    // To avoid the deprecation warning, temporarily shim the global Buffer so function-style
    // calls delegate to Buffer.from(), then restore it after using `pdf-parse`.
    const originalBuffer = (globalThis as any).Buffer
    let didShim = false
    if (typeof originalBuffer === 'function') {
      const shim: any = function (arg: any) {
        return originalBuffer.from(arg)
      }
      try {
        Object.getOwnPropertyNames(originalBuffer).forEach((k) => {
          try { (shim as any)[k] = (originalBuffer as any)[k] } catch {}
        })
        ;(shim as any).prototype = (originalBuffer as any).prototype
        ;(globalThis as any).Buffer = shim
        didShim = true
      } catch {
        // ignore shim failures
      }
    }

    try {
      // Dynamic import to avoid Next.js bundling issues
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
      const buffer = (originalBuffer && typeof originalBuffer.from === 'function')
        ? originalBuffer.from(arrayBuffer)
        : Buffer.from(arrayBuffer as any)

      const parsed = await pdfParse(buffer)

      if (!parsed.text || parsed.text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Could not extract text from PDF. The file may be image-based.' },
          { status: 422 }
        )
      }

      return NextResponse.json({ text: parsed.text.trim() })
    } finally {
      if (didShim) {
        try { (globalThis as any).Buffer = originalBuffer } catch {}
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse resume"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
