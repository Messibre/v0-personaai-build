import type { GitHubProfile, GitHubRepo } from "./types"

const GITHUB_API = "https://api.github.com"

export async function fetchGitHubProfile(username: string): Promise<GitHubProfile> {
  const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "PersonaAI-Portfolio-Generator",
    },
  })

  if (res.status === 404) {
    throw new Error(`GitHub user "${username}" not found`)
  }

  if (res.status === 403) {
    throw new Error("GitHub API rate limit exceeded. Please try again later.")
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`)
  }

  const data = await res.json()

  return {
    username: data.login,
    name: data.name,
    bio: data.bio,
    avatar_url: data.avatar_url,
    followers: data.followers,
    following: data.following,
    public_repos: data.public_repos,
    html_url: data.html_url,
    location: data.location,
    blog: data.blog,
    company: data.company,
  }
}

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?sort=stars&direction=desc&per_page=30&type=owner`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "PersonaAI-Portfolio-Generator",
      },
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch repos: ${res.status}`)
  }

  const data = await res.json()

  return data
    .filter((repo: { fork: boolean }) => !repo.fork)
    .slice(0, 20)
    .map((repo: Record<string, unknown>) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count || 0,
      html_url: repo.html_url,
      fork: repo.fork,
      topics: repo.topics || [],
      homepage: repo.homepage,
    }))
}
