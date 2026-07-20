'use client'

import {
  ActivityIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  PlayIcon,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProjectRuns, useRunWorkflow } from '@/hooks/use-project-workflow'
import { useSamples } from '@/hooks/use-sample'
import type { RunInstance } from '@/types/project-workflow'
import { Status } from '@/types/run'
import { ExecutionScope } from '@/types/workflow'

interface WorkflowRunInstancesProps {
  projectId: string
  workflowUid: string
  executionScope?: ExecutionScope
}

const statusConfig = {
  [Status.WAITING]: {
    labelKey: 'waiting',
    variant: 'secondary' as const,
    icon: Clock,
    animate: false,
  },
  [Status.RUNNING]: {
    labelKey: 'running',
    variant: 'default' as const,
    icon: Loader2,
    animate: true,
  },
  [Status.ERROR]: {
    labelKey: 'failed',
    variant: 'destructive' as const,
    icon: XCircle,
    animate: false,
  },
  [Status.SUCCESS]: {
    labelKey: 'success',
    variant: 'outline' as const,
    icon: CheckCircle2,
    animate: false,
  },
}

function formatDateTime(
  dateFormatter: Intl.DateTimeFormat,
  dateStr?: string | null,
) {
  if (!dateStr) return '-'
  try {
    return dateFormatter.format(new Date(dateStr))
  } catch {
    return '-'
  }
}

function calculateDuration(startTime?: string | null, endTime?: string | null) {
  if (!startTime) return '-'
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)
  if (duration < 60) return `${duration}s`
  if (duration < 3600) return `${Math.floor(duration / 60)}m`
  const hours = Math.floor(duration / 3600)
  const mins = Math.floor((duration % 3600) / 60)
  return `${hours}h ${mins}m`
}

function calculateProgress(taskStats?: RunInstance['task_statistics']) {
  if (!taskStats || taskStats.total <= 0) return 0

  return Math.min(100, ((taskStats.success ?? 0) / taskStats.total) * 100)
}

export function WorkflowRunInstances({
  projectId,
  workflowUid,
  executionScope,
}: WorkflowRunInstancesProps) {
  const locale = useLocale()
  const t = useTranslations('Project.workflow.runs')
  const tStatus = useTranslations('Project.workflow.status')
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  )
  const runWorkflowMutation = useRunWorkflow()
  const isProjectLevel = executionScope === ExecutionScope.PROJECT_LEVEL

  const { data: samples, isLoading: samplesLoading } = useSamples(
    projectId,
    0,
    100,
  )

  // 有运行中的实例时自动轮询
  const { data: allRuns, isLoading: runsLoading } = useProjectRuns(
    projectId,
    0,
    100,
    5000,
  )

  const isLoading = samplesLoading || runsLoading

  // 按此工作流过滤运行实例，并以 sample_uid 为 key
  const runMap = (allRuns ?? []).reduce<Map<string | null, RunInstance>>(
    (acc, r) => {
      if (r.workflow_uid === workflowUid) acc.set(r.sample_uid, r)
      return acc
    },
    new Map(),
  )

  // 项目级：筛选 sample_uid 为 null 的运行实例
  const projectRuns = isProjectLevel
    ? (allRuns ?? []).filter(
        (r) => r.workflow_uid === workflowUid && r.sample_uid === null,
      )
    : []

  const handleRerun = async (sampleUid?: string) => {
    try {
      await runWorkflowMutation.mutateAsync({
        projectId,
        workflowUid,
        data: sampleUid ? { sample_uids: [sampleUid] } : {},
      })
      toast.success(t('rerunSubmitted'))
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        toast.error(t('sampleRunning'))
      } else {
        toast.error(t('runFailed'))
      }
    }
  }

  if (isLoading) {
    return (
      <div className='p-4'>
        <div className='space-y-2 rounded-md border bg-background p-3'>
          {['sk-0', 'sk-1', 'sk-2'].map((key) => (
            <Skeleton key={key} className='h-10 w-full' />
          ))}
        </div>
      </div>
    )
  }

  // 项目级工作流视图
  if (isProjectLevel) {
    if (projectRuns.length === 0) {
      return (
        <div className='p-4'>
          <div className='rounded-md border border-dashed bg-background px-4 py-8 text-center text-sm text-muted-foreground'>
            {t('projectNotRun')}
          </div>
        </div>
      )
    }

    return (
      <div className='p-4'>
        <div className='overflow-hidden rounded-md border bg-background'>
          <div className='flex items-center gap-2 border-b bg-muted/40 px-4 py-3'>
            <ActivityIcon className='size-4 text-muted-foreground' />
            <div className='text-sm font-medium'>{t('projectRuns')}</div>
            <Badge variant='secondary' className='ml-auto'>
              {projectRuns.length}
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/20 hover:bg-muted/20'>
                <TableHead>{t('runName')}</TableHead>
                <TableHead className='w-[110px]'>{t('status')}</TableHead>
                <TableHead className='w-[220px]'>{t('progress')}</TableHead>
                <TableHead className='w-[120px]'>{t('startTime')}</TableHead>
                <TableHead className='w-[90px]'>{t('duration')}</TableHead>
                <TableHead className='w-[130px] text-right'>
                  {t('actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectRuns.map((run) => {
                const cfg = statusConfig[run.status]
                const Icon = cfg.icon
                const taskStats = run.task_statistics
                const progress = calculateProgress(taskStats)
                const isRunning =
                  runWorkflowMutation.isPending &&
                  !runWorkflowMutation.variables?.data.sample_uids

                return (
                  <TableRow key={run.uid}>
                    <TableCell className='font-medium text-sm'>
                      {run.name}
                    </TableCell>

                    <TableCell>
                      <Badge variant={cfg.variant} className='gap-1'>
                        <Icon
                          className={`size-3 ${cfg.animate ? 'animate-spin' : ''}`}
                        />
                        {tStatus(cfg.labelKey)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {taskStats ? (
                        <div className='space-y-1.5'>
                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <span>
                              {taskStats.success ?? 0}/{taskStats.total}
                            </span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className='h-1.5' />
                        </div>
                      ) : (
                        <span className='text-sm text-muted-foreground'>-</span>
                      )}
                    </TableCell>

                    <TableCell className='text-sm text-muted-foreground'>
                      {formatDateTime(dateFormatter, run.start_time)}
                    </TableCell>

                    <TableCell className='text-sm text-muted-foreground'>
                      {calculateDuration(run.start_time, run.end_time)}
                    </TableCell>

                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 gap-1 text-xs'
                          asChild
                        >
                          <Link href={`/project/${projectId}/${run.uid}`}>
                            <ExternalLink className='size-3' />
                            {t('viewDetails')}
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 text-xs'
                          onClick={() => handleRerun()}
                          disabled={isRunning || run.status === Status.RUNNING}
                        >
                          {isRunning ? (
                            <Loader2 className='size-3 animate-spin' />
                          ) : (
                            <>
                              <PlayIcon className='size-3 mr-1' />
                              {t('rerun')}
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // 样本级工作流视图
  if (!samples || samples.length === 0) {
    return (
      <div className='p-4'>
        <div className='rounded-md border border-dashed bg-background px-4 py-8 text-center text-sm text-muted-foreground'>
          {t('noSamples')}
        </div>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <div className='overflow-hidden rounded-md border bg-background'>
        <div className='flex items-center gap-2 border-b bg-muted/40 px-4 py-3'>
          <ActivityIcon className='size-4 text-muted-foreground' />
          <div className='text-sm font-medium'>{t('sampleRuns')}</div>
          <Badge variant='secondary' className='ml-auto'>
            {samples.length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/20 hover:bg-muted/20'>
              <TableHead className='w-[220px]'>{t('sampleName')}</TableHead>
              <TableHead className='w-[110px]'>{t('status')}</TableHead>
              <TableHead className='w-[220px]'>{t('progress')}</TableHead>
              <TableHead className='w-[120px]'>{t('startTime')}</TableHead>
              <TableHead className='w-[90px]'>{t('duration')}</TableHead>
              <TableHead className='w-[130px] text-right'>
                {t('actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samples.map((sample) => {
              const run = runMap.get(sample.uid)
              const cfg = run ? statusConfig[run.status] : null
              const Icon = cfg?.icon
              const taskStats = run?.task_statistics
              const progress = calculateProgress(taskStats)
              const isRunning =
                runWorkflowMutation.isPending &&
                runWorkflowMutation.variables?.data.sample_uids?.includes(
                  sample.uid,
                )

              return (
                <TableRow key={sample.uid}>
                  <TableCell className='font-medium text-sm'>
                    {sample.sample_name}
                  </TableCell>

                  <TableCell>
                    {cfg && Icon ? (
                      <Badge variant={cfg.variant} className='gap-1'>
                        <Icon
                          className={`size-3 ${cfg.animate ? 'animate-spin' : ''}`}
                        />
                        {tStatus(cfg.labelKey)}
                      </Badge>
                    ) : (
                      <span className='text-xs text-muted-foreground'>
                        {tStatus('notRun')}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {taskStats ? (
                      <div className='space-y-1.5'>
                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                          <span>
                            {taskStats.success ?? 0}/{taskStats.total}
                          </span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className='h-1.5' />
                      </div>
                    ) : (
                      <span className='text-sm text-muted-foreground'>-</span>
                    )}
                  </TableCell>

                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDateTime(dateFormatter, run?.start_time)}
                  </TableCell>

                  <TableCell className='text-sm text-muted-foreground'>
                    {run
                      ? calculateDuration(run.start_time, run.end_time)
                      : '-'}
                  </TableCell>

                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      {run && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 gap-1 text-xs'
                          asChild
                        >
                          <Link href={`/project/${projectId}/${run.uid}`}>
                            <ExternalLink className='size-3' />
                            {t('viewDetails')}
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 text-xs'
                        onClick={() => handleRerun(sample.uid)}
                        disabled={isRunning || run?.status === Status.RUNNING}
                      >
                        {isRunning ? (
                          <Loader2 className='size-3 animate-spin' />
                        ) : (
                          <>
                            <PlayIcon className='size-3 mr-1' />
                            {run ? t('rerun') : t('run')}
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
