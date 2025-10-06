'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createDB,
  deleteDB,
  getDB,
  getDBCount,
  getDBList,
  searchDB,
} from '@/app/actions/resource'
import type { BioDb, BioDbCreate } from '@/types/resource'

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取数据库列表（分页）
 */
export const useDBList = (offset: number = 0, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['databases', 'list', offset],
    queryFn: () => getDBList(offset, 8),
    enabled,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取数据库总数
 */
export const useDBCount = () => {
  return useQuery({
    queryKey: ['databases', 'count'],
    queryFn: () => getDBCount(),
    staleTime: 5 * 60 * 1000,
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
export const useSearchDB = (name: string, offset: number = 0) => {
  return useQuery({
    queryKey: ['databases', 'search', name, offset],
    queryFn: () => searchDB(name, offset, 10), // 搜索时返回更多结果
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
      // 自动刷新列表和总数
      queryClient.invalidateQueries({queryKey: ['databases', 'list']}).then()
       queryClient.invalidateQueries({queryKey: ['databases', 'count']}).then()
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
      // 刷新列表和总数
      queryClient.invalidateQueries({queryKey: ['databases', 'list']}).then()
       queryClient.invalidateQueries({queryKey: ['databases', 'count']}).then()
       // 删除详情缓存
      queryClient.removeQueries({ queryKey: ['database', id] })
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message || '未知错误'}`)
    },
  })
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
      queryClient.setQueriesData<BioDb[]>(
        { queryKey: ['databases', 'list'] },
        (old) => old?.filter((db) => db.id !== id),
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
      queryClient.invalidateQueries({ queryKey: ['databases', 'count'] })
    },
  })
}
