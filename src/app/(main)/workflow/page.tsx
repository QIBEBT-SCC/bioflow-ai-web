'use client'

import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Activity,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

export default function WorkflowPage() {
  const queryClient = useQueryClient()

  const { refreshInterval, setRefreshInterval } = useWorkflowStore()
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date())

  // 计算 refetchInterval 的毫秒数
  const refetchIntervalMs = useMemo(() => {
    if (refreshInterval === 'off') return false

    const intervalMap = {
      '10s': 10000,
      '30s': 30000,
      '1m': 60000,
      '5m': 300000,
    } as const

    return intervalMap[refreshInterval as keyof typeof intervalMap] || false
  }, [refreshInterval])

  const { data: runStats } = useRunStats(refetchIntervalMs)

  // Force refresh function
  const handleForceRefresh = useCallback(() => {
    setLastRefreshTime(new Date())
    queryClient.invalidateQueries({ queryKey: ['runs'] }).then()
    queryClient.invalidateQueries({ queryKey: ['runStats'] }).then()
    queryClient.invalidateQueries({ queryKey: ['runCount'] }).then()
  }, [queryClient])

  // 当 refetchInterval 变化时更新最后刷新时间
  useEffect(() => {
    if (refetchIntervalMs !== false) {
      setLastRefreshTime(new Date())
    }
  }, [refetchIntervalMs])

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>工作流运行监控</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-6 py-8 max-w-7xl'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8'>
            <div>
              <h1 className='text-3xl font-semibold tracking-tight'>
                工作流运行监控
              </h1>
              <p className='text-muted-foreground mt-1'>
                实时监控工作流运行状态和任务进度
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md'>
                <Clock className='mr-2 size-4' />
                更新于 {format(lastRefreshTime, 'HH:mm:ss')}
              </div>
              <Select
                value={refreshInterval}
                onValueChange={setRefreshInterval}
              >
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='自动刷新' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='off'>不刷新</SelectItem>
                  <SelectItem value='10s'>每 10 秒</SelectItem>
                  <SelectItem value='30s'>每 30 秒</SelectItem>
                  <SelectItem value='1m'>每 1 分钟</SelectItem>
                  <SelectItem value='5m'>每 5 分钟</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                size='icon'
                onClick={handleForceRefresh}
                title='手动刷新'
              >
                <RefreshCw className='size-4' />
              </Button>
            </div>
          </div>

          {/* 统计信息卡片 */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between gap-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>总工作流</CardTitle>
                <Activity className='size-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{runStats?.total ?? 0}</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  所有运行实例
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between gap-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>等待中</CardTitle>
                <Clock className='size-4 text-yellow-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-yellow-600'>
                  {runStats?.waiting ?? 0}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>等待执行</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between gap-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>运行中</CardTitle>
                <Play className='size-4 text-blue-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-blue-600'>
                  {runStats?.running ?? 0}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>正在执行</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between gap-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>已完成</CardTitle>
                <CheckCircle className='size-4 text-green-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  {runStats?.success ?? 0}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>成功完成</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between gap-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>失败</CardTitle>
                <XCircle className='size-4 text-red-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {runStats?.error ?? 0}
                </div>
                <p className='text-xs text-muted-foreground mt-1'>执行失败</p>
              </CardContent>
            </Card>
          </div>

          {/* 工作流列表表格 */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold tracking-tight'>
                运行实例列表
              </h2>
            </div>
            <RunTables refetchInterval={refetchIntervalMs} />
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}
