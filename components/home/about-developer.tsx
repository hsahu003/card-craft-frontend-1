import React from "react"
import { Mail, Phone } from "lucide-react"

export function AboutDeveloper() {
  return (
    <section id="about-developer" className="py-24 bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            About the Developer
          </h2>
          <div className="h-1 w-16 bg-primary mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
             <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-8 border-background shadow-2xl">
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <span className="text-7xl font-bold text-primary">H</span>
                </div>
             </div>
          </div>
          <div className="lg:col-span-7">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Hi, I’m Hemendra.</h3>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              I am a Full-Stack Engineer with 5+ years of industry experience across SaaS, EdTech, and E-commerce. I specialize in building complete digital products from the database up to the user interface.
            </p>
            <div className="space-y-4">
              <div className="bg-background rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-foreground flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                   Backend & Architecture
                </h4>
                <p className="text-sm text-muted-foreground mt-2 ml-5.5 pl-0.5">
                  Java (Spring Boot), PHP (Laravel), MySQL, and RESTful API Design.
                </p>
              </div>
              <div className="bg-background rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-foreground flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                   Frontend & AI
                </h4>
                <p className="text-sm text-muted-foreground mt-2 ml-5.5 pl-0.5">
                  React.js, Next.js, and Generative AI integration.
                </p>
              </div>
              <div className="bg-background rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-foreground flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                   Design Foundations
                </h4>
                <p className="text-sm text-muted-foreground mt-2 ml-5.5 pl-0.5">
                  UI/UX and freelance graphic design experience.
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
              <h4 className="text-xl font-bold text-foreground mb-4">Let's Connect</h4>
              <div className="flex flex-col sm:flex-row gap-6">
                <a href="mailto:hsahu003@protonmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors bg-background px-4 py-3 rounded-lg border border-border shadow-sm hover:shadow-md">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">hsahu003@protonmail.com</span>
                </a>
                <a href="tel:+919589680824" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors bg-background px-4 py-3 rounded-lg border border-border shadow-sm hover:shadow-md">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">+91 9589680824</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
