import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AboutDeveloper } from "@/components/home/about-developer"

export default function AboutDeveloperPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center">
        <AboutDeveloper />
      </main>
      <Footer />
    </div>
  )
}
