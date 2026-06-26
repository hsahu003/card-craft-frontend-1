import Image from "next/image"

export function HeroCarousel() {
  return (
    <section className="w-full py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl w-full" style={{ aspectRatio: "1154/380" }}>
          <Image
            src="/assets/images/cover.png"
            alt="How it works"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}
