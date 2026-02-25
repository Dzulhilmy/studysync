import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AccessibilityMenu from '@/components/AccessibilityMenu'; // 1. IMPORT IT HERE

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
})

export const metadata: Metadata = {
  title: 'StudySync',
  description: 'Web-based learning and monitoring system for secondary school',
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
        <AccessibilityMenu />
      </body>
    </html>
  )
}
