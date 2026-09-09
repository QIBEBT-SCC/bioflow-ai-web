import { clientFetchV2 } from '@/lib/api-client'
import type { MonitorPublic } from '@/types/task'
import type {
  NodeRunRecordV2,
  NodeRunStatusV2,
  NodeRunV2,
  PaginatedNodeRunsV2,
} from '@/types/workflow-v2'

/**
 * 获取任务列表（分页）
 */
export async function getTasks(
  offset: number = 0,
  limit: number = 20,
  status?: NodeRunStatusV2,
): Promise<PaginatedNodeRunsV2> {
  const params: Record<string, string> = {
    offset: String(offset),
    limit: String(limit),
  }
  if (status) params.status = status
  return await clientFetchV2<PaginatedNodeRunsV2>('/node-runs', { params })
}

/**
 * 获取最近N小时的任务
 */
export async function getRecentTasks(
  hours: number,
): Promise<NodeRunRecordV2[]> {
  return await clientFetchV2<NodeRunRecordV2[]>(`/node-runs/recent/${hours}`)
}

/**
 * 获取单个任务详情
 */
export async function getTask(uid: string): Promise<NodeRunV2> {
  return await clientFetchV2<NodeRunV2>(`/node-runs/${uid}`)
}

/**
 * 获取任务监控日志
 */
export async function getTaskMonitor(uid: string): Promise<MonitorPublic[]> {
  return await clientFetchV2<MonitorPublic[]>(`/node-runs/${uid}/monitor`)
}

/**
 * 获取任务日志
 */
export async function getTaskLog(
  uid: string,
): Promise<{ content: string; offset: number }> {
  return await clientFetchV2<{ content: string; offset: number }>(
    `/node-runs/${uid}/log`,
  )
}
