import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/contexts/cart-context'
import { OrdersProvider } from '@/contexts/orders-context'
import { UserProvider } from '@/contexts/user-context'
import { WishlistProvider } from '@/contexts/wishlist-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'CardCraft - Create Cards That Feel Personal',
  description: 'Design and customize beautiful greeting cards for any occasion. Choose from 100+ templates, personalize with your message, and download instantly.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <UserProvider>
          <WishlistProvider>
            <CartProvider>
              <OrdersProvider>
                {children}
                <Analytics />
              </OrdersProvider>
            </CartProvider>
          </WishlistProvider>
        </UserProvider>
      </body>
    </html>
  )
}
