'use server'

import { cookies } from 'next/headers'
import type { Locale } from '@/i18n/config'

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    path: '/',
    sameSite: 'lax',
  })
}
