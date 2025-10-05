import { cookies } from 'next/headers'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 服务端 API 调用封装
 * 用于 Server Actions 和 Server Components
 */
export async function serverFetch<T = any>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, any> },
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  // 处理查询参数
  let url = `${FASTAPI_URL}${endpoint}`
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params).toString()
    url = `${url}?${searchParams}`
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  })

  // 处理 401 未授权
  if (res.status === 401) {
    cookieStore.delete('token')
    throw new ApiError('Unauthorized', 401)
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    throw new ApiError(
      errorData?.message || `HTTP ${res.status}: ${res.statusText}`,
      res.status,
      errorData,
    )
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }

  return (await res.text()) as unknown as T
}

/**
 * 公共 API 调用（不需要认证）
 */
export async function publicFetch<T = any>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, any> },
): Promise<T> {
  let url = `${FASTAPI_URL}${endpoint}`
  if (options?.params) {
    const searchParams = new URLSearchParams(options.params).toString()
    url = `${url}?${searchParams}`
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    throw new ApiError(
      errorData?.message || `HTTP ${res.status}: ${res.statusText}`,
      res.status,
      errorData,
    )
  }

  return res.json()
}
