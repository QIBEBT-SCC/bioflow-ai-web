import { clientFetch } from '@/lib/api-client'
import type { RunFileNode, RunPublic, Statistics } from '@/types/run'
import type { WorkflowDefinition } from '@/types/workflow'

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

  return await clientFetch<string>(endpoint, {
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
): Promise<RunPublic[]> {
  return await clientFetch<RunPublic[]>('/runs', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取运行实例总数
 */
export async function getRunCount(): Promise<number> {
  return await clientFetch<number>('/runs/count')
}

/**
 * 获取运行实例统计信息
 */
export async function getRunStats(): Promise<Statistics> {
  return await clientFetch<Statistics>('/runs/statistics')
}

/**
 * 获取单个运行实例详情
 */
export async function getRun(uid: string): Promise<RunPublic> {
  return await clientFetch<RunPublic>(`/runs/${uid}`)
}

/**
 * 获取运行实例输出文件树
 */
export async function getRunFiles(runUid: string): Promise<RunFileNode[]> {
  return await clientFetch<RunFileNode[]>(`/runs/${runUid}/files`)
}
