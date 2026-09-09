import {
  type Query,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getRun,
  getRunCount,
  getRunFiles,
  getRunStats,
  getRuns,
  newRunInstance,
} from '@/app/actions/run'
import type { RunFileNode } from '@/types/run'
import type { WorkflowDefinition } from '@/types/workflow'
import type {
  PaginatedWorkflowRunsV2,
  WorkflowRunStatisticsV2,
  WorkflowRunV2,
} from '@/types/workflow-v2'

const V2_API_URL = '/api/v2'

// ============================================
// Run Instance Query Hooks (运行实例查询)
// ============================================

/**
 * 创建运行实例
 */
export const useNewRunInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workflow,
      template_name,
    }: {
      workflow: WorkflowDefinition
      template_name?: string
    }) => newRunInstance(workflow, template_name),
    onSuccess: () => {
      toast.success('工作流已提交运行')
      // 刷新运行实例列表
      queryClient.invalidateQueries({ queryKey: ['runs'] })
      queryClient.invalidateQueries({ queryKey: ['runCount'] })
      queryClient.invalidateQueries({ queryKey: ['runStats'] })
    },
    onError: (error: Error) => {
      toast.error(`运行失败: ${error.message || '未知错误'}`)
    },
  })
}

/**
 * 获取运行实例列表（分页）
 */
export const useRuns = (
  offset: number = 0,
  limit: number = 20,
  refetchInterval?:
    | number
    | false
    | ((query: Query<PaginatedWorkflowRunsV2>) => number | false | undefined),
) => {
  return useQuery<PaginatedWorkflowRunsV2>({
    queryKey: ['runs', offset, limit],
    queryFn: () => getRuns(offset, limit),
    staleTime: 30 * 1000, // 30秒缓存，运行状态变化较快
    refetchInterval,
  })
}

/**
 * 获取运行实例总数
 */
export const useRunCount = (
  refetchInterval?:
    | number
    | false
    | ((query: Query<number>) => number | false | undefined),
) => {
  return useQuery<number>({
    queryKey: ['runCount'],
    queryFn: () => getRunCount(),
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取运行实例统计信息
 */
export const useRunStats = (
  refetchInterval?:
    | number
    | false
    | ((query: Query<WorkflowRunStatisticsV2>) => number | false | undefined),
) => {
  return useQuery<WorkflowRunStatisticsV2>({
    queryKey: ['runStats'],
    queryFn: () => getRunStats(),
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取单个运行实例详情
 */
export const useRun = (
  uid: string,
  refetchInterval?:
    | number
    | false
    | ((query: Query<WorkflowRunV2>) => number | false | undefined),
) => {
  return useQuery<WorkflowRunV2>({
    queryKey: ['run', uid],
    queryFn: () => getRun(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取单个运行实例详情（SSE 实时推送版）
 * - settled=true：仅发一次 GET 请求
 * - settled=false：GET 获取初始状态后建立 SSE，FAILED 时也继续到全部独立分支收敛
 */
export const useRunStream = (uid: string) => {
  const { data: initialRun } = useRun(uid)
  const [streamed, setStreamed] = useState<{
    uid: string
    run: WorkflowRunV2
  } | null>(null)

  useEffect(() => {
    if (!uid || !initialRun || initialRun.settled) return

    const source = new EventSource(`${V2_API_URL}/runs/${uid}/stream`, {
      withCredentials: true,
    })
    source.onmessage = (event) => {
      try {
        const run = JSON.parse(event.data) as WorkflowRunV2
        setStreamed({ uid, run })
        if (run.settled) source.close()
      } catch {}
    }
    return () => source.close()
  }, [uid, initialRun])

  return streamed?.uid === uid ? streamed.run : (initialRun ?? null)
}

/**
 * 获取运行实例输出文件树
 */
export const useRunFiles = (runUid: string) => {
  return useQuery<RunFileNode[]>({
    queryKey: ['runFiles', runUid],
    queryFn: () => getRunFiles(runUid),
    enabled: !!runUid,
    staleTime: 60 * 1000,
  })
}
