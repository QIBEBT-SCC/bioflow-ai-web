'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  PlayIcon,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
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
import { Status } from '@/types/run'
import { ExecutionScope } from '@/types/workflow'

interface WorkflowRunInstancesProps {
  projectId: string
  workflowUid: string
  executionScope?: ExecutionScope
}

const statusConfig = {
  [Status.WAITING]: {
    label: '等待中',
    variant: 'secondary' as const,
    icon: Clock,
    animate: false,
  },
  [Status.RUNNING]: {
    label: '运行中',
    variant: 'default' as const,
    icon: Loader2,
    animate: true,
  },
  [Status.ERROR]: {
    label: '失败',
    variant: 'destructive' as const,
    icon: XCircle,
    animate: false,
  },
  [Status.SUCCESS]: {
    label: '成功',
    variant: 'outline' as const,
    icon: CheckCircle2,
    animate: false,
  },
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN })
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

export function WorkflowRunInstances({
  projectId,
  workflowUid,
  executionScope,
}: WorkflowRunInstancesProps) {
  const runWorkflowMutation = useRunWorkflow()
  const isProjectLevel = executionScope === ExecutionScope.PROJECT_LEVEL

  const { data: samples, isLoading: samplesLoading } = useSamples(projectId)

  // 有运行中的实例时自动轮询
  const { data: allRuns, isLoading: runsLoading } = useProjectRuns(
    projectId,
    0,
    100,
    5000,
  )

  const isLoading = samplesLoading || runsLoading

  // 按此工作流过滤运行实例，并以 sample_uid 为 key
  const runMap = new Map(
    (allRuns ?? [])
      .filter((r) => r.workflow_uid === workflowUid)
      .map((r) => [r.sample_uid, r]),
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
      toast.success('已重新提交运行')
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        toast.error('该样本正在运行中，请等待完成后再重跑')
      } else {
        toast.error('运行失败，请重试')
      }
    }
  }

  if (isLoading) {
    return (
      <div className='px-4 pb-4 space-y-2'>
        {[...Array(3)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
          <Skeleton key={i} className='h-10 w-full' />
        ))}
      </div>
    )
  }

  // 项目级工作流视图
  if (isProjectLevel) {
    if (projectRuns.length === 0) {
      return (
        <div className='px-4 pb-4 text-sm text-muted-foreground text-center py-6'>
          尚未运行，请点击「运行」按钮启动
        </div>
      )
    }

    return (
      <div className='border-t'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/30'>
              <TableHead>运行名称</TableHead>
              <TableHead className='w-[110px]'>状态</TableHead>
              <TableHead className='w-[180px]'>进度</TableHead>
              <TableHead className='w-[100px]'>开始时间</TableHead>
              <TableHead className='w-[80px]'>时长</TableHead>
              <TableHead className='w-[120px] text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectRuns.map((run) => {
              const cfg = statusConfig[run.status]
              const Icon = cfg.icon
              const taskStats = run.task_statistics
              const progress = taskStats
                ? ((taskStats.success ?? 0) / taskStats.total) * 100
                : 0
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
                        className={`h-3 w-3 ${cfg.animate ? 'animate-spin' : ''}`}
                      />
                      {cfg.label}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {taskStats ? (
                      <div className='space-y-1'>
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
                    {formatDateTime(run.start_time)}
                  </TableCell>

                  <TableCell className='text-sm text-muted-foreground'>
                    {calculateDuration(run.start_time, run.end_time)}
                  </TableCell>

                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        asChild
                      >
                        <Link href={`/project/${projectId}/${run.uid}`}>
                          <ExternalLink className='h-3.5 w-3.5' />
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
                          <Loader2 className='h-3 w-3 animate-spin' />
                        ) : (
                          <>
                            <PlayIcon className='h-3 w-3 mr-1' />
                            重新运行
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
    )
  }

  // 样本级工作流视图
  if (!samples || samples.length === 0) {
    return (
      <div className='px-4 pb-4 text-sm text-muted-foreground text-center py-6'>
        项目中暂无样本，请先在「样本」Tab 中添加样本
      </div>
    )
  }

  return (
    <div className='border-t'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/30'>
            <TableHead className='w-[220px]'>样本名称</TableHead>
            <TableHead className='w-[110px]'>状态</TableHead>
            <TableHead className='w-[180px]'>进度</TableHead>
            <TableHead className='w-[100px]'>开始时间</TableHead>
            <TableHead className='w-[80px]'>时长</TableHead>
            <TableHead className='w-[120px] text-right'>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {samples.map((sample) => {
            const run = runMap.get(sample.uid)
            const cfg = run ? statusConfig[run.status] : null
            const Icon = cfg?.icon
            const taskStats = run?.task_statistics
            const progress = taskStats
              ? ((taskStats.success ?? 0) / taskStats.total) * 100
              : 0
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
                        className={`h-3 w-3 ${cfg.animate ? 'animate-spin' : ''}`}
                      />
                      {cfg.label}
                    </Badge>
                  ) : (
                    <span className='text-xs text-muted-foreground'>
                      未运行
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {taskStats ? (
                    <div className='space-y-1'>
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
                  {formatDateTime(run?.start_time)}
                </TableCell>

                <TableCell className='text-sm text-muted-foreground'>
                  {run ? calculateDuration(run.start_time, run.end_time) : '-'}
                </TableCell>

                <TableCell className='text-right'>
                  <div className='flex items-center justify-end gap-1'>
                    {run && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        asChild
                      >
                        <Link href={`/project/${projectId}/${run.uid}`}>
                          <ExternalLink className='h-3.5 w-3.5' />
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
                        <Loader2 className='h-3 w-3 animate-spin' />
                      ) : (
                        <>
                          <PlayIcon className='h-3 w-3 mr-1' />
                          {run ? '重新运行' : '运行'}
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
  )
}
