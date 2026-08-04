import { clientFetch } from '@/lib/api-client'
import type {
  NotificationChannelCreate,
  NotificationChannelPublic,
  NotificationChannelUpdate,
  NotificationEventDefinition,
} from '@/types/notification'

export async function getNotificationEvents(): Promise<
  NotificationEventDefinition[]
> {
  return await clientFetch<NotificationEventDefinition[]>(
    '/notifications/events',
  )
}

export async function getNotificationChannels(): Promise<
  NotificationChannelPublic[]
> {
  return await clientFetch<NotificationChannelPublic[]>(
    '/notifications/channels',
  )
}

export async function createNotificationChannel(
  data: NotificationChannelCreate,
): Promise<NotificationChannelPublic> {
  return await clientFetch<NotificationChannelPublic>(
    '/notifications/channels',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

export async function updateNotificationChannel(
  id: number,
  data: NotificationChannelUpdate,
): Promise<NotificationChannelPublic> {
  return await clientFetch<NotificationChannelPublic>(
    `/notifications/channels/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}

export async function deleteNotificationChannel(id: number): Promise<void> {
  await clientFetch<void>(`/notifications/channels/${id}`, {
    method: 'DELETE',
  })
}

export async function testNotificationChannel(
  id: number,
): Promise<{ event_id: string; status: string }> {
  return await clientFetch(`/notifications/channels/${id}/test`, {
    method: 'POST',
  })
}
