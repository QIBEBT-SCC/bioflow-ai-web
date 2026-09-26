'use client'

import { MessageSquareIcon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { FilterPanel } from '@/components/layout/filter-panel'
import { NotificationChannelDetail } from '@/components/settings/notification-channel-detail'
import { NotificationChannelForm } from '@/components/settings/notification-channel-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotificationChannels } from '@/hooks/use-notification'
import { CHANNEL_HEALTH, channelHealth } from '@/lib/notification'
import { statusToneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { NotificationChannelPublic } from '@/types/notification'

function ChannelListItem({
  channel,
  selected,
  onSelect,
}: {
  channel: NotificationChannelPublic
  selected: boolean
  onSelect: () => void
}) {
  const t = useTranslations('setting.notification_management')
  const health = channelHealth(channel)
  return (
    <button
      type='button'
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted',
        selected && 'bg-accent text-accent-foreground hover:bg-accent',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          channel.enabled
            ? statusToneClasses[CHANNEL_HEALTH[health].tone].dot
            : 'bg-muted-foreground/30',
        )}
      />
      <span className='min-w-0 flex-1'>
        <span
          className={cn(
            'block truncate text-sm font-medium',
            !channel.enabled && 'text-muted-foreground',
          )}
        >
          {channel.name}
        </span>
        <span className='block truncate text-xs text-muted-foreground'>
          {channel.enabled
            ? `${t(`provider_${channel.provider}`)} · ${t('event_count', {
                count: channel.event_types.length,
              })}`
            : t('status_disabled')}
        </span>
      </span>
    </button>
  )
}

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

  const createDialog = (
    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
      <DialogContent className='sm:max-w-xl'>
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
  )

  if (isLoading) {
    return (
      <div
        className='grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]'
        aria-busy='true'
      >
        <Skeleton className='h-48 rounded-xl' />
        <div className='space-y-4'>
          <Skeleton className='h-16 rounded-xl' />
          <Skeleton className='h-72 rounded-xl' />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {t('load_failed')}
      </p>
    )
  }

  if (!channels?.length) {
    return (
      <>
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <MessageSquareIcon />
            </EmptyMedia>
            <EmptyTitle>{t('empty_title')}</EmptyTitle>
            <EmptyDescription>{t('empty_help')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setAddDialogOpen(true)}>
              <PlusIcon className='size-4' />
              {t('add_channel')}
            </Button>
          </EmptyContent>
        </Empty>
        {createDialog}
      </>
    )
  }

  return (
    <>
      <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
        <FilterPanel
          className='lg:w-64'
          title={t('channels')}
          action={
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              aria-label={t('add_channel')}
              onClick={() => setAddDialogOpen(true)}
            >
              <PlusIcon className='size-4' />
            </Button>
          }
        >
          <nav aria-label={t('channels')} className='space-y-0.5'>
            {channels.map((channel) => (
              <ChannelListItem
                key={channel.id}
                channel={channel}
                selected={selectedChannel?.id === channel.id}
                onSelect={() => setSelectedChannelId(channel.id)}
              />
            ))}
          </nav>
        </FilterPanel>

        {selectedChannel && (
          <section className='min-w-0 flex-1'>
            <NotificationChannelDetail
              key={selectedChannel.id}
              channel={selectedChannel}
              onDeleted={() => setSelectedChannelId(undefined)}
            />
          </section>
        )}
      </div>
      {createDialog}
    </>
  )
}
