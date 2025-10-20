import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 服务端 API 调用封装
 * 用于 Server Actions 和 Server Components
 * 支持 NextAuth session
 */
export async function serverFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string> },
): Promise<T> {
  // 获取 NextAuth session
  const session = await getServerSession(authOptions)
  const accessToken = session?.accessToken

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
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options?.headers,
    },
  })

  // 处理 401 未授权
  if (res.status === 401) {
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
  if (contentType?.includes('application/json')) {
    return res.json()
  }

  return (await res.text()) as unknown as T
}

/**
 * 公共 API 调用（不需要认证）
 */
export async function publicFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string> },
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
