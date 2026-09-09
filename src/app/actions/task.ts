import { clientFetchV2 } from '@/lib/api-client'
import type { MonitorPublic } from '@/types/task'
import type { NodeRunRecordV2, NodeRunV2 } from '@/types/workflow-v2'

/**
 * 获取最近N小时的任务
 */
export async function getRecentTasks(
  hours: number,
): Promise<NodeRunRecordV2[]> {
  return await clientFetchV2<NodeRunRecordV2[]>(`/node-runs/recent/${hours}`)
}

/**
 * 获取一个工作流运行当前代的全部任务
 */
export async function getRunTasks(runUid: string): Promise<NodeRunRecordV2[]> {
  return await clientFetchV2<NodeRunRecordV2[]>(`/runs/${runUid}/node-runs`)
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
