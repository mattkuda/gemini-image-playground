import { NextRequest, NextResponse } from "next/server"

// Simple placeholder image API endpoint for development
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const style = searchParams.get("style") || "default"
    const seed = searchParams.get("seed") || "1"

    // Return a placeholder SVG with styling based on the art style
    const svg = generatePlaceholderSVG(style, seed)

    return new NextResponse(svg, {
        headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600"
        }
    })
}

// Generate a unique placeholder SVG based on style and seed
function generatePlaceholderSVG(style: string, seed: string): string {
    // Create a deterministic color based on style and seed
    const hash = hashCode(`${style}-${seed}`)
    const hue = Math.abs(hash % 360)
    const saturation = 70 + (Math.abs(hash >> 4) % 30)
    const lightness = 40 + (Math.abs(hash >> 8) % 30)

    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    const textColor = `hsl(${hue}, 10%, 90%)`

    // Generate an SVG with the style name and some creative elements
    return `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${backgroundColor}" />
    <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="24" 
          fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
      ${style} - ${seed}
    </text>
    <circle cx="${200 + (hash % 112)}" cy="${150 + ((hash >> 4) % 112)}" r="${20 + (hash % 20)}" 
            fill="${textColor}" opacity="0.7" />
    <rect x="${250 + ((hash >> 8) % 112)}" y="${300 + ((hash >> 12) % 112)}" 
          width="${40 + ((hash >> 16) % 40)}" height="${40 + ((hash >> 20) % 40)}" 
          fill="${textColor}" opacity="0.5" />
  </svg>`
}

// Simple string hash function
function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
    }
    return hash
} 