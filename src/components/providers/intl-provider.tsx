'use client'

import Cookies from 'js-cookie'
import { NextIntlClientProvider } from 'next-intl'
import type React from 'react'
import { useEffect, useState } from 'react'
import { defaultLocale, type Locale } from '@/i18n/config'

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [messages, setMessages] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const cookieLocale = (Cookies.get('locale') as Locale) || defaultLocale
    setLocale(cookieLocale)
    const loader =
      cookieLocale === 'en'
        ? import('../../../messages/en.json')
        : import('../../../messages/zh.json')
    loader.then((mod) => {
      setMessages(mod.default)
    })
  }, [])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
