import { clientFetch } from '@/lib/api-client'
import type { ToolArgPublic } from '@/types/node'
import type {
  DockerToolCreate,
  DockerToolUpdate,
  PaginatedTools,
  SimpleToolInfo,
  ToolGroup,
  ToolInfo,
  ToolTag,
  ToolUsage,
} from '@/types/tool'

/**
 * 获取tool的参数信息（用于节点编辑器）
 */
export async function getToolArg(uid: string): Promise<ToolArgPublic> {
  return await clientFetch<ToolArgPublic>(`/tools/${uid}/args`)
}

/**
 * 获取工具分组列表
 */
export async function getToolGroupList(): Promise<ToolGroup[]> {
  return await clientFetch<ToolGroup[]>('/tool-groups')
}

/**
 * 获取分组下的工具列表
 */
export async function getGroupTools(
  parent_id?: number,
): Promise<SimpleToolInfo[]> {
  const endpoint =
    parent_id !== undefined
      ? `/tool-groups/tools?parent_id=${parent_id}`
      : '/tool-groups/tools'
  return await clientFetch<SimpleToolInfo[]>(endpoint)
}

/**
 * 搜索工具
 */
export async function searchTools(
  name: string,
  offset: number = 0,
  limit: number = 12,
): Promise<PaginatedTools> {
  return await clientFetch<PaginatedTools>('/tools/search', {
    params: {
      name: name,
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取工具标签列表
 */
export async function getToolTagList(): Promise<ToolTag[]> {
  return await clientFetch<ToolTag[]>('/tool-tags')
}

/**
 * 获取工具列表
 */
export async function getToolList(
  offset: number = 0,
  limit: number = 10,
): Promise<PaginatedTools> {
  return await clientFetch<PaginatedTools>('/tools', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取工具详情
 */
export async function getTool(uid: string): Promise<ToolInfo> {
  return await clientFetch<ToolInfo>(`/tools/${uid}`)
}

export async function getToolUsage(
  uid: string,
  workflowOffset: number = 0,
  runOffset: number = 0,
  limit: number = 10,
): Promise<ToolUsage> {
  return await clientFetch<ToolUsage>(`/tools/${uid}/usage`, {
    params: {
      workflow_offset: String(workflowOffset),
      run_offset: String(runOffset),
      limit: String(limit),
    },
  })
}

/**
 * 创建工具
 */
export async function createTool(tool: DockerToolCreate): Promise<ToolInfo> {
  console.log('createTool - JSON.stringify 后:', JSON.stringify(tool))

  return await clientFetch<ToolInfo>('/tools', {
    method: 'POST',
    body: JSON.stringify(tool),
  })
}

/**
 * 删除工具
 */
export async function deleteTool(uid: string): Promise<void> {
  await clientFetch(`/tools/${uid}`, {
    method: 'DELETE',
  })
}

/**
 * 更新工具
 */
export async function updateTool(
  uid: string,
  tool: Partial<DockerToolUpdate>,
): Promise<ToolInfo> {
  return await clientFetch<ToolInfo>(`/tools/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(tool),
  })
}

/**
 * 将工具标记为 AI Checked，同时保留其他标签
 */
export async function markToolAIChecked(uid: string): Promise<SimpleToolInfo> {
  return await clientFetch<SimpleToolInfo>(`/tools/${uid}/ai-checked`, {
    method: 'PATCH',
  })
}
