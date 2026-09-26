import { CheckCircle2Icon, CircleAlertIcon, Clock3Icon } from 'lucide-react'
import type { StatusTone } from '@/lib/status'
import type { NotificationChannelPublic } from '@/types/notification'

export type ChannelHealth = 'error' | 'success' | 'never'

export function channelHealth(
  channel: NotificationChannelPublic,
): ChannelHealth {
  if (channel.last_error) return 'error'
  if (channel.last_success_at) return 'success'
  return 'never'
}

export const CHANNEL_HEALTH = {
  error: { tone: 'danger', icon: CircleAlertIcon },
  success: { tone: 'success', icon: CheckCircle2Icon },
  never: { tone: 'neutral', icon: Clock3Icon },
} as const satisfies Record<ChannelHealth, { tone: StatusTone; icon: unknown }>
