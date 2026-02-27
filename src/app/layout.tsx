import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import type { Metadata } from 'next'
import type React from 'react'
import { IntlProvider } from '@/components/providers/intl-provider'
import { QueryProvider } from '@/components/providers/query-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BioFlow AI',
  description: 'BioFlow AI Web Application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='zh' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <IntlProvider>{children}</IntlProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

