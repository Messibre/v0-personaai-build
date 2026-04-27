import { createHash } from "crypto"

// Vercel API endpoints
const VERCEL_API = "https://api.vercel.com"

interface DeployRequest {
  html: string
  projectName?: string
}

interface FileInfo {
  file: string
  sha: string
  size: number
}

export async function POST(request: Request) {
  try {
    const token = process.env.VERCEL_TOKEN
    if (!token) {
      return Response.json(
        { error: "VERCEL_TOKEN not configured. Please add it in project settings." },
        { status: 500 }
      )
    }

    const { html, projectName = "portfolio" }: DeployRequest = await request.json()

    if (!html || html.length < 100) {
      return Response.json(
        { error: "Invalid HTML content" },
        { status: 400 }
      )
    }

    // Generate a unique project name with timestamp
    const safeName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40)
    const uniqueName = `${safeName}-${Date.now().toString(36)}`

    // Files to deploy
    const files: { path: string; content: string }[] = [
      { path: "index.html", content: html },
      // Add a simple vercel.json for SPA routing
      {
        path: "vercel.json",
        content: JSON.stringify({
          routes: [
            { src: "/(.*)", dest: "/index.html" }
          ]
        }, null, 2)
      }
    ]

    // Step 1: Upload files to Vercel
    const fileInfos: FileInfo[] = []
    
    for (const file of files) {
      const content = Buffer.from(file.content, "utf-8")
      const sha = createHash("sha1").update(content).digest("hex")
      const size = content.length

      // Upload the file
      const uploadRes = await fetch(`${VERCEL_API}/v2/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "x-vercel-digest": sha,
          "Content-Length": size.toString(),
        },
        body: content,
      })

      if (!uploadRes.ok && uploadRes.status !== 409) {
        // 409 means file already exists, which is fine
        const errText = await uploadRes.text()
        console.error("[v0] Vercel file upload failed:", uploadRes.status, errText)
        return Response.json(
          { error: `Failed to upload ${file.path}: ${errText}` },
          { status: 500 }
        )
      }

      fileInfos.push({ file: file.path, sha, size })
    }

    // Step 2: Create deployment
    const deployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: uniqueName,
        files: fileInfos,
        projectSettings: {
          framework: null, // Static site
        },
        target: "production",
      }),
    })

    if (!deployRes.ok) {
      const errData = await deployRes.json().catch(() => ({}))
      console.error("[v0] Vercel deployment failed:", deployRes.status, errData)
      return Response.json(
        { error: errData.error?.message || `Deployment failed: ${deployRes.status}` },
        { status: 500 }
      )
    }

    const deployData = await deployRes.json()
    const deployUrl = `https://${deployData.url}`
    const deployId = deployData.id

    return Response.json({
      success: true,
      url: deployUrl,
      deploymentId: deployId,
      projectName: uniqueName,
    })
  } catch (err) {
    console.error("[v0] Deploy error:", err)
    const message = err instanceof Error ? err.message : "Deployment failed"
    return Response.json({ error: message }, { status: 500 })
  }
}

// Optional: Get deployment status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const deploymentId = searchParams.get("id")

  if (!deploymentId) {
    return Response.json({ error: "Missing deployment ID" }, { status: 400 })
  }

  const token = process.env.VERCEL_TOKEN
  if (!token) {
    return Response.json(
      { error: "VERCEL_TOKEN not configured" },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      return Response.json({ error: "Failed to get deployment status" }, { status: 500 })
    }

    const data = await res.json()
    return Response.json({
      status: data.readyState, // QUEUED, BUILDING, READY, ERROR
      url: data.url ? `https://${data.url}` : null,
    })
  } catch {
    return Response.json({ error: "Failed to check status" }, { status: 500 })
  }
}
