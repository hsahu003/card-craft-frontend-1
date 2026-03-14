import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your Card is Ready!🎉
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Your personalized greeting card is ready for download.
            </p>
          </div>

          {/* Card Preview - ready-to-print image */}
          <div className="mt-10 flex justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-muted/60 p-6 shadow-inner">
              <Image
                src="/ready-to-print.png"
                alt="Your greeting card ready to print"
                width={600}
                height={350}
                className="w-full rounded-lg object-contain"
                priority
              />
            </div>
          </div>

          {/* Download PDF */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="bg-primary px-8 text-primary-foreground hover:bg-primary/90"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </div>

          {/* How to get printed - dialog style */}
          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-sm">
              {/* Header bar */}
              <div className="relative flex items-center justify-center rounded-t-xl overflow-hidden border-b border-border bg-card px-4 py-4">
                {/* Decorative corner shapes */}
                <div className="absolute left-0 top-0 h-9 w-9 rounded-tl-xl rounded-br-full bg-primary" />
                <div className="absolute bottom-0 right-0 h-9 w-9 rounded-tl-full bg-accent" />

                <h3 className="text-sm font-semibold text-foreground">
                  How to get printed
                </h3>
              </div>

              {/* Body with instructions */}
              <div className="bg-muted/50 px-5 py-4">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Choose a sheet larger than 5 by 7 inches</li>
                  <li>• Thickness of sheet should be 200 GSM</li>
                  <li>• Consider getting printed with industrial printer</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
