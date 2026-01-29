import 'server-only'
import { cookies } from 'next/headers'

const FASTAPI_URL = process.env.BACKEND_API_URL ?? ''

if (!FASTAPI_URL) {
  console.error('[API Server] BACKEND_API_URL is not set!')
}

export class ApiError extends Error {
  public status: number
  public data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function serverFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string> },
): Promise<T> {
  let url = `${FASTAPI_URL}${endpoint}`
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params).toString()
    url = `${url}?${searchParams}`
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    throw new ApiError('Unauthorized', 401)
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    throw new ApiError(
      (errorData as any)?.message || `HTTP ${res.status}: ${res.statusText}`,
      res.status,
      errorData,
    )
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return (await res.text()) as unknown as T
}
