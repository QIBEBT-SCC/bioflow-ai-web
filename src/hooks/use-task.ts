'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getRecentTasks,
  getTask,
  getTaskLog,
  getTaskMonitor,
  getTasks,
} from '@/app/actions/task'
import type { MonitorPublic } from '@/types/task'
import {
  type NodeRunRecordV2,
  NodeRunStatusV2,
  type NodeRunV2,
  type PaginatedNodeRunsV2,
} from '@/types/workflow-v2'

const TERMINAL_NODE_RUN_STATUSES = new Set<NodeRunStatusV2>([
  NodeRunStatusV2.SUCCEEDED,
  NodeRunStatusV2.FAILED,
  NodeRunStatusV2.BLOCKED,
])

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取任务列表（分页）
 */
export const useTasks = (
  offset: number = 0,
  limit: number = 20,
  status?: NodeRunStatusV2,
) => {
  return useQuery<PaginatedNodeRunsV2>({
    queryKey: ['node-runs', offset, limit, status],
    queryFn: () => getTasks(offset, limit, status),
    staleTime: 30 * 1000, // 30秒缓存
  })
}

/**
 * 获取最近N小时的任务
 */
export const useRecentTasks = (hours: number) => {
  return useQuery<NodeRunRecordV2[]>({
    queryKey: ['node-runs', 'recent', hours],
    queryFn: () => getRecentTasks(hours),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // 每30秒自动刷新
  })
}

/**
 * 获取单个任务详情
 */
export const useTask = (uid: string) => {
  return useQuery<NodeRunV2>({
    queryKey: ['node-runs', uid],
    queryFn: () => getTask(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && TERMINAL_NODE_RUN_STATUSES.has(status) ? false : 3_000
    },
  })
}

/**
 * 获取任务监控日志
 */
export const useTaskMonitor = (uid: string) => {
  return useQuery<MonitorPublic[]>({
    queryKey: ['node-runs', uid, 'monitor'],
    queryFn: () => getTaskMonitor(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

/**
 * 获取任务日志
 */
export const useTaskLog = (uid: string, refetchInterval?: number | false) => {
  return useQuery<{ content: string; offset: number }>({
    queryKey: ['node-runs', uid, 'log'],
    queryFn: () => getTaskLog(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    refetchInterval,
  })
}
