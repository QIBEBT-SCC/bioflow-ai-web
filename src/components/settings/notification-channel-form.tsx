'use client'

import { Loader2Icon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducer } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  useCreateNotificationChannel,
  useDeleteNotificationChannel,
  useUpdateNotificationChannel,
} from '@/hooks/use-notification'
import type {
  NotificationChannelCreate,
  NotificationChannelPublic,
} from '@/types/notification'

const DEFAULT_WS_URL = 'wss://openws.work.weixin.qq.com'

interface ChannelFormState {
  name: string
  botId: string
  chatId: string
  secret: string
  enabled: boolean
}

type ChannelFormAction = {
  [Key in keyof ChannelFormState]: {
    field: Key
    value: ChannelFormState[Key]
  }
}[keyof ChannelFormState]

function channelFormReducer(
  state: ChannelFormState,
  action: ChannelFormAction,
): ChannelFormState {
  return { ...state, [action.field]: action.value }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function NotificationChannelForm({
  channel,
  onCreated,
  onSaved,
  onDeleted,
  onCancel,
}: {
  channel?: NotificationChannelPublic
  onCreated?: (channel: NotificationChannelPublic) => void
  onSaved?: (channel: NotificationChannelPublic) => void
  onDeleted?: () => void
  onCancel?: () => void
}) {
  const t = useTranslations('setting.notification_management')
  const createChannel = useCreateNotificationChannel()
  const updateChannel = useUpdateNotificationChannel()
  const deleteChannel = useDeleteNotificationChannel()
  const [form, updateForm] = useReducer(channelFormReducer, {
    name: channel?.name ?? '',
    botId: channel?.config.bot_id ?? '',
    chatId: channel?.config.chat_id ?? '',
    secret: '',
    enabled: channel?.enabled ?? true,
  })
  const saving = createChannel.isPending || updateChannel.isPending

  async function handleSave() {
    if (!form.name.trim() || !form.botId.trim() || !form.chatId.trim()) {
      toast.error(t('required_fields'))
      return
    }
    if (!channel && !form.secret.trim()) {
      toast.error(t('secret_required'))
      return
    }

    const common = {
      name: form.name.trim(),
      enabled: form.enabled,
      config: {
        bot_id: form.botId.trim(),
        chat_id: form.chatId.trim(),
        ws_url: channel?.config.ws_url ?? DEFAULT_WS_URL,
      },
    }
    try {
      let savedChannel: NotificationChannelPublic
      if (channel) {
        savedChannel = await updateChannel.mutateAsync({
          id: channel.id,
          data: {
            ...common,
            ...(form.secret.trim() ? { secret: form.secret } : {}),
          },
        })
      } else {
        savedChannel = await createChannel.mutateAsync({
          ...common,
          provider: 'wecom',
          secret: form.secret,
          event_types: [],
        } satisfies NotificationChannelCreate)
        onCreated?.(savedChannel)
      }
      onSaved?.(savedChannel)
      updateForm({ field: 'secret', value: '' })
      toast.success(t('save_success'))
    } catch (error) {
      toast.error(errorMessage(error, t('save_failed')))
    }
  }

  async function handleDelete() {
    if (!channel || !window.confirm(t('delete_confirm'))) return
    try {
      await deleteChannel.mutateAsync(channel.id)
      onDeleted?.()
      toast.success(t('delete_success'))
    } catch (error) {
      toast.error(errorMessage(error, t('delete_failed')))
    }
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-5 md:grid-cols-2'>
        {!channel && (
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='notification-provider'>{t('provider_type')}</Label>
            <Select value='wecom' disabled>
              <SelectTrigger id='notification-provider' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='wecom'>{t('provider_wecom')}</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-sm text-muted-foreground'>
              {t('provider_type_help')}
            </p>
          </div>
        )}
        <div className='space-y-2'>
          <Label htmlFor={`channel-name-${channel?.id ?? 'new'}`}>
            {t('channel_name')}
          </Label>
          <Input
            id={`channel-name-${channel?.id ?? 'new'}`}
            value={form.name}
            onChange={(event) =>
              updateForm({ field: 'name', value: event.target.value })
            }
            placeholder={t('channel_name_placeholder')}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`bot-id-${channel?.id ?? 'new'}`}>
            {t('bot_id')}
          </Label>
          <Input
            id={`bot-id-${channel?.id ?? 'new'}`}
            value={form.botId}
            onChange={(event) =>
              updateForm({ field: 'botId', value: event.target.value })
            }
            autoComplete='off'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`chat-id-${channel?.id ?? 'new'}`}>
            {t('chat_id')}
          </Label>
          <Input
            id={`chat-id-${channel?.id ?? 'new'}`}
            value={form.chatId}
            onChange={(event) =>
              updateForm({ field: 'chatId', value: event.target.value })
            }
            autoComplete='off'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`secret-${channel?.id ?? 'new'}`}>
            {t('secret')}
          </Label>
          <Input
            id={`secret-${channel?.id ?? 'new'}`}
            type='password'
            value={form.secret}
            onChange={(event) =>
              updateForm({ field: 'secret', value: event.target.value })
            }
            placeholder={
              channel?.credential_configured
                ? t('secret_configured')
                : t('secret_placeholder')
            }
            autoComplete='new-password'
          />
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 rounded-lg border p-4'>
        <div className='space-y-1'>
          <Label htmlFor={`enabled-${channel?.id ?? 'new'}`}>
            {t('channel_enabled')}
          </Label>
          <p className='text-sm text-muted-foreground'>
            {t('channel_enabled_help')}
          </p>
        </div>
        <Switch
          id={`enabled-${channel?.id ?? 'new'}`}
          checked={form.enabled}
          onCheckedChange={(value) => updateForm({ field: 'enabled', value })}
        />
      </div>

      <div className='flex flex-wrap justify-between gap-3'>
        <div>
          {channel && (
            <Button
              variant='ghost'
              onClick={handleDelete}
              disabled={deleteChannel.isPending}
            >
              <Trash2Icon />
              {t('delete')}
            </Button>
          )}
        </div>
        <div className='flex gap-2'>
          {onCancel && (
            <Button variant='outline' onClick={onCancel}>
              {t('cancel')}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2Icon className='animate-spin' />}
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
