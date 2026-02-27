import { clientFetch } from '@/lib/api-client'
import type { ToolArgPublic } from '@/types/node'
import type {
  DockerToolCreate,
  DockerToolUpdate,
  SimpleToolInfo,
  ToolGroup,
  ToolInfo,
  ToolTag,
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
): Promise<SimpleToolInfo[]> {
  return await clientFetch<SimpleToolInfo[]>('/tools/search', {
    params: {
      name: name,
      offset: String(offset),
      limit: '12',
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
 * 获取工具总数
 */
export async function getToolCount(): Promise<number> {
  return await clientFetch<number>('/tools/count')
}

/**
 * 获取工具列表
 */
export async function getToolList(
  offset: number = 0,
  limit: number = 10,
): Promise<SimpleToolInfo[]> {
  return await clientFetch<SimpleToolInfo[]>('/tools', {
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
