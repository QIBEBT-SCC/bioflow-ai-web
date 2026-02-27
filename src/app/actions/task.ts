import { clientFetch } from '@/lib/api-client'
import type {
  MonitorPublic,
  SimpleTaskPublic,
  TaskPublic,
  ToolOutput,
} from '@/types/task'

/**
 * 获取任务列表（分页）
 */
export async function getTasks(
  offset: number = 0,
  limit: number = 20,
): Promise<SimpleTaskPublic[]> {
  return await clientFetch<SimpleTaskPublic[]>(`/tasks`, {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取任务总数
 */
export async function getTaskCount(): Promise<number> {
  return await clientFetch<number>('/tasks/count')
}

/**
 * 获取最近N小时的任务
 */
export async function getRecentTasks(
  hours: number,
): Promise<SimpleTaskPublic[]> {
  return await clientFetch<SimpleTaskPublic[]>(`/tasks/recent/${hours}`)
}

/**
 * 获取单个任务详情
 */
export async function getTask(uid: string): Promise<TaskPublic> {
  return await clientFetch<TaskPublic>(`/tasks/${uid}`)
}

/**
 * 获取任务结果
 */
export async function getTaskResult(uid: string): Promise<ToolOutput> {
  return await clientFetch<ToolOutput>(`/tasks/${uid}/result`)
}

/**
 * 获取任务监控日志
 */
export async function getTaskMonitor(uid: string): Promise<MonitorPublic[]> {
  return await clientFetch<MonitorPublic[]>(`/tasks/${uid}/monitor`)
}

/**
 * 获取任务日志
 */
export async function getTaskLog(uid: string): Promise<{ content: string }> {
  return await clientFetch<{ content: string }>(`/tasks/${uid}/log`)
}
