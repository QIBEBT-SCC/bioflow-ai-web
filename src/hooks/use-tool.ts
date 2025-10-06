'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getGroupTools,
  getToolArg,
  getToolGroupList,
  searchTools,
} from '@/app/actions/tool'
import type { ToolArgPublic } from '@/types/node'
import type { SimpleToolInfo, ToolGroup } from '@/types/tool'

/**
 * 获取tool的参数信息（用于tool节点）
 */
export const useToolArg = (uid: string) => {
  return useQuery<ToolArgPublic>({
    queryKey: ['toolArg', uid],
    queryFn: () => getToolArg(uid),
    enabled: !!uid,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

/**
 * 获取工具分组列表
 */
export const useToolGroupList = () => {
  return useQuery<ToolGroup[]>({
    queryKey: ['toolGroupList'],
    queryFn: () => getToolGroupList(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存（分组列表很少变化）
  })
}

/**
 * 获取分组下的工具列表
 */
export const useGroupTools = (parent_id?: number) => {
  return useQuery<SimpleToolInfo[]>({
    queryKey: ['groupTools', parent_id],
    queryFn: () => getGroupTools(parent_id),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 搜索工具
 */
export const useSearchTools = (name: string, offset: number = 0) => {
  return useQuery<SimpleToolInfo[]>({
    queryKey: ['searchTools', name, offset],
    queryFn: () => searchTools(name, offset),
    enabled: !!name, // 只有当name不为空时才执行查询
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}
