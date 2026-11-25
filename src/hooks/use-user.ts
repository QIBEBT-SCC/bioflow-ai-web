'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
} from '@/app/actions/user'
import type { UserRole } from '@/types/auth'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 60 * 1000,
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, username }: { userId: number; username: string }) =>
      updateUserProfile(userId, { username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
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

function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['users'] })
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({ mutationFn: createUser, onSuccess: invalidate })
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      updateUserStatus(userId, { is_active: isActive }),
    onSuccess: invalidate,
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      resetUserPassword(userId, { password }),
  })
}
