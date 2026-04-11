import {
  type Query,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getRun,
  getRunCount,
  getRunFiles,
  getRunStats,
  getRuns,
  newRunInstance,
} from '@/app/actions/run'
import { getToken } from '@/lib/api-client'
import type { RunFileNode, RunPublic, Statistics } from '@/types/run'
import { Status } from '@/types/run'
import type { WorkflowDefinition } from '@/types/workflow'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

// ============================================
// Run Instance Query Hooks (运行实例查询)
// ============================================

/**
 * 创建运行实例
 */
export const useNewRunInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workflow,
      template_name,
    }: {
      workflow: WorkflowDefinition
      template_name?: string
    }) => newRunInstance(workflow, template_name),
    onSuccess: () => {
      toast.success('工作流已提交运行')
      // 刷新运行实例列表
      queryClient.invalidateQueries({ queryKey: ['runs'] })
      queryClient.invalidateQueries({ queryKey: ['runCount'] })
      queryClient.invalidateQueries({ queryKey: ['runStats'] })
    },
    onError: (error: Error) => {
      toast.error(`运行失败: ${error.message || '未知错误'}`)
    },
  })
}

/**
 * 获取运行实例列表（分页）
 */
export const useRuns = (
  offset: number = 0,
  limit: number = 20,
  refetchInterval?:
    | number
    | false
    | ((query: Query<RunPublic[]>) => number | false | undefined),
) => {
  return useQuery<RunPublic[]>({
    queryKey: ['runs', offset, limit],
    queryFn: () => getRuns(offset, limit),
    staleTime: 30 * 1000, // 30秒缓存，运行状态变化较快
    refetchInterval,
  })
}

/**
 * 获取运行实例总数
 */
export const useRunCount = (
  refetchInterval?:
    | number
    | false
    | ((query: Query<number>) => number | false | undefined),
) => {
  return useQuery<number>({
    queryKey: ['runCount'],
    queryFn: () => getRunCount(),
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取运行实例统计信息
 */
export const useRunStats = (
  refetchInterval?:
    | number
    | false
    | ((query: Query<Statistics>) => number | false | undefined),
) => {
  return useQuery<Statistics>({
    queryKey: ['runStats'],
    queryFn: () => getRunStats(),
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取单个运行实例详情
 */
export const useRun = (
  uid: string,
  refetchInterval?:
    | number
    | false
    | ((query: Query<RunPublic>) => number | false | undefined),
) => {
  return useQuery<RunPublic>({
    queryKey: ['run', uid],
    queryFn: () => getRun(uid),
    enabled: !!uid,
    staleTime: 30 * 1000,
    refetchInterval,
  })
}

/**
 * 获取单个运行实例详情（SSE 实时推送版）
 * - 终态（SUCCESS/ERROR）：仅发一次 GET 请求
 * - 运行中/等待中：GET 获取初始状态后建立 SSE 连接，后端推送更新直至终态
 */
export const useRunStream = (uid: string) => {
  const [run, setRun] = useState<RunPublic | null>(null)

  useEffect(() => {
    if (!uid) return

    let controller: AbortController

    async function init() {
      const initial = await getRun(uid)
      setRun(initial)

      if (
        initial.status !== Status.WAITING &&
        initial.status !== Status.RUNNING
      )
        return

      controller = new AbortController()
      const token = getToken()
      const res = await fetch(`${FASTAPI_URL}/runs/${uid}/stream`, {
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
              setRun(JSON.parse(json) as RunPublic)
            } catch {}
          }
        }
      }
    }

    init().catch(() => {})
    return () => controller?.abort()
  }, [uid])

  return run
}

/**
 * 获取运行实例输出文件树
 */
export const useRunFiles = (runUid: string) => {
  return useQuery<RunFileNode[]>({
    queryKey: ['runFiles', runUid],
    queryFn: () => getRunFiles(runUid),
    enabled: !!runUid,
    staleTime: 60 * 1000,
  })
}
