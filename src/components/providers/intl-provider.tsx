'use client'

import Cookies from 'js-cookie'
import { NextIntlClientProvider } from 'next-intl'
import type React from 'react'
import { useEffect, useState } from 'react'
import { defaultLocale, type Locale } from '@/i18n/config'

async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  const modules =
    locale === 'en'
      ? await Promise.all([
          import('../../../messages/en/common.json'),
          import('../../../messages/en/home.json'),
          import('../../../messages/en/login.json'),
          import('../../../messages/en/chat.json'),
          import('../../../messages/en/editor.json'),
          import('../../../messages/en/resource.json'),
          import('../../../messages/en/setting.json'),
          import('../../../messages/en/image.json'),
          import('../../../messages/en/tool.json'),
          import('../../../messages/en/code.json'),
          import('../../../messages/en/project.json'),
          import('../../../messages/en/task.json'),
        ])
      : await Promise.all([
          import('../../../messages/zh/common.json'),
          import('../../../messages/zh/home.json'),
          import('../../../messages/zh/login.json'),
          import('../../../messages/zh/chat.json'),
          import('../../../messages/zh/editor.json'),
          import('../../../messages/zh/resource.json'),
          import('../../../messages/zh/setting.json'),
          import('../../../messages/zh/image.json'),
          import('../../../messages/zh/tool.json'),
          import('../../../messages/zh/code.json'),
          import('../../../messages/zh/project.json'),
          import('../../../messages/zh/task.json'),
        ])
  return Object.assign({}, ...modules.map((module) => module.default))
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale] = useState<Locale>(
    () => (Cookies.get('locale') as Locale) || defaultLocale,
  )
  const [messages, setMessages] = useState<Record<string, unknown>>({})

  useEffect(() => {
    loadMessages(locale).then(setMessages)
  }, [locale])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
