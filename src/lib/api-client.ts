import Cookies from 'js-cookie'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

export class ClientApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ClientApiError'
  }
}

// Token 管理
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('access_token', token)
  Cookies.set('access_token', token, {
    expires: 7,
    path: '/',
    // 生产环境下建议开启 Secure 属性
    secure: window.location.protocol === 'https:',
    sameSite: 'lax',
  })
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
  // 清除 Cookie
  Cookies.remove('access_token', { path: '/' })
}

export async function clientFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string> },
): Promise<T> {
  let url = `${FASTAPI_URL}${endpoint}`
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params).toString()
    url = `${url}?${searchParams}`
  }

  const token = getToken()

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // 重要：发送 Cookie
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    // Token 过期，清除本地存储
    clearToken()
    throw new ClientApiError('Unauthorized', 401)
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    throw new ClientApiError(
      errorData?.message || `HTTP ${res.status}: ${res.statusText}`,
      res.status,
      errorData,
    )
  }

  // 204 No Content 没有响应体
  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return res.json()
  }

  return (await res.text()) as unknown as T
}
