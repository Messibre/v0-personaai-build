export type ErrorContext =
  | "github"
  | "notion"
  | "resume"
  | "aiContent"
  | "portfolio"
  | "deploy"
  | "template"
  | "generic"

const DEFAULT_MESSAGES: Record<ErrorContext, string> = {
  github: "We couldn’t load GitHub right now. Please try again in a minute.",
  notion: "We couldn’t fetch that Notion page right now. Please try again later.",
  resume: "We couldn’t read that resume right now. Please try again with another PDF.",
  aiContent: "We couldn’t generate AI content right now. Please try again in a few minutes.",
  portfolio: "We couldn’t build your portfolio right now. Please try again shortly.",
  deploy: "We couldn’t deploy your portfolio right now. Please try again later.",
  template: "We couldn’t update the template right now. Please try again.",
  generic: "Something went wrong. Please try again in a moment.",
}

function hasAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase))
}

export function getFriendlyErrorMessage(rawError: unknown, context: ErrorContext = "generic"): string {
  const fallback = DEFAULT_MESSAGES[context]

  if (rawError == null) return fallback

  const message = String(rawError instanceof Error ? rawError.message : rawError).trim()
  if (!message) return fallback

  const normalized = message.toLowerCase()

  if (
    hasAny(normalized, ["429", "rate limit", "quota", "billing", "too many requests"]) ||
    hasAny(normalized, ["gemini_rate_limited_or_timed_out"])
  ) {
    if (context === "aiContent") {
      return "AI generation is temporarily busy. Please try again in a few minutes."
    }
    if (context === "github") {
      return "GitHub is rate limited right now. Please try again in a few minutes."
    }
    return "That service is busy right now. Please try again in a few minutes."
  }

  if (hasAny(normalized, ["timeout", "aborted", "timed out", "deadline exceeded"])) {
    if (context === "resume") {
      return "That PDF took too long to read. Please try a smaller file or try again later."
    }
    if (context === "aiContent") {
      return "AI generation took too long. Please try again in a few minutes."
    }
    return fallback
  }

  if (hasAny(normalized, ["network error", "fetch failed", "failed to fetch", "failed to parse" ])) {
    if (context === "resume") {
      return "We couldn’t read that PDF right now. Please try again with another file."
    }
    if (context === "notion") {
      return "We couldn’t load that page right now. Please check the link and try again."
    }
    if (context === "github") {
      return "We couldn’t load GitHub right now. Please check the username and try again."
    }
    return fallback
  }

  if (context === "resume") {
    if (normalized.includes("only pdf files are accepted")) return "Please upload a PDF resume file."
    if (normalized.includes("file size exceeds")) return "That file is too large. Please use a PDF under 5MB."
    if (normalized.includes("image-based")) return "We couldn’t extract text from that PDF. Please try a text-based PDF or another file."
  }

  if (context === "notion") {
    if (normalized.includes("not published")) return "Please publish the Notion page to the web and try again."
    if (normalized.includes("could not extract content")) return "We couldn’t read that Notion page. Please check the link and try again."
  }

  if (context === "github") {
    if (normalized.includes("not found")) return "We couldn’t find that GitHub account. Please double-check the username."
  }

  if (context === "deploy") {
    if (hasAny(normalized, ["vercel", "deployment", "upload"])) {
      return "Deployment didn’t finish. Please try again in a moment."
    }
  }

  if (context === "aiContent") {
    if (normalized.includes("missing or empty") || normalized.includes("parse_error")) {
      return "We couldn’t generate AI content right now. Please try again in a few minutes."
    }
  }

  return fallback
}

export function getFriendlyServerStatusMessage(status: number, context: ErrorContext = "generic"): string {
  if (status === 429) {
    return context === "aiContent"
      ? "AI generation is busy right now. Please try again in a few minutes."
      : "That service is busy right now. Please try again in a few minutes."
  }

  if (status >= 500) {
    return DEFAULT_MESSAGES[context]
  }

  if (status === 404) {
    if (context === "github") return "We couldn’t find that GitHub account. Please check the username and try again."
    if (context === "notion") return "We couldn’t find that Notion page. Please check the link and try again."
  }

  return DEFAULT_MESSAGES[context]
}
