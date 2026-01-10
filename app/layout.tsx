import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@/components/providers/clerk-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Company Challenges',
    template: '%s | Company Challenges',
  },
  description: 'A platform for organizations to share structured learning trajectories with their employees.',
  keywords: ['learning', 'challenges', 'training', 'education', 'enterprise'],
  authors: [{ name: 'Company Challenges' }],
  robots: {
    index: false, // Don't index by default (participant URLs are private)
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
