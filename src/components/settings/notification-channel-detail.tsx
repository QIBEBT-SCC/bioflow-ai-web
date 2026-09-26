'use client'

import {
  CircleAlertIcon,
  Loader2Icon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PlugIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/layout/section-card'
import { NotificationChannelForm } from '@/components/settings/notification-channel-form'
import { NotificationEventSubscriptions } from '@/components/settings/notification-event-subscriptions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useDeleteNotificationChannel,
  useTestNotificationChannel,
  useUpdateNotificationChannel,
} from '@/hooks/use-notification'
import { CHANNEL_HEALTH, channelHealth } from '@/lib/notification'
import { statusToneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { NotificationChannelPublic } from '@/types/notification'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function NotificationChannelDetail({
  channel,
  onDeleted,
}: {
  channel: NotificationChannelPublic
  onDeleted: () => void
}) {
  const t = useTranslations('setting.notification_management')
  const locale = useLocale()
  const testChannel = useTestNotificationChannel()
  const updateChannel = useUpdateNotificationChannel()
  const deleteChannel = useDeleteNotificationChannel()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const health = channelHealth(channel)
  const HealthIcon = CHANNEL_HEALTH[health].icon
  const formatTime = (value: string | null) =>
    value ? new Date(value).toLocaleString(locale) : '—'

  async function handleTest() {
    try {
      await testChannel.mutateAsync(channel.id)
      toast.success(t('test_queued'))
    } catch (error) {
      toast.error(errorMessage(error, t('test_failed')))
    }
  }

  async function handleToggle(enabled: boolean) {
    try {
      await updateChannel.mutateAsync({ id: channel.id, data: { enabled } })
    } catch (error) {
      toast.error(errorMessage(error, t('toggle_failed')))
    }
  }

  async function handleDelete() {
    try {
      await deleteChannel.mutateAsync(channel.id)
      setDeleteOpen(false)
      onDeleted()
      toast.success(t('delete_success'))
    } catch (error) {
      toast.error(errorMessage(error, t('delete_failed')))
    }
  }

  const testButton = (
    <Button
      variant='outline'
      onClick={handleTest}
      disabled={testChannel.isPending || !channel.enabled}
    >
      {testChannel.isPending ? (
        <Loader2Icon className='size-4 animate-spin' />
      ) : (
        <SendIcon className='size-4' />
      )}
      {t('send_test')}
    </Button>
  )

  return (
    <div className='min-w-0 space-y-6'>
      <header className='space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <MessageSquareIcon className='size-5' />
            </span>
            <div className='min-w-0'>
              <h2 className='truncate text-lg font-semibold tracking-tight'>
                {channel.name}
              </h2>
              <p className='text-sm text-muted-foreground'>
                {t(`provider_${channel.provider}`)}
              </p>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex h-9 items-center gap-2 rounded-md border px-3'>
              <Label htmlFor={`channel-enabled-${channel.id}`}>
                {t('enabled_label')}
              </Label>
              <Switch
                id={`channel-enabled-${channel.id}`}
                aria-label={t('enable_toggle')}
                checked={channel.enabled}
                disabled={updateChannel.isPending}
                onCheckedChange={(enabled) => void handleToggle(enabled)}
              />
            </div>
            {testButton}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={t('more_actions')}
                >
                  <MoreHorizontalIcon className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  variant='destructive'
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2Icon className='size-4' />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm'>
          {!channel.enabled && (
            <>
              <Badge
                variant='outline'
                className={statusToneClasses.neutral.badge}
              >
                {t('status_disabled')}
              </Badge>
              <span className='text-muted-foreground'>
                {t('test_disabled_hint')}
              </span>
            </>
          )}
          <Badge
            variant='outline'
            className={cn(
              'gap-1',
              statusToneClasses[CHANNEL_HEALTH[health].tone].badge,
            )}
          >
            <HealthIcon className='size-3' />
            {t(`health_${health}`)}
          </Badge>
          {health === 'never' ? (
            channel.enabled && (
              <span className='text-muted-foreground'>
                {t('no_delivery_yet')}
              </span>
            )
          ) : (
            <>
              <span>
                <span className='text-muted-foreground'>
                  {t('last_attempt')}
                </span>{' '}
                <span className='font-medium tabular-nums'>
                  {formatTime(channel.last_attempt_at)}
                </span>
              </span>
              <span>
                <span className='text-muted-foreground'>
                  {t('last_success')}
                </span>{' '}
                <span className='font-medium tabular-nums'>
                  {formatTime(channel.last_success_at)}
                </span>
              </span>
            </>
          )}
        </div>
        {channel.last_error && (
          <Alert variant='destructive'>
            <CircleAlertIcon />
            <AlertTitle>{t('last_error')}</AlertTitle>
            <AlertDescription className='break-words'>
              {channel.last_error}
            </AlertDescription>
          </Alert>
        )}
      </header>

      <NotificationEventSubscriptions
        key={`events-${channel.id}`}
        channel={channel}
      />

      <SectionCard
        icon={<PlugIcon />}
        title={t('connection')}
        description={t('connection_help')}
      >
        <NotificationChannelForm key={`form-${channel.id}`} channel={channel} />
      </SectionCard>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_description', { name: channel.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteChannel.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteChannel.isPending}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleteChannel.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
