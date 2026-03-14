import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Search, Palette, Download, Send, ArrowRight } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Choose a Template",
    description:
      "Browse our collection of over 100 professionally designed templates. Filter by category to find the perfect card for your occasion.",
  },
  {
    number: "02",
    icon: Palette,
    title: "Customize Your Card",
    description:
      "Use our intuitive editor to add your personal message, change fonts, colors, and upload your own photos. Make it uniquely yours.",
  },
  {
    number: "03",
    icon: Download,
    title: "Download Instantly",
    description:
      "Once you're happy with your design, download it instantly in high-quality PNG or PDF format. Print-ready quality guaranteed.",
  },
  {
    number: "04",
    icon: Send,
    title: "Share the Love",
    description:
      "Print your card at home or a local print shop, or share it digitally via email and social media. Spread joy your way.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              How It Works
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Creating your perfect greeting card is simple. Follow these easy steps to design, customize, and share your heartfelt message.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="border-y border-border bg-card py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`flex flex-col items-center gap-8 md:flex-row ${
                    index % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/10">
                      <step.icon className="h-16 w-16 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 1 ? "md:text-right" : ""}`}>
                    <div className="text-sm font-bold text-accent">{step.number}</div>
                    <h3 className="mt-2 text-2xl font-bold text-foreground">{step.title}</h3>
                    <p className="mt-3 text-lg text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to Create Your Card?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Start designing your personalized greeting card in minutes. No design skills required.
            </p>
            <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/templates">
                Browse Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
