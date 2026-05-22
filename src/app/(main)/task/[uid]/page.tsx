'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  TerminalIcon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
  Snippet,
  SnippetAddon,
  SnippetInput,
  SnippetText,
} from '@/components/ai-elements/snippet'
import { TaskLog } from '@/components/task/task-log'
import { TaskMonitor } from '@/components/task/task-monitor'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useTask } from '@/hooks/use-task'
import { Status } from '@/types/run'
import type { TaskPublic } from '@/types/task'

// 状态配置
const statusConfig = {
  [Status.WAITING]: {
    label: '等待中',
    variant: 'secondary' as const,
    icon: ClockIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  [Status.RUNNING]: {
    label: '运行中',
    variant: 'default' as const,
    icon: Loader2Icon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  [Status.ERROR]: {
    label: '失败',
    variant: 'destructive' as const,
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  [Status.SUCCESS]: {
    label: '成功',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
}

// 格式化时间
function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
  } catch {
    return '-'
  }
}

// 计算运行时长
function calculateDuration(startTime?: string, endTime?: string) {
  if (!startTime) return '-'
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) return `${duration}秒`
  if (duration < 3600)
    return `${Math.floor(duration / 60)}分 ${duration % 60}秒`
  const hours = Math.floor(duration / 3600)
  const mins = Math.floor((duration % 3600) / 60)
  return `${hours}小时 ${mins}分`
}

export default function TaskDetailPage() {
  const params = useParams()
  const taskUid = params.uid as string
  const { data: task, isLoading } = useTask(taskUid)
  const [activeView, setActiveView] = useState<'result' | 'log' | 'monitor'>(
    'result',
  )

  if (isLoading) {
    return (
      <SidebarInset className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full size-8 border-b-2 border-primary mx-auto mb-2'></div>
          <p className='text-muted-foreground'>加载中...</p>
        </div>
      </SidebarInset>
    )
  }

  if (!task) {
    return (
      <SidebarInset className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <XCircleIcon className='size-12 text-muted-foreground mx-auto mb-3' />
          <p className='text-muted-foreground'>任务不存在</p>
        </div>
      </SidebarInset>
    )
  }

  const config = statusConfig[task.status]
  const StatusIcon = config.icon

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href='/task'>任务监控</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{task.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto p-6 max-w-7xl'>
          {/* 任务标题卡片 - 简约扁平化 */}
          <Card className='mb-6'>
            <CardContent className='pt-6'>
              <div className='flex items-start justify-between gap-6'>
                <div className='flex-1 min-w-0 space-y-3'>
                  <div className='flex items-center gap-3'>
                    <h1 className='text-2xl font-semibold'>{task.name}</h1>
                    <Badge variant={config.variant} className='gap-1.5'>
                      <StatusIcon
                        className={`size-3.5 ${
                          config.icon === Loader2Icon ? 'animate-spin' : ''
                        }`}
                      />
                      {config.label}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {task.tool.description}
                  </p>
                  <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                    <div>
                      <span className='font-medium'>任务ID:</span>{' '}
                      <span className='font-mono'>{task.uid}</span>
                    </div>
                    <Separator orientation='vertical' className='h-4' />
                    <div>
                      <span className='font-medium'>所属工作流:</span>{' '}
                      <Link
                        href={`/workflow/${task.run_instance.uid}`}
                        className='text-primary hover:underline'
                      >
                        {task.run_instance.name}
                      </Link>
                    </div>
                    <Separator orientation='vertical' className='h-4' />
                    <div>
                      <span className='font-medium'>运行时长:</span>{' '}
                      <span className='font-semibold text-foreground'>
                        {calculateDuration(task.start_time, task.end_time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 主内容区 */}
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* 左侧主要内容 */}
            <div className='lg:col-span-3 space-y-6'>
              {/* 简单的视图切换按钮 */}
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setActiveView('result')}
                  className={activeView === 'result' ? 'bg-muted' : ''}
                >
                  运行结果
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setActiveView('log')}
                  className={activeView === 'log' ? 'bg-muted' : ''}
                >
                  任务日志
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setActiveView('monitor')}
                  className={activeView === 'monitor' ? 'bg-muted' : ''}
                >
                  系统监控
                </Button>
              </div>

              {activeView === 'result' && <TaskResultView task={task} />}
              {activeView === 'log' && (
                <TaskLogView task={task} taskUid={taskUid} />
              )}
              {activeView === 'monitor' && (
                <Card>
                  <CardHeader>
                    <CardTitle>系统监控</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaskMonitor taskUid={taskUid} />
                  </CardContent>
                </Card>
              )}
            </div>

            <TaskSidebar task={task} />
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}

function TaskResultView({ task }: { task: TaskPublic }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>运行结果</CardTitle>
      </CardHeader>
      <CardContent>
        {task.tool_output?.result ? (
          <div className='space-y-2'>
            {Object.entries(task.tool_output.result).map(([key, value]) => (
              <div
                key={key}
                className='flex justify-between items-start py-2 px-3 rounded border'
              >
                <span className='text-sm font-medium text-muted-foreground'>
                  {key}
                </span>
                <span className='font-mono text-sm text-right break-all max-w-2xl'>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center text-muted-foreground py-12'>
            <TerminalIcon className='size-12 mx-auto mb-3 opacity-50' />
            <p>暂无输出结果</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TaskLogView({ task, taskUid }: { task: TaskPublic; taskUid: string }) {
  return (
    <div className='space-y-4'>
      {task.commands && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>执行命令</CardTitle>
          </CardHeader>
          <CardContent>
            <Snippet
              className='py-5 bg-muted text-sm font-mono'
              code={task.commands}
            >
              <SnippetAddon className='pl-1'>
                <SnippetText>$</SnippetText>
              </SnippetAddon>
              <SnippetInput />
              <SnippetAddon align='inline-end' className='pr-2'>
                <CopyButton code={task.commands} />
              </SnippetAddon>
            </Snippet>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>任务日志</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskLog taskUid={taskUid} />
        </CardContent>
      </Card>
    </div>
  )
}

function TaskSidebar({ task }: { task: TaskPublic }) {
  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>基本信息</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div>
            <p className='text-xs text-muted-foreground mb-1'>工具</p>
            <p className='font-medium'>{task.tool.name}</p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>创建者</p>
            <p className='font-medium'>{task.owner.username}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>时间信息</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div>
            <p className='text-xs text-muted-foreground mb-1'>创建时间</p>
            <p className='font-mono text-xs'>
              {formatDateTime(task.create_time)}
            </p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>开始时间</p>
            <p className='font-mono text-xs'>
              {formatDateTime(task.start_time)}
            </p>
          </div>
          <Separator />
          <div>
            <p className='text-xs text-muted-foreground mb-1'>结束时间</p>
            <p className='font-mono text-xs'>{formatDateTime(task.end_time)}</p>
          </div>
        </CardContent>
      </Card>

      {(task.system || task.hostname) && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm'>系统信息</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            {task.hostname && (
              <>
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>主机</p>
                  <p className='font-mono text-xs'>{task.hostname}</p>
                </div>
                {task.system && <Separator />}
              </>
            )}
            {task.system && (
              <div>
                <p className='text-xs text-muted-foreground mb-1'>系统</p>
                <p className='font-mono text-xs break-all'>{task.system}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
