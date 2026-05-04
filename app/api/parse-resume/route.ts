// Force Node.js runtime — pdf-parse uses Node Buffer/fs APIs that are
// unavailable in the Edge runtime and require the full Node environment
// that Vercel's serverless functions provide.
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 },
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // pdf-parse is a pure Node.js library — no worker, no canvas, no filesystem
    // path issues. Works reliably in Vercel serverless functions.
    let text = "";
    try {
      // Dynamic import keeps the bundle lean and avoids Turbopack static analysis
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      text = result.text?.trim() ?? "";
    } catch (primaryErr) {
      // Fallback: pdfjs-dist in legacy mode without a worker
      console.log("[v0] pdf-parse failed, falling back to pdfjs-dist:", primaryErr);
      try {
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
        const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;
        // Disable the worker entirely so pdfjs runs synchronously in-process
        pdfjs.GlobalWorkerOptions = pdfjs.GlobalWorkerOptions ?? {};
        pdfjs.GlobalWorkerOptions.workerSrc = "";

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it: any) => it.str).join(" ") + "\n";
        }
        text = text.trim();
      } catch (fallbackErr) {
        console.log("[v0] pdfjs-dist fallback also failed:", fallbackErr);
        throw fallbackErr;
      }
    }

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. It may be image-based or scanned. Try a text-based PDF.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ text, parserUsed: "pdf-parse" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to parse resume";
    console.error("[v0] parse-resume error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
