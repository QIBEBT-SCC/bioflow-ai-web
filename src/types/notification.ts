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

export interface NotificationChannelCreate {
  name: string
  provider: NotificationProvider
  enabled: boolean
  config: WeComChannelConfig
  secret: string
  event_types: NotificationEventType[]
}

export interface NotificationChannelUpdate {
  name?: string
  enabled?: boolean
  config?: WeComChannelConfig
  secret?: string
  event_types?: NotificationEventType[]
}

export interface NotificationChannelPublic {
  id: number
  name: string
  provider: NotificationProvider
  enabled: boolean
  config: WeComChannelConfig
  credential_configured: boolean
  event_types: NotificationEventType[]
  last_attempt_at: string | null
  last_success_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}
