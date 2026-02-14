'use server'

import { serverFetch } from '@/lib/api-server'
import type {
  AddWorkflowRequest,
  ProjectWorkflow,
  RunInstance,
  RunWorkflowRequest,
  WorkflowRunResult,
} from '@/types/project-workflow'

/**
 * 添加工作流到项目
 */
export async function addWorkflowToProject(
  projectId: string,
  data: AddWorkflowRequest,
): Promise<ProjectWorkflow> {
  return await serverFetch<ProjectWorkflow>(
    `/projects/${projectId}/workflows`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 获取项目的工作流列表
 */
export async function getProjectWorkflows(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
): Promise<ProjectWorkflow[]> {
  return await serverFetch<ProjectWorkflow[]>(
    `/projects/${projectId}/workflows`,
    {
      params: {
        offset: String(offset),
        limit: String(limit),
      },
    },
  )
}

/**
 * 从项目移除工作流
 */
export async function removeWorkflowFromProject(
  projectId: string,
  workflowUid: string,
): Promise<{ message: string }> {
  return await serverFetch<{ message: string }>(
    `/projects/${projectId}/workflows/${workflowUid}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * 运行工作流
 */
export async function runWorkflow(
  projectId: string,
  workflowUid: string,
  data: RunWorkflowRequest,
): Promise<WorkflowRunResult> {
  return await serverFetch<WorkflowRunResult>(
    `/projects/${projectId}/workflows/${workflowUid}/run`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 获取项目的运行历史
 */
export async function getProjectRuns(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
): Promise<RunInstance[]> {
  return await serverFetch<RunInstance[]>(`/projects/${projectId}/runs`, {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取项目运行实例数量
 */
export async function getProjectRunCount(projectId: string): Promise<number> {
  return await serverFetch<number>(`/projects/${projectId}/runs/count`)
}

/**
 * 获取运行实例详情
 */
export async function getProjectRun(
  projectId: string,
  runUid: string,
): Promise<RunInstance> {
  return await serverFetch<RunInstance>(
    `/projects/${projectId}/runs/${runUid}`,
  )
}
