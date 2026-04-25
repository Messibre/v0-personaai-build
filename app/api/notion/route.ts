import { NextResponse } from "next/server"

function extractPageId(url: string): string | null {
  // Notion URLs can be like:
  // https://www.notion.so/Page-Title-abc123def456
  // https://notion.so/workspace/Page-Title-abc123def456
  // https://www.notion.so/abc123def456abc123def456abc123de
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes("notion.so") && !parsed.hostname.includes("notion.site")) {
      return null
    }
    const pathParts = parsed.pathname.split("/").filter(Boolean)
    const lastPart = pathParts[pathParts.length - 1] || ""
    // Extract the 32-char hex ID from the end of the path
    const match = lastPart.match(/([a-f0-9]{32})$/i) || lastPart.match(/([a-f0-9-]{36})$/i)
    if (match) {
      return match[1].replace(/-/g, "")
    }
    // Try the last segment with dashes
    const dashMatch = lastPart.match(/-([a-f0-9]{32})$/i)
    if (dashMatch) {
      return dashMatch[1]
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { content: null, error: "URL is required" },
        { status: 400 }
      )
    }

    const pageId = extractPageId(url)
    if (!pageId) {
      return NextResponse.json(
        { content: null, error: "Could not parse Notion page ID from URL. Please ensure it's a valid Notion page URL." },
        { status: 400 }
      )
    }

    // Use notion-client (unofficial) to fetch the page
    const { NotionAPI } = await import("notion-client")
    const notion = new NotionAPI()
    const recordMap = await notion.getPage(pageId)

    // Extract text from block values
    const blocks = Object.values(recordMap.block || {})
    const textParts: string[] = []

    for (const block of blocks) {
      const value = block?.value
      if (!value) continue

      // Extract from title/text arrays (Notion internal format)
      const properties = value.properties
      if (properties?.title) {
        const titleText = properties.title
          .map((segment: unknown[]) => (typeof segment[0] === "string" ? segment[0] : ""))
          .join("")
        if (titleText.trim()) textParts.push(titleText.trim())
      }
    }

    const content = textParts.join("\n").trim()

    if (!content) {
      return NextResponse.json({
        content: null,
        error: "Could not extract text content from this Notion page. It may be private or have restricted access.",
      })
    }

    return NextResponse.json({
      content,
      title: textParts[0]?.substring(0, 100) || "Notion Page",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch Notion content"
    return NextResponse.json(
      { content: null, error: `Could not fetch Notion page: ${message}` },
      { status: 200 } // Return 200 even on error so it doesn't block the wizard
    )
  }
}
