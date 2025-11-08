'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type React from 'react'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5分钟内数据视为新鲜，不重新请求
            staleTime: 5 * 60 * 1000,
            // 10分钟后清除未使用的缓存
            gcTime: 10 * 60 * 1000,
            // 失败后重试1次
            retry: 1,
            // 窗口重新获得焦点时重新验证
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
