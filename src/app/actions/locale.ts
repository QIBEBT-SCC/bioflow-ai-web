'use server'

import { cookies } from 'next/headers'
import { type Locale, locales } from '@/i18n/config'

// No auth check: locale is a UI preference settable by anyone, including
// unauthenticated visitors on the public landing page.
export async function setUserLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`)
  }
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    path: '/',
    sameSite: 'lax',
  })
}
