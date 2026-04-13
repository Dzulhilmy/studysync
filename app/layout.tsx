import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AccessibilityMenu from '@/components/AccessibilityMenu';
import ScrollToTop from '@/components/ScrollToTop';
import { Analytics } from "@vercel/analytics/next"

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
})

export const metadata: Metadata = {
  title: 'StudySync',
  description: 'Web-based learning and monitoring system for secondary school',
   icons: {
    icon: 'public/Image_Logo.png',        // put your logo at public/logo.png
    apple: 'public/Image_Logo.png',       // for Apple devices
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${quicksand.variable} font-sans bg-parchment text-ink`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <ScrollToTop />
        <AccessibilityMenu />
        <Analytics />
      </body>
    </html>
  )
}
