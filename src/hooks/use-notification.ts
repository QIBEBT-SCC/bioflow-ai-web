'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createNotificationChannel,
  deleteNotificationChannel,
  getNotificationChannels,
  getNotificationEvents,
  testNotificationChannel,
  updateNotificationChannel,
} from '@/app/actions/notification'
import type {
  NotificationChannelCreate,
  NotificationChannelUpdate,
} from '@/types/notification'

const CHANNELS_QUERY_KEY = ['notification-channels']

export function useNotificationChannels() {
  return useQuery({
    queryKey: CHANNELS_QUERY_KEY,
    queryFn: getNotificationChannels,
    refetchInterval: 10_000,
  })
}

export function useNotificationEvents() {
  return useQuery({
    queryKey: ['notification-events'],
    queryFn: getNotificationEvents,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useCreateNotificationChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NotificationChannelCreate) =>
      createNotificationChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY })
    },
  })
}

export function useUpdateNotificationChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: NotificationChannelUpdate
    }) => updateNotificationChannel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY })
    },
  })
}

export function useDeleteNotificationChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNotificationChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY })
    },
  })
}

export function useTestNotificationChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: testNotificationChannel,
    onSuccess: () => {
      window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: CHANNELS_QUERY_KEY })
      }, 1_500)
    },
  })
}
