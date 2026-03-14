import { LayoutTemplate, Palette, Download, Printer } from "lucide-react"

const features = [
  {
    icon: LayoutTemplate,
    title: "100+ Templates",
    description: "Choose from a wide variety of professionally designed templates for every occasion.",
  },
  {
    icon: Palette,
    title: "Easy Customization",
    description: "Personalize your cards with our intuitive editor. Change fonts, colors, and add your own images.",
  },
  {
    icon: Download,
    title: "Instant Download",
    description: "Download your finished cards immediately in high-quality PNG or PDF format.",
  },
  {
    icon: Printer,
    title: "Print Ready",
    description: "All cards are designed to be print-ready at standard greeting card sizes.",
  },
]

export function FeaturesSection() {
  return (
    <section className="border-y border-border bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to create amazing cards
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Simple, powerful tools to help you express yourself
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
