import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, type Locale } from './config'

const namespaces = [
  'common',
  'login',
  'chat',
  'editor',
  'resource',
  'setting',
  'image',
]

export default getRequestConfig(async () => {
  // 从 cookie 读取用户语言偏好
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) || defaultLocale

  const parts = await Promise.all(
    namespaces.map((ns) =>
      import(`../../messages/${locale}/${ns}.json`).then((m) => m.default),
    ),
  )

  return {
    locale,
    messages: Object.assign({}, ...parts),
  }
})
