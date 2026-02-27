import Cookies from 'js-cookie'
import type { Locale } from '@/i18n/config'

export function setUserLocale(locale: Locale) {
  Cookies.set('locale', locale, {
    expires: 365,
    path: '/',
    sameSite: 'lax',
  })
}
