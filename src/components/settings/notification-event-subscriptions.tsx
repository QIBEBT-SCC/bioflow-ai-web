'use client'

import { BellRingIcon, Loader2Icon, Settings2Icon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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

export function NotificationEventSubscriptions({
  channel,
}: {
  channel: NotificationChannelPublic
}) {
  const t = useTranslations('setting.notification_management')
  const locale = useLocale()
  const { data: events, isLoading, error } = useNotificationEvents()
  const updateChannel = useUpdateNotificationChannel()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState(
    () => new Set<NotificationEventType>(channel.event_types),
  )
  const subscribedEvents = events?.filter((event) =>
    channel.event_types.includes(event.key),
  )

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (open) {
      setSelectedEvents(new Set(channel.event_types))
    }
  }

  function toggleSubscription(
    eventType: NotificationEventType,
    checked: boolean,
  ) {
    setSelectedEvents((current) => {
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
        data: { event_types: Array.from(selectedEvents) },
      })
      setDialogOpen(false)
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
    <>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='space-y-1'>
              <CardTitle>{t('event_subscriptions')}</CardTitle>
              <CardDescription>
                {t('event_subscriptions_summary')}
              </CardDescription>
            </div>
            <Button
              variant='outline'
              onClick={() => handleDialogOpenChange(true)}
              disabled={isLoading || Boolean(error)}
            >
              <Settings2Icon />
              {t('manage_subscriptions')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className='flex min-h-24 items-center justify-center'>
              <Loader2Icon className='size-5 animate-spin text-muted-foreground' />
            </div>
          )}
          {error && (
            <p className='text-sm text-destructive'>
              {t('events_load_failed')}
            </p>
          )}
          {!isLoading && !error && subscribedEvents?.length === 0 && (
            <div className='rounded-lg border border-dashed p-6 text-center'>
              <BellRingIcon className='mx-auto mb-2 size-6 text-muted-foreground' />
              <p className='text-sm font-medium'>{t('no_subscriptions')}</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t('no_subscriptions_help')}
              </p>
            </div>
          )}
          {subscribedEvents && subscribedEvents.length > 0 && (
            <div className='grid gap-3'>
              {subscribedEvents.map((event) => (
                <div
                  key={event.key}
                  className='flex items-start gap-3 rounded-lg border bg-muted/20 p-4'
                >
                  <span className='flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-xs'>
                    <BellRingIcon className='size-4' />
                  </span>
                  <div className='min-w-0 space-y-1'>
                    <p className='text-sm font-medium'>
                      {localizedValue(event.name, locale)}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {localizedValue(event.description, locale)}
                    </p>
                    <code className='text-xs text-muted-foreground'>
                      {event.key}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('manage_subscriptions')}</DialogTitle>
            <DialogDescription>
              {t('event_subscriptions_help')}
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[55vh] divide-y overflow-y-auto rounded-lg border'>
            {events?.map((event) => {
              const checkboxId = `notification-event-${channel.id}-${event.key}`
              return (
                <div key={event.key} className='flex items-start gap-3 p-4'>
                  <Checkbox
                    id={checkboxId}
                    className='mt-0.5'
                    checked={selectedEvents.has(event.key)}
                    disabled={updateChannel.isPending}
                    onCheckedChange={(checked) =>
                      toggleSubscription(event.key, checked === true)
                    }
                  />
                  <div className='space-y-1'>
                    <Label htmlFor={checkboxId} className='cursor-pointer'>
                      {localizedValue(event.name, locale)}
                    </Label>
                    <p className='text-sm text-muted-foreground'>
                      {localizedValue(event.description, locale)}
                    </p>
                    <code className='text-xs text-muted-foreground'>
                      {event.key}
                    </code>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDialogOpen(false)}
              disabled={updateChannel.isPending}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={updateChannel.isPending}>
              {updateChannel.isPending && (
                <Loader2Icon className='animate-spin' />
              )}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
