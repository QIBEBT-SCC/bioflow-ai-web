'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  ActivityIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  RefreshCwIcon,
  XCircleIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TaskTimeline } from '@/components/task/task-timeline'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { RunTables } from '@/components/workflow/run-table'
import { useRunStats } from '@/hooks/use-run'
import { useWorkflowStore } from '@/stores/workflowStore'
import type { WorkflowRunStatisticsV2 } from '@/types/workflow-v2'

const REFRESH_INTERVALS = {
  '10s': 10_000,
  '30s': 30_000,
  '1m': 60_000,
  '5m': 300_000,
} as const

export default function WorkflowPage() {
  const t = useTranslations('workflowMonitor')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { refreshInterval, setRefreshInterval } = useWorkflowStore()
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())
  const refetchIntervalMs = useMemo(() => {
    if (refreshInterval === 'off') return false
    return (
      REFRESH_INTERVALS[refreshInterval as keyof typeof REFRESH_INTERVALS] ??
      false
    )
  }, [refreshInterval])
  const { data: runStats, dataUpdatedAt } = useRunStats(refetchIntervalMs)
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    [locale],
  )

  useEffect(() => {
    if (dataUpdatedAt > 0) setLastRefreshTime(new Date(dataUpdatedAt))
  }, [dataUpdatedAt])

  const handleForceRefresh = useCallback(() => {
    setLastRefreshTime(new Date())
    queryClient.invalidateQueries({ queryKey: ['runs'] }).then()
    queryClient.invalidateQueries({ queryKey: ['runStats'] }).then()
    queryClient.invalidateQueries({ queryKey: ['node-runs'] }).then()
  }, [queryClient])

  return (
    <SidebarInset className='flex h-screen flex-col'>
      <header className='flex shrink-0 flex-col border-b'>
        <div className='flex h-12 items-center justify-between bg-background px-4'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>{t('title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto max-w-[96rem] px-6 py-8'>
          <div className='grid items-start gap-x-6 gap-y-8 2xl:grid-cols-[13rem_minmax(0,1fr)]'>
            <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center 2xl:col-start-2'>
              <div>
                <h1 className='text-3xl font-semibold tracking-tight'>
                  {t('title')}
                </h1>
                <p className='mt-1 text-muted-foreground'>{t('description')}</p>
              </div>
              <div className='flex items-center gap-2'>
                <div className='flex items-center rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground'>
                  <Clock3Icon className='mr-2 size-4' />
                  {t('refresh.updatedAt', {
                    time: timeFormatter.format(lastRefreshTime),
                  })}
                </div>
                <Select
                  value={refreshInterval}
                  onValueChange={setRefreshInterval}
                >
                  <SelectTrigger className='w-36'>
                    <SelectValue placeholder={t('refresh.label')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='off'>{t('refresh.off')}</SelectItem>
                    <SelectItem value='10s'>
                      {t('refresh.seconds10')}
                    </SelectItem>
                    <SelectItem value='30s'>
                      {t('refresh.seconds30')}
                    </SelectItem>
                    <SelectItem value='1m'>{t('refresh.minute1')}</SelectItem>
                    <SelectItem value='5m'>{t('refresh.minutes5')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={handleForceRefresh}
                  title={t('refresh.manual')}
                >
                  <RefreshCwIcon className='size-4' />
                </Button>
              </div>
            </div>

            <RunStatsSidebar stats={runStats} />

            <div className='min-w-0 space-y-8 2xl:col-start-2 2xl:row-start-2'>
              <TaskTimeline refetchInterval={refetchIntervalMs} />

              <section className='space-y-4'>
                <div>
                  <h2 className='text-xl font-semibold tracking-tight'>
                    {t('table.title')}
                  </h2>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('table.description')}
                  </p>
                </div>
                <RunTables refetchInterval={refetchIntervalMs} />
              </section>
            </div>
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}

function RunStatsSidebar({ stats }: { stats?: WorkflowRunStatisticsV2 }) {
  const t = useTranslations('workflowMonitor.stats')
  const cards = [
    {
      key: 'total',
      value: stats?.total ?? 0,
      icon: ActivityIcon,
      iconClassName: 'text-muted-foreground',
      valueClassName: '',
    },
    {
      key: 'pending',
      value: stats?.pending ?? 0,
      icon: Clock3Icon,
      iconClassName: 'text-amber-500',
      valueClassName: 'text-amber-600',
    },
    {
      key: 'running',
      value: stats?.running ?? 0,
      icon: Loader2Icon,
      iconClassName: 'text-blue-500',
      valueClassName: 'text-blue-600',
    },
    {
      key: 'succeeded',
      value: stats?.succeeded ?? 0,
      icon: CheckCircle2Icon,
      iconClassName: 'text-emerald-500',
      valueClassName: 'text-emerald-600',
    },
    {
      key: 'failed',
      value: stats?.failed ?? 0,
      icon: XCircleIcon,
      iconClassName: 'text-red-500',
      valueClassName: 'text-red-600',
    },
  ] as const

  return (
    <aside className='2xl:sticky 2xl:top-8 2xl:col-start-1 2xl:row-start-2 2xl:self-start'>
      <Card className='gap-0 overflow-hidden py-0 shadow-xs'>
        <CardHeader className='hidden border-b px-4 py-3 2xl:flex'>
          <CardTitle className='text-sm font-medium'>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-1 p-2 sm:grid-cols-5 2xl:grid-cols-1'>
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.key}
                className='flex min-w-0 items-center gap-2 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50'
              >
                <Icon className={`size-4 shrink-0 ${card.iconClassName}`} />
                <span className='min-w-0 flex-1 truncate text-xs text-muted-foreground'>
                  {t(`${card.key}.label`)}
                </span>
                <span
                  className={`text-base font-semibold tabular-nums ${card.valueClassName}`}
                >
                  {card.value}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </aside>
  )
}
