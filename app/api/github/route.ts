import { NextResponse } from "next/server"
import { fetchGitHubProfile, fetchGitHubRepos } from "@/lib/github"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9-]/g, "")

    if (!sanitizedUsername) {
      return NextResponse.json(
        { error: "Invalid username" },
        { status: 400 }
      )
    }

    const [profile, repos] = await Promise.all([
      fetchGitHubProfile(sanitizedUsername),
      fetchGitHubRepos(sanitizedUsername),
    ])

    return NextResponse.json({ profile, repos })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch GitHub data"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
