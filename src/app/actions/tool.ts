'use server'

import { serverFetch } from '@/lib/api-server'
import type { ToolArgPublic } from '@/types/node'
import type { SimpleToolInfo, ToolGroup } from '@/types/tool'

/**
 * 获取tool的参数信息（用于节点编辑器）
 */
export async function getToolArg(uid: string): Promise<ToolArgPublic> {
  return await serverFetch<ToolArgPublic>(`/tools/${uid}/args`)
}

/**
 * 获取工具分组列表
 */
export async function getToolGroupList(): Promise<ToolGroup[]> {
  return await serverFetch<ToolGroup[]>('/tool-groups')
}

/**
 * 获取分组下的工具列表
 */
export async function getGroupTools(parent_id?: number): Promise<SimpleToolInfo[]> {
  const endpoint = parent_id !== undefined 
    ? `/tool-groups/tools?parent_id=${parent_id}` 
    : '/tool-groups/tools'
  return await serverFetch<SimpleToolInfo[]>(endpoint)
}

/**
 * 搜索工具
 */
export async function searchTools(name: string, offset: number = 0): Promise<SimpleToolInfo[]> {
  return await serverFetch<SimpleToolInfo[]>(
    `/tools/search?name=${encodeURIComponent(name)}&offset=${offset}&limit=12`
  )
}

