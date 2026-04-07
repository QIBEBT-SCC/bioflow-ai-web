import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getRun,
  getRunCount,
  getRunFiles,
  getRunStats,
  getRuns,
  newRunInstance,
} from '@/app/actions/run'
import type { RunFileNode, RunPublic, Statistics } from '@/types/run'
import type { WorkflowDefinition } from '@/types/workflow'

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
  refetchInterval?: number | false,
) => {
  return useQuery<RunPublic[]>({
    queryKey: ['runs', offset, limit],
    queryFn: () => getRuns(offset, limit),
    staleTime: 30 * 1000, // 30秒缓存，运行状态变化较快
    refetchInterval,
  })
}

/**
 * 获取运行实例总数
 */
export const useRunCount = (refetchInterval?: number | false) => {
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
export const useRunStats = (refetchInterval?: number | false) => {
  return useQuery<Statistics>({
    queryKey: ['runStats'],
    queryFn: () => getRunStats(),
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取单个运行实例详情
 */
export const useRun = (uid: string, refetchInterval?: number | false) => {
  return useQuery<RunPublic>({
    queryKey: ['run', uid],
    queryFn: () => getRun(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
    refetchInterval,
  })
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
