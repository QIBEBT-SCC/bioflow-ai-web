'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientFetch, clearToken } from '@/lib/api-client'
import type { User } from '@/types/auth'

/**
 * 使用 TanStack Query 管理认证状态
 * 优点:
 * - 自动请求去重
 * - 自动缓存(5分钟)
 * - 符合 Vercel Best Practices (client-swr-dedup)
 */
export function useAuth() {
  const { data: user, isLoading: loading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token')
      if (!token) return null
      
      try {
        return await clientFetch<User>('/auth/me')
      } catch {
        // Token 无效,清除本地存储
        clearToken()
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    gcTime: 10 * 60 * 1000, // 10分钟后清除缓存
    retry: false, // 认证失败不重试
    refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
  })

  return { user, loading }
}

/**
 * 登出 Mutation Hook
 * 自动清除 TanStack Query 缓存
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      clearToken()
    },
    onSuccess: () => {
      // 清除用户信息缓存
      queryClient.setQueryData(['auth', 'me'], null)
      // 可选: 清除所有查询缓存
      // queryClient.clear()
    },
  })
}

/**
 * 刷新用户信息
 */
export function useRefreshUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No token')
      return await clientFetch<User>('/auth/me')
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data)
    },
  })
}
