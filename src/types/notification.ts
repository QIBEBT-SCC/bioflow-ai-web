export type NotificationProvider = 'wecom' | 'discord' | 'telegram'
export type NotificationEventType = string

export interface NotificationEventDefinition {
  key: NotificationEventType
  name: Record<string, string>
  description: Record<string, string>
}

export interface WeComChannelConfig {
  bot_id: string
  chat_id: string
  ws_url: string
}

/** Discord incoming webhooks keep the destination in the secret webhook URL. */
export type DiscordChannelConfig = Record<string, never>

export type NotificationChannelConfig =
  | WeComChannelConfig
  | DiscordChannelConfig

export interface NotificationChannelCreate {
  name: string
  provider: NotificationProvider
  enabled: boolean
  config: NotificationChannelConfig
  secret: string
  event_types: NotificationEventType[]
}

export interface NotificationChannelUpdate {
  name?: string
  enabled?: boolean
  config?: NotificationChannelConfig
  secret?: string
  event_types?: NotificationEventType[]
}

export interface NotificationChannelPublic {
  id: number
  name: string
  provider: NotificationProvider
  enabled: boolean
  config: NotificationChannelConfig
  credential_configured: boolean
  event_types: NotificationEventType[]
  last_attempt_at: string | null
  last_success_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}
