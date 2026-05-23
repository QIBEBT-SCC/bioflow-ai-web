import { clientFetch } from '@/lib/api-client'
import type {
  ExecutionScope,
  SimpleWorkflowInfo,
  Workflow,
  WorkflowDefinition,
} from '@/types/workflow'

/**
 * 获取workflow列表（分页）
 */
export async function getWorkflows(
  offset: number = 0,
  limit: number = 8,
): Promise<SimpleWorkflowInfo[]> {
  return await clientFetch<SimpleWorkflowInfo[]>('/workflows', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取workflow总数
 */
export async function getWorkflowCount(): Promise<number> {
  return await clientFetch<number>('/workflows/count')
}

/**
 * 获取单个workflow详情
 */
export async function getWorkflow(uid: string): Promise<Workflow> {
  return await clientFetch<Workflow>(`/workflows/${uid}`)
}

/**
 * 保存新的workflow
 */
export async function saveWorkflow(workflow: Workflow): Promise<string> {
  return await clientFetch<string>('/workflows', {
    method: 'POST',
    body: JSON.stringify(workflow),
  })
}

/**
 * 更新已有workflow（名称和/或定义）
 */
export async function updateWorkflow(
  uid: string,
  data: {
    name?: string
    workflow?: WorkflowDefinition
    execution_scope?: ExecutionScope
    auto_summary?: boolean
    summary_prompt?: string | null
  },
): Promise<void> {
  await clientFetch(`/workflows/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * 删除workflow
 */
export async function deleteWorkflow(uid: string): Promise<void> {
  await clientFetch(`/workflows/${uid}`, {
    method: 'DELETE',
  })
}
