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

    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic import to avoid Next.js bundling issues
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default
    const parsed = await pdfParse(buffer)

    if (!parsed.text || parsed.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. The file may be image-based." },
        { status: 422 }
      )
    }

    return NextResponse.json({ text: parsed.text.trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse resume"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
