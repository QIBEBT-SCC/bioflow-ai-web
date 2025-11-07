'use server'

import { serverFetch } from '@/lib/api-server'
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
  return await serverFetch<SimpleTaskPublic[]>(
    `/tasks?offset=${offset}&limit=${limit}`,
  )
}

/**
 * 获取任务总数
 */
export async function getTaskCount(): Promise<number> {
  return await serverFetch<number>('/tasks/count')
}

/**
 * 获取最近N小时的任务
 */
export async function getRecentTasks(
  hours: number,
): Promise<SimpleTaskPublic[]> {
  return await serverFetch<SimpleTaskPublic[]>(`/tasks/recent/${hours}`)
}

/**
 * 获取单个任务详情
 */
export async function getTask(uid: string): Promise<TaskPublic> {
  return await serverFetch<TaskPublic>(`/tasks/${uid}`)
}

/**
 * 获取任务结果
 */
export async function getTaskResult(uid: string): Promise<ToolOutput> {
  return await serverFetch<ToolOutput>(`/tasks/${uid}/result`)
}

/**
 * 获取任务监控日志
 */
export async function getTaskMonitor(uid: string): Promise<MonitorPublic[]> {
  return await serverFetch<MonitorPublic[]>(`/tasks/${uid}/monitor`)
}

/**
 * 获取任务日志
 */
export async function getTaskLog(uid: string): Promise<{ content: string }> {
  return await serverFetch<{ content: string }>(`/tasks/${uid}/log`)
}
