import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { AllTemplates } from "@/components/home/all-templates"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroCarousel />
        <AllTemplates />
      </main>
      <Footer />
    </div>
  )
}
