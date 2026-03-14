import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Single Card",
    description: "Perfect for one-time use",
    price: "79",
    priceNote: "per card",
    features: [
      "Access to all templates",
      "Full customization",
      "High-quality PNG download",
      "PDF download",
      "Print-ready format",
    ],
    cta: "Start Creating",
    popular: false,
  },
  {
    name: "Bundle Pack",
    description: "Best value for multiple cards",
    price: "199",
    priceNote: "for 5 cards",
    features: [
      "Everything in Single Card",
      "Save 50% per card",
      "Priority support",
      "Commercial use license",
      "No expiration date",
    ],
    cta: "Get Bundle",
    popular: true,
  },
  {
    name: "Unlimited",
    description: "For businesses & power users",
    price: "499",
    priceNote: "per year",
    features: [
      "Everything in Bundle Pack",
      "Unlimited cards",
      "Premium templates",
      "Team collaboration",
      "Custom branding",
    ],
    cta: "Go Unlimited",
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Choose the plan that works best for you. No hidden fees, no surprises.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border bg-card p-8 ${
                    plan.popular
                      ? "border-primary shadow-lg ring-2 ring-primary"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-6">
                      <span className="text-5xl font-bold text-foreground">₹{plan.price}</span>
                      <span className="ml-2 text-muted-foreground">{plan.priceNote}</span>
                    </div>
                  </div>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`mt-8 w-full ${
                      plan.popular
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    <Link href="/templates">{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-card py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="mt-12 space-y-8">
              <div>
                <h3 className="font-semibold text-foreground">
                  Can I use the cards for commercial purposes?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Yes! With the Bundle Pack and Unlimited plans, you get a commercial use license that allows you to use the cards for business purposes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Do the cards expire?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  No, once you purchase a card, you can download it anytime. There's no expiration date on your purchases.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  What payment methods do you accept?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  We accept all major credit cards, debit cards, and UPI payments for your convenience.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
