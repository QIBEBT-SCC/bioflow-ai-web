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

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

async function refreshToken(): Promise<void> {
  const res = await fetch(`${FASTAPI_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Refresh failed')
}

export async function clientFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string> },
  _isRetry = false,
): Promise<T> {
  let url = `${FASTAPI_URL}${endpoint}`
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params).toString()
    url = `${url}?${searchParams}`
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (res.status === 401 && !_isRetry) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshToken().finally(() => {
        isRefreshing = false
        refreshPromise = null
      })
    }

    try {
      await refreshPromise
      return clientFetch<T>(endpoint, options, true)
    } catch {
      if (typeof window !== 'undefined') {
        // 公开页面（/login 等）不执行跳转：useAuth 直接返回 null 即可，
        const isPublicPage = ['/login', '/register'].some(
          (p) =>
            window.location.pathname === p ||
            window.location.pathname.startsWith(`${p}/`),
        )
        if (!isPublicPage) {
          // 先清除 HttpOnly cookies（JS 无法直接删除），再跳转
          await fetch('/api/auth/clear', { method: 'POST' }).catch(() => {})
          window.location.href = '/login'
        }
      }
      throw new ClientApiError('Unauthorized', 401)
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    throw new ClientApiError(
      errorData?.message ||
        errorData?.detail ||
        `HTTP ${res.status}: ${res.statusText}`,
      res.status,
      errorData,
    )
  }

  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return res.json()
  }

  return (await res.text()) as unknown as T
}
