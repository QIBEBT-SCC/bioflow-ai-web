'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getRecentTasks,
  getRunTasks,
  getTask,
  getTaskLog,
  getTaskMonitor,
} from '@/app/actions/task'
import type { MonitorPublic } from '@/types/task'
import {
  type NodeRunRecordV2,
  NodeRunStatusV2,
  type NodeRunV2,
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
 * 获取最近N小时的任务
 */
export const useRecentTasks = (
  hours: number,
  refetchInterval: number | false = 30 * 1000,
) => {
  return useQuery<NodeRunRecordV2[]>({
    queryKey: ['node-runs', 'recent', hours],
    queryFn: () => getRecentTasks(hours),
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取一个工作流运行当前代的任务
 */
export const useRunTasks = (
  runUid: string,
  enabled: boolean,
  refetchInterval?: number | false,
) => {
  return useQuery<NodeRunRecordV2[]>({
    queryKey: ['node-runs', 'run', runUid],
    queryFn: () => getRunTasks(runUid),
    enabled: enabled && !!runUid,
    staleTime: 30 * 1000,
    refetchInterval,
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
