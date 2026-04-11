'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  getRecentTasks,
  getTask,
  getTaskCount,
  getTaskLog,
  getTaskMonitor,
  getTaskResult,
  getTasks,
} from '@/app/actions/task'
import { getToken } from '@/lib/api-client'
import type {
  MonitorPublic,
  SimpleTaskPublic,
  TaskPublic,
  ToolOutput,
} from '@/types/task'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

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
export const useTaskLog = (uid: string, refetchInterval?: number | false) => {
  return useQuery<{ content: string }>({
    queryKey: ['tasks', uid, 'log'],
    queryFn: () => getTaskLog(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    refetchInterval,
  })
}

/**
 * 获取任务日志（SSE 实时推送版）
 * - isRunning 为 false：仅发一次 GET 请求
 * - isRunning 为 true：GET 获取初始日志后建立 SSE 连接，后端推送直至任务结束
 */
export const useTaskLogStream = (uid: string, isRunning: boolean) => {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) return

    let controller: AbortController

    async function init() {
      const initial = await getTaskLog(uid)
      setContent(initial.content)

      if (!isRunning) return

      controller = new AbortController()
      const token = getToken()
      const res = await fetch(`${FASTAPI_URL}/tasks/${uid}/log/stream`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        signal: controller.signal,
      })

      if (!res.ok || !res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const json = line.slice(5).trim()
            if (!json) continue
            try {
              const data = JSON.parse(json) as { content: string }
              setContent(data.content)
            } catch {}
          }
        }
      }
    }

    init().catch(() => {})
    return () => controller?.abort()
  }, [uid, isRunning])

  return content
}
