'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  addWorkflowToProject,
  downloadWorkflowPackage,
  getProjectRun,
  getProjectRunCount,
  getProjectRunStats,
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
import type { Statistics } from '@/types/run'

// ============================================
// Query Hooks (数据查询)
// ============================================

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

export function useProjectRuns(
  projectId: string,
  offset: number = 0,
  limit: number = 100,
  refetchInterval?: number | false,
) {
  return useQuery<RunInstance[]>({
    queryKey: ['projects', projectId, 'runs', offset, limit],
    queryFn: () => getProjectRuns(projectId, offset, limit),
    enabled: !!projectId,
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

export function useProjectRunCount(projectId: string) {
  return useQuery<number>({
    queryKey: ['projects', projectId, 'runs', 'count'],
    queryFn: () => getProjectRunCount(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

export function useProjectRunStats(projectId: string) {
  return useQuery<Statistics>({
    queryKey: ['projects', projectId, 'runs', 'stats'],
    queryFn: () => getProjectRunStats(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

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

export function useDownloadWorkflowPackage() {
  return useMutation({
    mutationFn: ({
      projectId,
      workflowUid,
    }: {
      projectId: string
      workflowUid: string
    }) => downloadWorkflowPackage(projectId, workflowUid),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('工作流结果包下载成功')
    },
    onError: () => {
      toast.error('工作流结果包下载失败')
    },
  })
}

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
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'runs'],
      })
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'runs', 'stats'],
      })
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'workflows'],
      })
    },
  })
}
