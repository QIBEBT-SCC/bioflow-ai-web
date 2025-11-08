'use server'

import { cookies } from 'next/headers'
import type { Locale } from '@/i18n/config'

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
}
