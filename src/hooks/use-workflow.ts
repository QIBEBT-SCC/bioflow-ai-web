'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  deleteWorkflow,
  getWorkflow,
  getWorkflowCount,
  getWorkflows,
  saveWorkflow,
  updateWorkflow,
} from '@/app/actions/workflow'
import type { Workflow, WorkflowDefinition } from '@/types/workflow'

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
      data,
    }: {
      uid: string
      data: { name?: string; workflow?: WorkflowDefinition }
    }) => updateWorkflow(uid, data),
    onSuccess: (_, { uid }) => {
      toast.success('Workflow更新成功')
      queryClient.invalidateQueries({ queryKey: ['workflow', uid] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message || '未知错误'}`)
    },
  })
}

/**
 * 删除workflow
 */
export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => deleteWorkflow(uid),
    onSuccess: () => {
      toast.success('Workflow已删除')
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflowCount'] })
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message || '未知错误'}`)
    },
  })
}
