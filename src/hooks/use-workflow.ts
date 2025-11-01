'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getWorkflow,
  getWorkflowCount,
  getWorkflows,
  newRunInstance,
  saveWorkflow,
  updateWorkflow,
  getRuns,
  getRunCount,
  getRunStats,
  getRun,
} from '@/app/actions/workflow'
import type { Workflow, WorkflowDefinition, AutoRunPublic, TaskStat } from '@/types/workflow'

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取workflow列表（分页）
 */
export const useWorkflows = (offset: number = 0) => {
  return useQuery({
    queryKey: ['workflows', offset],
    queryFn: () => getWorkflows(offset, 8),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取workflow总数
 */
export const useWorkflowCount = () => {
  return useQuery({
    queryKey: ['workflowCount'],
    queryFn: () => getWorkflowCount(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取单个workflow详情
 */
export const useWorkflow = (uid: string) => {
  return useQuery({
    queryKey: ['workflow', uid],
    queryFn: () => getWorkflow(uid),
    enabled: !!uid, // 只有uid存在时才查询
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// Mutation Hooks (数据变更)
// ============================================

/**
 * 保存新workflow
 */
export const useSaveWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workflow: Workflow) => saveWorkflow(workflow),
    onSuccess: () => {
      toast.success('Workflow保存成功')
      // 刷新workflow列表
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflowCount'] })
    },
    onError: (error: Error) => {
      toast.error(`保存失败: ${error.message || '未知错误'}`)
    },
  })
}

/**
 * 更新workflow
 */
export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      workflow,
    }: {
      uid: string
      workflow: WorkflowDefinition
    }) => updateWorkflow(uid, workflow),
    onSuccess: (_, { uid }) => {
      toast.success('Workflow更新成功')
      // 刷新特定workflow和列表
      queryClient.invalidateQueries({ queryKey: ['workflow', uid] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message || '未知错误'}`)
    },
  })
}

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

// ============================================
// Run Instance Query Hooks (运行实例查询)
// ============================================

/**
 * 获取运行实例列表（分页）
 */
export const useRuns = (offset: number = 0, limit: number = 20) => {
  return useQuery<AutoRunPublic[]>({
    queryKey: ['runs', offset, limit],
    queryFn: () => getRuns(offset, limit),
    staleTime: 30 * 1000, // 30秒缓存，运行状态变化较快
    refetchInterval: 5000, // 每5秒自动刷新
  })
}

/**
 * 获取运行实例总数
 */
export const useRunCount = () => {
  return useQuery<number>({
    queryKey: ['runCount'],
    queryFn: () => getRunCount(),
    staleTime: 30 * 1000,
    refetchInterval: 10000, // 每10秒刷新
  })
}

/**
 * 获取运行实例统计信息
 */
export const useRunStats = () => {
  return useQuery<TaskStat>({
    queryKey: ['runStats'],
    queryFn: () => getRunStats(),
    staleTime: 30 * 1000,
    refetchInterval: 5000, // 每5秒刷新
  })
}

/**
 * 获取单个运行实例详情
 */
export const useRun = (uid: string) => {
  return useQuery<AutoRunPublic>({
    queryKey: ['run', uid],
    queryFn: () => getRun(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
    refetchInterval: 3000, // 每3秒刷新
  })
}
