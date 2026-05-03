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

    // Use pdfjs-dist to parse PDF without relying on Buffer() constructor.
    // Dynamic import keeps the package out of the main bundle when not needed.
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js')
    // Node/Server needs worker disabled; use getDocument with data as ArrayBuffer
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
    if (!trimmed) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. The file may be image-based.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text: trimmed })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse resume"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
