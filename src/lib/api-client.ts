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

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const prefix = `${encodeURIComponent(name)}=`
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length)
}

export async function clientFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string>; raw?: false },
): Promise<T>
export async function clientFetch(
  endpoint: string,
  options: RequestInit & { params?: Record<string, string>; raw: true },
): Promise<Response>
export async function clientFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string>; raw?: boolean },
): Promise<T | Response> {
  let url = `${FASTAPI_URL}${endpoint}`
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params).toString()
    url = `${url}?${searchParams}`
  }

  const method = (options?.method ?? 'GET').toUpperCase()
  const headers = new Headers(options?.headers)
  if (!headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json')
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken) headers.set('X-CSRF-Token', decodeURIComponent(csrfToken))
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      await fetch('/api/auth/clear', { method: 'POST' }).catch(() => {})
      const isPublicPage = ['/', '/login'].includes(window.location.pathname)
      if (!isPublicPage) window.location.href = '/login'
    }
    throw new ClientApiError('Unauthorized', 401)
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

  if (options?.raw) {
    return res
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
