'use client'

import { BellRingIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/layout/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  useNotificationEvents,
  useUpdateNotificationChannel,
} from '@/hooks/use-notification'
import type {
  NotificationChannelPublic,
  NotificationEventType,
} from '@/types/notification'

function localizedValue(
  values: Record<string, string>,
  locale: string,
): string {
  return values[locale] ?? values.en ?? Object.values(values)[0] ?? ''
}

function sameSelection(a: Set<string>, b: string[]) {
  return a.size === b.length && b.every((key) => a.has(key))
}

export function NotificationEventSubscriptions({
  channel,
}: {
  channel: NotificationChannelPublic
}) {
  const t = useTranslations('setting.notification_management')
  const locale = useLocale()
  const { data: events, isLoading, error } = useNotificationEvents()
  const updateChannel = useUpdateNotificationChannel()
  const [selected, setSelected] = useState(
    () => new Set<NotificationEventType>(channel.event_types),
  )
  const dirty = !sameSelection(selected, channel.event_types)

  function toggle(eventType: NotificationEventType, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(eventType)
      else next.delete(eventType)
      return next
    })
  }

  async function handleSave() {
    try {
      await updateChannel.mutateAsync({
        id: channel.id,
        data: { event_types: Array.from(selected) },
      })
      toast.success(t('subscription_save_success'))
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : t('subscription_save_failed'),
      )
    }
  }

  return (
    <SectionCard
      icon={<BellRingIcon />}
      title={t('events')}
      description={t('events_help')}
      action={
        <Badge variant='secondary' className='tabular-nums'>
          {t('event_count', { count: channel.event_types.length })}
        </Badge>
      }
      contentClassName='space-y-4'
    >
      {isLoading && (
        <div className='space-y-2' aria-busy='true'>
          <Skeleton className='h-14 rounded-lg' />
          <Skeleton className='h-14 rounded-lg' />
          <Skeleton className='h-14 rounded-lg' />
        </div>
      )}
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {t('events_load_failed')}
        </p>
      )}
      {events && events.length === 0 && (
        <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
          {t('events_empty')}
        </p>
      )}
      {events && events.length > 0 && (
        <div className='divide-y rounded-lg border'>
          {events.map((event) => {
            const switchId = `notification-event-${channel.id}-${event.key}`
            return (
              <div
                key={event.key}
                className='flex items-start justify-between gap-4 px-4 py-3'
                title={event.key}
              >
                <div className='min-w-0 space-y-0.5'>
                  <Label htmlFor={switchId} className='cursor-pointer'>
                    {localizedValue(event.name, locale)}
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    {localizedValue(event.description, locale)}
                  </p>
                </div>
                <Switch
                  id={switchId}
                  className='mt-0.5'
                  checked={selected.has(event.key)}
                  disabled={updateChannel.isPending}
                  onCheckedChange={(checked) => toggle(event.key, checked)}
                />
              </div>
            )
          })}
        </div>
      )}
      {dirty && (
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <span className='text-sm text-muted-foreground'>
            {t('unsaved_changes')}
          </span>
          <div className='flex justify-end gap-2'>
            <Button
              variant='ghost'
              disabled={updateChannel.isPending}
              onClick={() => setSelected(new Set(channel.event_types))}
            >
              {t('reset')}
            </Button>
            <Button onClick={handleSave} disabled={updateChannel.isPending}>
              {updateChannel.isPending ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
