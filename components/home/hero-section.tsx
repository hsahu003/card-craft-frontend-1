import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
          <div className="h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Over 100+ beautiful templates</span>
          </div>

          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Create Cards That Feel{" "}
            <span className="text-primary">Personal</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Design beautiful, personalized greeting cards for birthdays, weddings, holidays, and more. Customize with your own message and download instantly.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/templates">
                Browse Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Preview Cards */}
          <div className="mt-16 flex items-center justify-center gap-4">
            <div className="relative h-48 w-36 rotate-[-8deg] overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-transform hover:rotate-0 sm:h-64 sm:w-48">
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 p-4">
                <div className="text-4xl sm:text-6xl">🎂</div>
                <p className="mt-2 text-center text-sm font-medium text-pink-800">Happy Birthday!</p>
              </div>
            </div>
            <div className="relative z-10 h-56 w-40 overflow-hidden rounded-lg border border-border bg-card shadow-xl sm:h-72 sm:w-56">
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 p-4">
                <div className="text-5xl sm:text-7xl">💐</div>
                <p className="mt-2 text-center text-sm font-medium text-blue-800">Thank You!</p>
              </div>
            </div>
            <div className="relative h-48 w-36 rotate-[8deg] overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-transform hover:rotate-0 sm:h-64 sm:w-48">
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-red-100 to-red-200 p-4">
                <div className="text-4xl sm:text-6xl">💕</div>
                <p className="mt-2 text-center text-sm font-medium text-red-800">With Love</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
