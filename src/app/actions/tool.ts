'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/api-server'
import type { ToolArgPublic } from '@/types/node'
import type { DockerToolCreate, SimpleToolInfo, ToolGroup, ToolInfo, ToolTag } from '@/types/tool'

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

/**
 * 获取工具标签列表
 */
export async function getToolTagList(): Promise<ToolTag[]> {
  return await serverFetch<ToolTag[]>('/tool-tags')
}

/**
 * 获取工具总数
 */
export async function getToolCount(): Promise<number> {
  return await serverFetch<number>('/tools/count')
}

/**
 * 获取工具列表
 */
export async function getToolList(offset: number = 0, limit: number = 10): Promise<SimpleToolInfo[]> {
  return await serverFetch<SimpleToolInfo[]>(`/tools?offset=${offset}&limit=${limit}`)
}

/**
 * 获取工具详情
 */
export async function getTool(uid: string): Promise<ToolInfo> {
  return await serverFetch<ToolInfo>(`/tools/${uid}`)
}

/**
 * 创建工具
 */
export async function createTool(tool: DockerToolCreate): Promise<ToolInfo> {
  const response = await serverFetch<ToolInfo>('/tools', {
    method: 'POST',
    body: JSON.stringify(tool)
  })
  
  revalidatePath('/tool')
  
  return response
}

/**
 * 删除工具
 */
export async function deleteTool(uid: string): Promise<void> {
  await serverFetch(`/tools/${uid}`, {
    method: 'DELETE'
  })
  
  revalidatePath('/tool')
}

/**
 * 更新工具
 */
export async function updateTool(uid: string, tool: Partial<DockerToolCreate>): Promise<ToolInfo> {
  const response = await serverFetch<ToolInfo>(`/tools/${uid}`, {
    method: 'PUT',
    body: JSON.stringify(tool)
  })
  
  revalidatePath('/tool')
  revalidatePath(`/tool/${uid}`)
  
  return response
}

