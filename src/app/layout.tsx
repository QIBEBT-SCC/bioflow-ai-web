import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type React from 'react'
import { QueryProvider } from '@/components/providers/query-provider'
import { ACCENT_COOKIE, defaultAccent, isAccentColor } from '@/lib/theme'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// @ts-expect-error no need
export async function generateMetadata({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const storedAccent = (await cookies()).get(ACCENT_COOKIE)?.value
  const accent = isAccentColor(storedAccent) ? storedAccent : defaultAccent

  return (
    <html lang='zh' data-accent={accent} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
