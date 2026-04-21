'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientFetch } from '@/lib/api-client'
import type { User } from '@/types/auth'

export function useAuth() {
  const { data: user, isLoading: loading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await clientFetch<User>('/auth/me')
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  return { user: user ?? null, loading }
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await clientFetch('/auth/logout', { method: 'POST' })
    },
    onSuccess: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
    onError: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}

export function useRefreshUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clientFetch<User>('/auth/me'),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data)
    },
  })
}
