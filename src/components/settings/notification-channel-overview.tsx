'use client'

import {
  ActivityIcon,
  BotIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  KeyRoundIcon,
  Loader2Icon,
  PencilIcon,
  SendIcon,
  UsersIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { NotificationChannelForm } from '@/components/settings/notification-channel-form'
import { Badge } from '@/components/ui/badge'
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
import { useTestNotificationChannel } from '@/hooks/use-notification'
import { cn } from '@/lib/utils'
import type { NotificationChannelPublic } from '@/types/notification'

function DetailItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className='flex min-w-0 gap-3 rounded-lg border bg-muted/20 p-4'>
      <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-xs'>
        {icon}
      </span>
      <div className='min-w-0 space-y-1'>
        <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
          {label}
        </p>
        <div className='min-w-0 text-sm font-medium'>{children}</div>
      </div>
    </div>
  )
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function NotificationChannelOverview({
  channel,
  onDeleted,
}: {
  channel: NotificationChannelPublic
  onDeleted: () => void
}) {
  const t = useTranslations('setting.notification_management')
  const locale = useLocale()
  const testChannel = useTestNotificationChannel()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const statusKey = channel.last_error
    ? 'error'
    : channel.last_success_at
      ? 'success'
      : 'never'
  const StatusIcon =
    statusKey === 'error'
      ? CircleAlertIcon
      : statusKey === 'success'
        ? CheckCircle2Icon
        : Clock3Icon

  async function handleTest() {
    try {
      await testChannel.mutateAsync(channel.id)
      toast.success(t('test_queued'))
    } catch (error) {
      toast.error(errorMessage(error, t('test_failed')))
    }
  }

  return (
    <>
      <Card className='overflow-hidden'>
        <CardHeader className='border-b bg-muted/20'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex min-w-0 items-start gap-3'>
              <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <BotIcon className='size-5' />
              </span>
              <div className='min-w-0 space-y-1.5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <CardTitle className='truncate'>{channel.name}</CardTitle>
                  <Badge variant='outline'>
                    {t(`provider_${channel.provider}`)}
                  </Badge>
                  <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                    {t(channel.enabled ? 'status_enabled' : 'status_disabled')}
                  </Badge>
                </div>
                <CardDescription>{t('channel_overview_help')}</CardDescription>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' onClick={() => setEditDialogOpen(true)}>
                <PencilIcon />
                {t('edit_channel')}
              </Button>
              <Button
                onClick={handleTest}
                disabled={testChannel.isPending || !channel.enabled}
              >
                {testChannel.isPending ? (
                  <Loader2Icon className='animate-spin' />
                ) : (
                  <SendIcon />
                )}
                {t('send_test')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div>
            <h3 className='mb-3 text-sm font-medium'>{t('channel_details')}</h3>
            <div className='grid gap-3 sm:grid-cols-2'>
              <DetailItem
                icon={<BotIcon className='size-4' />}
                label={t('bot_id')}
              >
                <code className='block truncate' title={channel.config.bot_id}>
                  {channel.config.bot_id}
                </code>
              </DetailItem>
              <DetailItem
                icon={<UsersIcon className='size-4' />}
                label={t('chat_id')}
              >
                <code className='block truncate' title={channel.config.chat_id}>
                  {channel.config.chat_id}
                </code>
              </DetailItem>
              <DetailItem
                icon={<KeyRoundIcon className='size-4' />}
                label={t('credential')}
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5',
                    channel.credential_configured
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive',
                  )}
                >
                  {channel.credential_configured ? (
                    <CheckCircle2Icon className='size-4' />
                  ) : (
                    <CircleAlertIcon className='size-4' />
                  )}
                  {t(
                    channel.credential_configured
                      ? 'credential_configured'
                      : 'credential_missing',
                  )}
                </span>
              </DetailItem>
              <DetailItem
                icon={<ActivityIcon className='size-4' />}
                label={t('delivery_status')}
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5',
                    statusKey === 'error' && 'text-destructive',
                    statusKey === 'success' &&
                      'text-emerald-600 dark:text-emerald-400',
                    statusKey === 'never' && 'text-muted-foreground',
                  )}
                >
                  <StatusIcon className='size-4' />
                  {t(`status_${statusKey}`)}
                </span>
              </DetailItem>
            </div>
          </div>

          <div className='rounded-lg border p-4'>
            <div className='mb-3 flex items-center gap-2'>
              <Clock3Icon className='size-4 text-muted-foreground' />
              <h3 className='text-sm font-medium'>{t('delivery_activity')}</h3>
            </div>
            {channel.last_attempt_at || channel.last_success_at ? (
              <div className='grid gap-3 text-sm sm:grid-cols-2'>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    {t('last_attempt')}
                  </p>
                  <p className='mt-1 font-medium'>
                    {channel.last_attempt_at
                      ? new Date(channel.last_attempt_at).toLocaleString(locale)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    {t('last_success')}
                  </p>
                  <p className='mt-1 font-medium'>
                    {channel.last_success_at
                      ? new Date(channel.last_success_at).toLocaleString(locale)
                      : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('no_delivery_yet')}
              </p>
            )}
            {channel.last_error && (
              <div className='mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                <p className='mb-1 font-medium'>{t('last_error')}</p>
                <p className='break-words'>{channel.last_error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('edit_channel')}</DialogTitle>
            <DialogDescription>{t('edit_channel_help')}</DialogDescription>
          </DialogHeader>
          <NotificationChannelForm
            key={channel.id}
            channel={channel}
            onSaved={() => setEditDialogOpen(false)}
            onDeleted={() => {
              setEditDialogOpen(false)
              onDeleted()
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
