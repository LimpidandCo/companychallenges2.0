import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@/components/providers/clerk-provider'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'Company Challenges',
    template: '%s | Company Challenges',
  },
  description: 'A platform for organizations to share structured learning trajectories with their employees.',
  keywords: ['learning', 'challenges', 'training', 'education', 'enterprise'],
  authors: [{ name: 'Company Challenges' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  robots: {
    index: false,
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
        <body className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${plusJakarta.className} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
