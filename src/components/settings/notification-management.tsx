'use client'

import { BellIcon, Loader2Icon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { NotificationChannelForm } from '@/components/settings/notification-channel-form'
import { NotificationChannelOverview } from '@/components/settings/notification-channel-overview'
import { NotificationEventSubscriptions } from '@/components/settings/notification-event-subscriptions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNotificationChannels } from '@/hooks/use-notification'
import { cn } from '@/lib/utils'
import type { NotificationChannelPublic } from '@/types/notification'

export function NotificationManagement() {
  const t = useTranslations('setting.notification_management')
  const { data: channels, isLoading, error } = useNotificationChannels()
  const [selectedChannelId, setSelectedChannelId] = useState<number>()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const selectedChannel =
    channels?.find((channel) => channel.id === selectedChannelId) ??
    channels?.[0]

  function handleCreated(channel: NotificationChannelPublic) {
    setSelectedChannelId(channel.id)
    setAddDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className='flex min-h-48 items-center justify-center'>
        <Loader2Icon className='size-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (error) {
    return <p className='text-destructive'>{t('load_failed')}</p>
  }

  return (
    <>
      <div className='grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
        <Card className='gap-4 lg:sticky lg:top-6'>
          <CardHeader>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <CardTitle>{t('channels')}</CardTitle>
                <CardDescription>{t('channels_help')}</CardDescription>
              </div>
              <Button
                size='icon-sm'
                aria-label={t('add_channel')}
                onClick={() => setAddDialogOpen(true)}
              >
                <PlusIcon />
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-2'>
            {channels?.map((channel) => (
              <button
                type='button'
                key={channel.id}
                onClick={() => setSelectedChannelId(channel.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                  selectedChannel?.id === channel.id &&
                    'border-primary bg-accent',
                )}
              >
                <span className='flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
                  <BellIcon className='size-4' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-medium'>
                    {channel.name}
                  </span>
                  <span className='block text-xs text-muted-foreground'>
                    {t(`provider_${channel.provider}`)}
                  </span>
                </span>
                <span
                  className={cn(
                    'size-2 rounded-full',
                    channel.enabled
                      ? 'bg-emerald-500'
                      : 'bg-muted-foreground/40',
                  )}
                />
              </button>
            ))}
            {!channels?.length && (
              <div className='space-y-3 rounded-lg border border-dashed p-5 text-center'>
                <p className='text-sm text-muted-foreground'>{t('empty')}</p>
                <Button size='sm' onClick={() => setAddDialogOpen(true)}>
                  <PlusIcon />
                  {t('add_channel')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedChannel ? (
          <div className='space-y-6'>
            <NotificationChannelOverview
              key={`channel-overview-${selectedChannel.id}`}
              channel={selectedChannel}
              onDeleted={() => setSelectedChannelId(undefined)}
            />
            <NotificationEventSubscriptions
              key={`channel-subscriptions-${selectedChannel.id}`}
              channel={selectedChannel}
            />
          </div>
        ) : (
          <Card className='border-dashed'>
            <CardContent className='flex min-h-72 flex-col items-center justify-center gap-3 text-center'>
              <BellIcon className='size-8 text-muted-foreground' />
              <div>
                <p className='font-medium'>{t('select_channel_title')}</p>
                <p className='text-sm text-muted-foreground'>
                  {t('select_channel_help')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('new_channel')}</DialogTitle>
            <DialogDescription>{t('new_channel_help')}</DialogDescription>
          </DialogHeader>
          <NotificationChannelForm
            onCreated={handleCreated}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
