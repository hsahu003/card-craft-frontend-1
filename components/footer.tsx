import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-8">
            <Link href="/" className="shrink-0">
              <span className="text-[28px] font-black italic text-[#E13B30] tracking-tight font-sans select-none">
                Cardcraft
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Whether it’s a birthday, wedding, or any special occasion, our on-the-go template editor makes designing personalized invitations effortless.
              In just three simple steps—<strong className="font-semibold text-foreground">choose</strong>, <strong className="font-semibold text-foreground">customize</strong>, and <strong className="font-semibold text-foreground">download</strong>—you can create a beautiful, shareable PDF invitation for your loved ones.
            </p>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="text-base font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hsahu003@protonmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <span className="font-medium">Email:</span> hsahu003@protonmail.com
                </a>
              </li>
              <li>
                <a href="tel:+919589680824" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <span className="font-medium">Contact:</span> +91 9589680824
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CardCraft. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/about-developer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About Developer
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
