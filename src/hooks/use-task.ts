'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getRecentTasks,
  getTask,
  getTaskCount,
  getTaskLog,
  getTaskMonitor,
  getTaskResult,
  getTasks,
} from '@/app/actions/task'
import type {
  MonitorPublic,
  SimpleTaskPublic,
  TaskPublic,
  ToolOutput,
} from '@/types/task'

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取任务列表（分页）
 */
export const useTasks = (offset: number = 0, limit: number = 20) => {
  return useQuery<SimpleTaskPublic[]>({
    queryKey: ['tasks', offset, limit],
    queryFn: () => getTasks(offset, limit),
    staleTime: 30 * 1000, // 30秒缓存
  })
}

/**
 * 获取任务总数
 */
export const useTaskCount = () => {
  return useQuery<number>({
    queryKey: ['tasks', 'count'],
    queryFn: getTaskCount,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取最近N小时的任务
 */
export const useRecentTasks = (hours: number) => {
  return useQuery<SimpleTaskPublic[]>({
    queryKey: ['tasks', 'recent', hours],
    queryFn: () => getRecentTasks(hours),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // 每30秒自动刷新
  })
}

/**
 * 获取单个任务详情
 */
export const useTask = (uid: string) => {
  return useQuery<TaskPublic>({
    queryKey: ['tasks', uid],
    queryFn: () => getTask(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取任务结果
 */
export const useTaskResult = (uid: string) => {
  return useQuery<ToolOutput>({
    queryKey: ['tasks', uid, 'result'],
    queryFn: () => getTaskResult(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取任务监控日志
 */
export const useTaskMonitor = (uid: string) => {
  return useQuery<MonitorPublic[]>({
    queryKey: ['tasks', uid, 'monitor'],
    queryFn: () => getTaskMonitor(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

/**
 * 获取任务日志
 */
export const useTaskLog = (uid: string) => {
  return useQuery<{ content: string }>({
    queryKey: ['tasks', uid, 'log'],
    queryFn: () => getTaskLog(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  })
}
