'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/api-server'
import type {
  SimpleWorkflowInfo,
  Workflow,
  WorkflowDefinition,
  AutoRunPublic,
  TaskStat,
} from '@/types/workflow'

/**
 * 获取workflow列表（分页）
 */
export async function getWorkflows(
  offset: number = 0,
  limit: number = 8,
): Promise<SimpleWorkflowInfo[]> {
  return await serverFetch<SimpleWorkflowInfo[]>(
    `/workflows?offset=${offset}&limit=${limit}`,
  )
}

/**
 * 获取workflow总数
 */
export async function getWorkflowCount(): Promise<number> {
  return await serverFetch<number>('/workflows/count')
}

/**
 * 获取单个workflow详情
 */
export async function getWorkflow(uid: string): Promise<Workflow> {
  return await serverFetch<Workflow>(`/workflows/${uid}`)
}

/**
 * 保存新的workflow
 */
export async function saveWorkflow(workflow: Workflow): Promise<string> {
  const result = await serverFetch<string>('/workflows', {
    method: 'POST',
    body: JSON.stringify(workflow),
  })
  revalidatePath('/editor')
  return result
}

/**
 * 更新已有workflow
 */
export async function updateWorkflow(
  uid: string,
  workflow: WorkflowDefinition,
): Promise<void> {
  await serverFetch(`/workflows/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(workflow),
  })
  revalidatePath('/editor')
  revalidatePath(`/editor/${uid}`)
}

/**
 * 创建新的运行实例
 */
export async function newRunInstance(
  workflow: WorkflowDefinition,
  template_name?: string,
): Promise<string> {
  const endpoint = template_name
    ? `/workflows/run?template_name=${encodeURIComponent(template_name)}`
    : '/workflows/run'

  return await serverFetch<string>(endpoint, {
    method: 'POST',
    body: JSON.stringify(workflow),
  })
}

/**
 * 获取所有运行实例（分页）
 */
export async function getRuns(
  offset: number = 0,
  limit: number = 20,
): Promise<AutoRunPublic[]> {
  return await serverFetch<AutoRunPublic[]>(
    `/runs?offset=${offset}&limit=${limit}`,
  )
}

/**
 * 获取运行实例总数
 */
export async function getRunCount(): Promise<number> {
  return await serverFetch<number>('/runs/count')
}

/**
 * 获取运行实例统计信息
 */
export async function getRunStats(): Promise<TaskStat> {
  return await serverFetch<TaskStat>('/runs/stats')
}

/**
 * 获取单个运行实例详情
 */
export async function getRun(uid: string): Promise<AutoRunPublic> {
  return await serverFetch<AutoRunPublic>(`/runs/${uid}`)
}