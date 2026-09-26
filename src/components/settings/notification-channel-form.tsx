'use client'

import { Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  type ComponentProps,
  type FormEvent,
  useReducer,
  useState,
} from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateNotificationChannel,
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
}

type ChannelField = keyof ChannelFormState

function channelFormReducer(
  state: ChannelFormState,
  action: { field: ChannelField; value: string } | { reset: ChannelFormState },
): ChannelFormState {
  if ('reset' in action) return action.reset
  return { ...state, [action.field]: action.value }
}

function initialState(channel?: NotificationChannelPublic): ChannelFormState {
  return {
    name: channel?.name ?? '',
    botId: channel?.config.bot_id ?? '',
    chatId: channel?.config.chat_id ?? '',
    secret: '',
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

/**
 * WeCom connection settings. Without `channel` it creates a new (enabled)
 * channel; with `channel` it edits in place and only shows actions when dirty.
 */
export function NotificationChannelForm({
  channel,
  onCreated,
  onCancel,
}: {
  channel?: NotificationChannelPublic
  onCreated?: (channel: NotificationChannelPublic) => void
  onCancel?: () => void
}) {
  const t = useTranslations('setting.notification_management')
  const createChannel = useCreateNotificationChannel()
  const updateChannel = useUpdateNotificationChannel()
  const [form, dispatch] = useReducer(channelFormReducer, channel, initialState)
  const [submitted, setSubmitted] = useState(false)
  const saving = createChannel.isPending || updateChannel.isPending
  const isCreate = !channel

  const baseline = initialState(channel)
  const dirty =
    isCreate ||
    form.name !== baseline.name ||
    form.botId !== baseline.botId ||
    form.chatId !== baseline.chatId ||
    form.secret !== ''

  const errors: Partial<Record<ChannelField, boolean>> = {
    name: !form.name.trim(),
    botId: !form.botId.trim(),
    chatId: !form.chatId.trim(),
    secret: isCreate && !form.secret.trim(),
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const showError = (field: ChannelField) => submitted && errors[field]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSubmitted(true)
    if (hasErrors) return

    const config = {
      bot_id: form.botId.trim(),
      chat_id: form.chatId.trim(),
      ws_url: channel?.config.ws_url ?? DEFAULT_WS_URL,
    }
    try {
      if (channel) {
        await updateChannel.mutateAsync({
          id: channel.id,
          data: {
            name: form.name.trim(),
            config,
            ...(form.secret.trim() ? { secret: form.secret } : {}),
          },
        })
        dispatch({ field: 'secret', value: '' })
      } else {
        const created = await createChannel.mutateAsync({
          name: form.name.trim(),
          provider: 'wecom',
          enabled: true,
          config,
          secret: form.secret,
          event_types: [],
        } satisfies NotificationChannelCreate)
        onCreated?.(created)
      }
      setSubmitted(false)
      toast.success(t('save_success'))
    } catch (error) {
      toast.error(errorMessage(error, t('save_failed')))
    }
  }

  const idFor = (field: string) => `channel-${field}-${channel?.id ?? 'new'}`

  const field = (
    name: ChannelField,
    label: string,
    input: Omit<ComponentProps<typeof Input>, 'id' | 'value'>,
  ) => (
    <div className='space-y-2'>
      <Label htmlFor={idFor(name)}>{label}</Label>
      <Input
        id={idFor(name)}
        value={form[name]}
        aria-invalid={showError(name) || undefined}
        aria-describedby={showError(name) ? `${idFor(name)}-error` : undefined}
        disabled={saving}
        onChange={(event) =>
          dispatch({ field: name, value: event.target.value })
        }
        {...input}
      />
      {showError(name) && (
        <p id={`${idFor(name)}-error`} className='text-xs text-destructive'>
          {t('field_required')}
        </p>
      )}
    </div>
  )

  return (
    <form className='space-y-5' onSubmit={handleSubmit} noValidate>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-2'>
          {field('name', t('channel_name'), {
            placeholder: t('channel_name_placeholder'),
          })}
        </div>
        {field('botId', t('bot_id'), { autoComplete: 'off' })}
        {field('chatId', t('chat_id'), { autoComplete: 'off' })}
        <div className='sm:col-span-2'>
          {field('secret', t('secret'), {
            type: 'password',
            autoComplete: 'new-password',
            placeholder: channel?.credential_configured
              ? t('secret_configured')
              : t('secret_placeholder'),
          })}
        </div>
      </div>

      {(isCreate || dirty) && (
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
          {!isCreate && (
            <span className='mr-auto text-sm text-muted-foreground'>
              {t('unsaved_changes')}
            </span>
          )}
          <div className='flex justify-end gap-2'>
            {isCreate ? (
              onCancel && (
                <Button type='button' variant='outline' onClick={onCancel}>
                  {t('cancel')}
                </Button>
              )
            ) : (
              <Button
                type='button'
                variant='ghost'
                disabled={saving}
                onClick={() => {
                  dispatch({ reset: baseline })
                  setSubmitted(false)
                }}
              >
                {t('reset')}
              </Button>
            )}
            <Button type='submit' disabled={saving}>
              {saving && <Loader2Icon className='size-4 animate-spin' />}
              {isCreate ? t('create') : t('save')}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
