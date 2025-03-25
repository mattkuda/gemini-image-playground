import SketchToImageGenerator from "@/components/sketch-to-image-generator"
import { Sparkles } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto space-y-8 py-6">
        <div className="space-y-3 text-center pb-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zinc-800/50 border border-zinc-700/50 text-zinc-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-zinc-300" />
            Powered by Gemini Flash
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 to-zinc-400">
            Sketch to Image
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Draw a sketch or upload an image and watch as Gemini Flash transforms it into professional art
          </p>
        </div>
        <SketchToImageGenerator />
        <footer className="text-xs text-center text-muted-foreground mt-10">
          <p>© {new Date().getFullYear()} Sketch to Image Generator | Built with Next.js and Gemini Flash</p>
        </footer>
      </div>
    </main>
  )
}

