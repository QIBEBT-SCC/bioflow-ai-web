'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  createDB,
  deleteDB,
  downloadDB,
  getDB,
  getDBList,
  getDownloadStatus,
  searchDB,
} from '@/app/actions/resource'
import type {
  BioDbCreate,
  BioDbDownloadStatus,
  PaginatedBioDbSimple,
  PaginatedBioDbs,
} from '@/types/resource'

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取数据库列表（分页）
 */
export const useDBList = (
  offset: number = 0,
  limit: number = 8,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ['databases', 'list', offset, limit],
    queryFn: () => getDBList(offset, limit),
    enabled,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取单个数据库详情
 */
export const useDB = (id: number) => {
  return useQuery({
    queryKey: ['database', id],
    queryFn: () => getDB(id),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 搜索数据库
 */
export const useSearchDB = (
  name: string,
  offset: number = 0,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: ['databases', 'search', name, offset, limit],
    queryFn: () => searchDB(name, offset, limit),
    enabled: !!name && name.trim().length > 0, // 只有有搜索词时才查询
    staleTime: 2 * 60 * 1000, // 搜索结果缓存2分钟
  })
}

// ============================================
// Mutation Hooks (数据变更)
// ============================================

/**
 * 创建数据库
 */
export const useCreateDB = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BioDbCreate) => createDB(data),
    onSuccess: () => {
      toast.success('数据库添加成功')
      queryClient.invalidateQueries({ queryKey: ['databases', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['databases', 'search'] })
    },
    onError: (error: Error & { status?: number }) => {
      // 错误由组件处理，这里只记录
      console.error('Create database error:', error)
    },
  })
}

/**
 * 删除数据库
 */
export const useDeleteDB = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteDB(id),
    onSuccess: (_, id) => {
      toast.success('数据库删除成功')
      queryClient.invalidateQueries({ queryKey: ['databases', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['databases', 'search'] })
      // 删除详情缓存
      queryClient.removeQueries({ queryKey: ['database', id] })
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message || '未知错误'}`)
    },
  })
}

/**
 * 提交数据库下载任务
 */
export const useDownloadDB = () => {
  return useMutation({
    mutationFn: (id: number) => downloadDB(id),
    onSuccess: (result) => {
      toast.success(result.message)
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        toast.error('下载任务已在进行中')
      } else if (error.status === 422) {
        toast.error('未配置下载命令')
      } else {
        toast.error(`提交下载任务失败: ${error.message || '未知错误'}`)
      }
    },
  })
}

/**
 * 数据库下载状态（SSE 实时推送版）
 * - 先 GET 获取初始状态
 * - 若处于下载中，则建立 SSE 连接，后端推送直至到达终态
 */
export const useDownloadStatusStream = (
  id: number | null,
  restartToken: number = 0,
) => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<BioDbDownloadStatus | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: restartToken 用于在提交下载任务后手动重启 SSE 连接
  useEffect(() => {
    if (id === null) {
      setStatus(null)
      return
    }

    let controller: AbortController | undefined
    let cancelled = false

    async function init(dbId: number) {
      const initial = await getDownloadStatus(dbId)
      if (cancelled) return
      setStatus(initial.status)

      if (initial.status !== 'downloading') return

      controller = new AbortController()
      const res = await fetch(
        `${FASTAPI_URL}/bio_dbs/${dbId}/download/events`,
        {
          credentials: 'include',
          signal: controller.signal,
        },
      )
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
          if (!line.startsWith('data:')) continue
          const json = line.slice(5).trim()
          if (!json) continue
          try {
            const data = JSON.parse(json) as { status: BioDbDownloadStatus }
            setStatus(data.status)
            if (data.status === 'ready') {
              queryClient.invalidateQueries({ queryKey: ['database', dbId] })
              queryClient.invalidateQueries({ queryKey: ['databases', 'list'] })
            }
          } catch {}
        }
      }
    }

    init(id).catch(() => {})
    return () => {
      cancelled = true
      controller?.abort()
    }
  }, [id, restartToken, queryClient])

  return status
}

// ============================================
// 辅助 Hooks
// ============================================

/**
 * 预加载数据库详情（用于悬停时预加载）
 */
export const usePrefetchDB = () => {
  const queryClient = useQueryClient()

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: ['database', id],
      queryFn: () => getDB(id),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/**
 * 乐观更新：删除数据库（立即从列表移除，后台确认）
 */
export const useOptimisticDeleteDB = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteDB(id),
    onMutate: async (id) => {
      // 取消所有相关查询
      await queryClient.cancelQueries({ queryKey: ['databases', 'list'] })

      // 保存之前的数据（用于回滚）
      const previousData = queryClient.getQueriesData({
        queryKey: ['databases', 'list'],
      })

      // 乐观更新：从所有列表中移除该数据库
      queryClient.setQueriesData<PaginatedBioDbSimple>(
        { queryKey: ['databases', 'list'] },
        (old) =>
          old
            ? {
                ...old,
                total: Math.max(0, old.total - 1),
                data: old.data.filter((db) => db.id !== id),
              }
            : old,
      )
      queryClient.setQueriesData<PaginatedBioDbs>(
        { queryKey: ['databases', 'search'] },
        (old) =>
          old
            ? {
                ...old,
                total: Math.max(0, old.total - 1),
                data: old.data.filter((db) => db.id !== id),
              }
            : old,
      )

      return { previousData }
    },
    onError: (_err, _id, context) => {
      // 回滚
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      toast.error('删除失败')
    },
    onSuccess: (_, id) => {
      toast.success('数据库删除成功')
      queryClient.removeQueries({ queryKey: ['database', id] })
      queryClient.invalidateQueries({ queryKey: ['databases', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['databases', 'search'] })
    },
  })
}
