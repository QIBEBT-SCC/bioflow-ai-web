'use server'

import { cookies } from 'next/headers'
import { ACCENT_COOKIE, type AccentColor, isAccentColor } from '@/lib/theme'

// No auth check: accent color is a UI preference, like locale.
export async function setUserAccent(accent: AccentColor) {
  if (!isAccentColor(accent)) {
    throw new Error(`Invalid accent color: ${accent}`)
  }
  const cookieStore = await cookies()
  cookieStore.set(ACCENT_COOKIE, accent, {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    path: '/',
    sameSite: 'lax',
  })
}
