'use client'

import {
  ActivityIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileStack,
  Loader2,
  Network,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToolUsage } from '@/hooks/use-tool'
import { Status } from '@/types/run'
import type { ToolRunUsage, ToolWorkflowUsage } from '@/types/tool'

const PAGE_SIZE = 10
const SKELETON_KEYS = ['first', 'second', 'third', 'fourth']

const statusConfig = {
  [Status.WAITING]: {
    key: 'waiting',
    icon: Clock,
    variant: 'secondary' as const,
  },
  [Status.RUNNING]: {
    key: 'running',
    icon: Loader2,
    variant: 'default' as const,
  },
  [Status.ERROR]: {
    key: 'error',
    icon: XCircle,
    variant: 'destructive' as const,
  },
  [Status.SUCCESS]: {
    key: 'success',
    icon: CheckCircle2,
    variant: 'outline' as const,
  },
}

interface ToolUsageSheetProps {
  tool: { uid: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EmptyUsage({ children }: { children: string }) {
  return (
    <div className='flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground'>
      <FileStack className='size-8 opacity-50' />
      <p>{children}</p>
    </div>
  )
}

function PageControls({
  offset,
  total,
  onOffsetChange,
  t,
}: {
  offset: number
  total: number
  onOffsetChange: (offset: number) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (total <= PAGE_SIZE) return null
  const page = Math.floor(offset / PAGE_SIZE) + 1
  const pages = Math.ceil(total / PAGE_SIZE)
  return (
    <div className='flex items-center justify-between pt-2'>
      <span className='text-xs text-muted-foreground'>
        {t('page', { page, pages })}
      </span>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={offset === 0}
          onClick={() => onOffsetChange(Math.max(0, offset - PAGE_SIZE))}
        >
          {t('previous')}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => onOffsetChange(offset + PAGE_SIZE)}
        >
          {t('next')}
        </Button>
      </div>
    </div>
  )
}

function WorkflowUsageItem({
  usage,
  close,
  t,
}: {
  usage: ToolWorkflowUsage
  close: () => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <Link
      href={`/editor?workflowUid=${usage.uid}`}
      onClick={close}
      className='group block rounded-lg border p-4 transition-colors hover:bg-muted/50'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 space-y-1'>
          <div className='flex items-center gap-2'>
            <Network className='size-4 shrink-0 text-primary' />
            <span className='truncate font-medium'>{usage.name}</span>
          </div>
          <p className='line-clamp-2 text-sm text-muted-foreground'>
            {usage.description || t('noDescription')}
          </p>
          <div className='flex gap-2 pt-1'>
            <Badge variant='secondary'>
              {t('nodeCount', { count: usage.node_count })}
            </Badge>
            <Badge variant='outline'>
              {usage.public ? t('public') : t('private')}
            </Badge>
          </div>
        </div>
        <ExternalLink className='size-4 shrink-0 text-muted-foreground group-hover:text-foreground' />
      </div>
    </Link>
  )
}

function RunUsageItem({
  usage,
  close,
  dateFormatter,
  t,
}: {
  usage: ToolRunUsage
  close: () => void
  dateFormatter: Intl.DateTimeFormat
  t: ReturnType<typeof useTranslations>
}) {
  const status = statusConfig[usage.status] ?? statusConfig[Status.WAITING]
  const StatusIcon = status.icon
  const href = usage.project_id
    ? `/project/${usage.project_id}/${usage.uid}`
    : `/workflow/${usage.uid}`
  return (
    <Link
      href={href}
      onClick={close}
      className='group block rounded-lg border p-4 transition-colors hover:bg-muted/50'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 space-y-2'>
          <div className='flex items-center gap-2'>
            <ActivityIcon className='size-4 shrink-0 text-primary' />
            <span className='truncate font-medium'>{usage.name}</span>
          </div>
          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            {usage.project_name && <span>{usage.project_name}</span>}
            {usage.workflow_name && <span>· {usage.workflow_name}</span>}
            {usage.create_time && (
              <span>· {dateFormatter.format(new Date(usage.create_time))}</span>
            )}
          </div>
          <div className='flex gap-2'>
            <Badge variant={status.variant}>
              <StatusIcon
                className={`mr-1 size-3 ${usage.status === Status.RUNNING ? 'animate-spin' : ''}`}
              />
              {t(`status.${status.key}`)}
            </Badge>
            <Badge variant='secondary'>
              {t('taskCount', { count: usage.task_count })}
            </Badge>
          </div>
        </div>
        <ExternalLink className='size-4 shrink-0 text-muted-foreground group-hover:text-foreground' />
      </div>
    </Link>
  )
}

export function ToolUsageSheet({
  tool,
  open,
  onOpenChange,
}: ToolUsageSheetProps) {
  const t = useTranslations('tool.Usage')
  const locale = useLocale()
  const [workflowOffset, setWorkflowOffset] = useState(0)
  const [runOffset, setRunOffset] = useState(0)
  const usageQuery = useToolUsage(
    tool?.uid ?? '',
    workflowOffset,
    runOffset,
    PAGE_SIZE,
    open,
  )
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  )
  const close = () => onOpenChange(false)
  const usage = usageQuery.data

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full gap-0 sm:max-w-2xl'>
        <SheetHeader className='border-b pr-12'>
          <SheetTitle>{t('title', { name: tool?.name ?? '' })}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>
        {usageQuery.isLoading ? (
          <div className='space-y-3 p-4'>
            {SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className='h-28 w-full' />
            ))}
          </div>
        ) : usageQuery.isError ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center'>
            <p className='text-sm text-destructive'>{t('loadError')}</p>
            <Button variant='outline' onClick={() => usageQuery.refetch()}>
              {t('retry')}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue='workflows' className='min-h-0 flex-1 gap-0'>
            <TabsList className='mx-4 my-3 grid w-auto grid-cols-2'>
              <TabsTrigger value='workflows'>
                {t('workflows')} ({usage?.workflow_total ?? 0})
              </TabsTrigger>
              <TabsTrigger value='runs'>
                {t('runs')} ({usage?.run_total ?? 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value='workflows' className='min-h-0'>
              <ScrollArea className='h-[calc(100vh-10rem)] px-4 pb-4'>
                {usage?.workflows.length ? (
                  <div className='space-y-3'>
                    {usage.workflows.map((item) => (
                      <WorkflowUsageItem
                        key={item.uid}
                        usage={item}
                        close={close}
                        t={t}
                      />
                    ))}
                    <PageControls
                      offset={workflowOffset}
                      total={usage.workflow_total}
                      onOffsetChange={setWorkflowOffset}
                      t={t}
                    />
                  </div>
                ) : (
                  <EmptyUsage>{t('noWorkflows')}</EmptyUsage>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value='runs' className='min-h-0'>
              <ScrollArea className='h-[calc(100vh-10rem)] px-4 pb-4'>
                {usage?.runs.length ? (
                  <div className='space-y-3'>
                    {usage.runs.map((item) => (
                      <RunUsageItem
                        key={item.uid}
                        usage={item}
                        close={close}
                        dateFormatter={dateFormatter}
                        t={t}
                      />
                    ))}
                    <PageControls
                      offset={runOffset}
                      total={usage.run_total}
                      onOffsetChange={setRunOffset}
                      t={t}
                    />
                  </div>
                ) : (
                  <EmptyUsage>{t('noRuns')}</EmptyUsage>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  )
}
