'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWorkflowToProject,
  getProjectRun,
  getProjectRunCount,
  getProjectRuns,
  getProjectWorkflows,
  removeWorkflowFromProject,
  runWorkflow,
} from '@/app/actions/project-workflow'
import type {
  AddWorkflowRequest,
  ProjectWorkflow,
  RunInstance,
  RunWorkflowRequest,
  WorkflowRunResult,
} from '@/types/project-workflow'

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取项目的工作流列表
 */
export function useProjectWorkflows(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
) {
  return useQuery<ProjectWorkflow[]>({
    queryKey: ['projects', projectId, 'workflows', offset, limit],
    queryFn: () => getProjectWorkflows(projectId, offset, limit),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取项目的运行历史
 */
export function useProjectRuns(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
) {
  return useQuery<RunInstance[]>({
    queryKey: ['projects', projectId, 'runs', offset, limit],
    queryFn: () => getProjectRuns(projectId, offset, limit),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取项目运行实例数量
 */
export function useProjectRunCount(projectId: string) {
  return useQuery<number>({
    queryKey: ['projects', projectId, 'runs', 'count'],
    queryFn: () => getProjectRunCount(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取运行实例详情
 */
export function useProjectRun(projectId: string, runUid: string) {
  return useQuery<RunInstance>({
    queryKey: ['projects', projectId, 'runs', runUid],
    queryFn: () => getProjectRun(projectId, runUid),
    enabled: !!projectId && !!runUid,
    staleTime: 30 * 1000,
  })
}

// ============================================
// Mutation Hooks (数据变更)
// ============================================

/**
 * 添加工作流到项目
 */
export function useAddWorkflowToProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string
      data: AddWorkflowRequest
    }) => addWorkflowToProject(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'workflows'],
      })
    },
  })
}

/**
 * 从项目移除工作流
 */
export function useRemoveWorkflowFromProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      workflowUid,
    }: {
      projectId: string
      workflowUid: string
    }) => removeWorkflowFromProject(projectId, workflowUid),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'workflows'],
      })
    },
  })
}

/**
 * 运行工作流
 */
export function useRunWorkflow() {
  const queryClient = useQueryClient()
  return useMutation<
    WorkflowRunResult,
    Error,
    {
      projectId: string
      workflowUid: string
      data: RunWorkflowRequest
    }
  >({
    mutationFn: ({ projectId, workflowUid, data }) =>
      runWorkflow(projectId, workflowUid, data),
    onSuccess: (_, { projectId }) => {
      // 刷新运行历史
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'runs'],
      })
    },
  })
}
