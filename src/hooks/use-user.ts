'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUserRole } from '@/app/actions/user'
import type { UserRole } from '@/types/auth'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 60 * 1000,
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      updateUserRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}
