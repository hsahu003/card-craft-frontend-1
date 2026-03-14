"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const slides = [
  {
    id: 1,
    heading: "Lorem ipsum dolor,\nGonsectetur adipiscing.",
    subtext: "Lorem ipsum dolor sit amet,\nDonec bibendum auctor rhoncus.",
    buttonText: "Sample Button",
    buttonLink: "/templates",
    bgColor: "#F5C518",
  },
  {
    id: 2,
    heading: "Beautiful Wedding Cards\nFor Your Special Day",
    subtext: "Create memorable invitations,\nCustomize every detail.",
    buttonText: "Explore Wedding",
    buttonLink: "/templates?category=wedding",
    bgColor: "#E8733A",
  },
  {
    id: 3,
    heading: "Celebrate Birthdays\nWith Personalized Cards",
    subtext: "Make every birthday special,\nDesign unique greetings.",
    buttonText: "Shop Birthday",
    buttonLink: "/templates?category=birthday",
    bgColor: "#1E5FAD",
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <section className="w-full py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-2xl transition-colors duration-500"
          style={{ backgroundColor: slides[currentSlide].bgColor }}
        >
          <div className="flex min-h-[350px] flex-col md:min-h-[420px] md:flex-row">
            {/* Left Content */}
            <div className="flex flex-1 flex-col justify-center p-8 md:p-12">
              <h2 className="whitespace-pre-line text-2xl font-bold leading-tight text-foreground md:text-3xl lg:text-4xl">
                {slides[currentSlide].heading}
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm text-foreground/80 md:text-base">
                {slides[currentSlide].subtext}
              </p>
              <div className="mt-6">
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link href={slides[currentSlide].buttonLink}>
                    {slides[currentSlide].buttonText}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === currentSlide
                    ? "bg-primary"
                    : "bg-card/60 hover:bg-card/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
