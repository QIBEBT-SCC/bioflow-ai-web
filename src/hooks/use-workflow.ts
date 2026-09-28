'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  deleteWorkflow,
  getWorkflow,
  getWorkflows,
  saveWorkflow,
  searchSubgraphs,
  updateWorkflow,
} from '@/app/actions/workflow'
import type {
  ExecutionScope,
  PaginatedWorkflows,
  SimpleWorkflowInfo,
  Workflow,
  WorkflowDefinition,
  WorkflowType,
} from '@/types/workflow'

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取workflow列表（分页）
 */
export const useWorkflows = (
  offset: number = 0,
  limit: number = 8,
  wfType?: WorkflowType,
  query: string = '',
  enabled: boolean = true,
) => {
  return useQuery<PaginatedWorkflows>({
    queryKey: ['workflows', offset, limit, wfType, query],
    queryFn: () => getWorkflows(offset, limit, wfType, query),
    enabled,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

export const useSearchSubgraphs = (query: string, limit: number = 20) => {
  const normalizedQuery = query.trim()
  return useQuery<SimpleWorkflowInfo[]>({
    queryKey: ['workflows', 'search', normalizedQuery, limit],
    queryFn: () => searchSubgraphs(normalizedQuery, limit),
    enabled: normalizedQuery.length > 0,
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
  const t = useTranslations('Toast.workflow')
  const tUnknown = useTranslations('Toast')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workflow: Workflow) => saveWorkflow(workflow),
    onSuccess: () => {
      toast.success(t('saveSuccess'))
      // 刷新workflow列表
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflowCount'] })
    },
    onError: (error: Error) => {
      toast.error(
        t('saveFailed', { message: error.message || tUnknown('unknownError') }),
      )
    },
  })
}

/**
 * 更新workflow
 */
export const useUpdateWorkflow = () => {
  const t = useTranslations('Toast.workflow')
  const tUnknown = useTranslations('Toast')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      data,
    }: {
      uid: string
      data: {
        name?: string
        description?: string
        public?: boolean
        workflow?: WorkflowDefinition
        execution_scope?: ExecutionScope
      }
    }) => updateWorkflow(uid, data),
    onSuccess: (_, { uid }) => {
      toast.success(t('updateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['workflow', uid] })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: Error) => {
      toast.error(
        t('updateFailed', {
          message: error.message || tUnknown('unknownError'),
        }),
      )
    },
  })
}

/**
 * 删除workflow
 */
export const useDeleteWorkflow = () => {
  const t = useTranslations('Toast.workflow')
  const tUnknown = useTranslations('Toast')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => deleteWorkflow(uid),
    onSuccess: () => {
      toast.success(t('deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflowCount'] })
    },
    onError: (error: Error) => {
      toast.error(
        t('deleteFailed', {
          message: error.message || tUnknown('unknownError'),
        }),
      )
    },
  })
}
