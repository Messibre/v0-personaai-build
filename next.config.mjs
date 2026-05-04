/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next.js from bundling these Node-native packages at build time.
  // They must be required at runtime in the Node.js serverless environment.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
}

export default nextConfig
