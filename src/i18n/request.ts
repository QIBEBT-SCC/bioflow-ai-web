import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, type Locale } from './config'

export default getRequestConfig(async () => {
  // 从 cookie 读取用户语言偏好
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) || defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
