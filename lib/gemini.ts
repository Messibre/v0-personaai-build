const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[]

const GEMINI_MODEL = "gemini-2.0-flash"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
    code?: number
  }
}

export async function callGemini(prompt: string): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured. Set GEMINI_API_KEY_1 and/or GEMINI_API_KEY_2.")
  }

  let lastError: Error | null = null

  for (const key of GEMINI_KEYS) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16384,
          },
        }),
      })

      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Gemini API returned ${res.status}`)
        continue
      }

      if (!res.ok) {
        const errorBody = await res.text()
        lastError = new Error(`Gemini API error ${res.status}: ${errorBody}`)
        continue
      }

      const data: GeminiResponse = await res.json()

      if (data.error) {
        lastError = new Error(data.error.message || "Unknown Gemini error")
        continue
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        lastError = new Error("Gemini returned empty response")
        continue
      }

      return text
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      continue
    }
  }

  throw lastError || new Error("All Gemini API keys failed")
}
