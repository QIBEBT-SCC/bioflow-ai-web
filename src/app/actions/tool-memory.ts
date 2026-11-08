import { clientFetch } from '@/lib/api-client'
import type {
  PaginatedToolMemories,
  ToolMemory,
  ToolMemoryCreate,
  ToolMemorySummary,
  ToolMemoryUpdate,
} from '@/types/tool-memory'

export async function getToolMemories(
  toolUid: string | undefined,
  offset: number,
  limit: number,
): Promise<PaginatedToolMemories> {
  return await clientFetch<PaginatedToolMemories>('/tool-memories', {
    params: {
      ...(toolUid ? { tool_uid: toolUid } : {}),
      offset: String(offset),
      limit: String(limit),
    },
  })
}

export async function getToolMemorySummaries(
  toolUid: string,
): Promise<ToolMemorySummary[]> {
  return await clientFetch<ToolMemorySummary[]>(
    `/tools/${encodeURIComponent(toolUid)}/memories`,
  )
}

export async function getToolMemory(uid: string): Promise<ToolMemory> {
  return await clientFetch<ToolMemory>(
    `/tool-memories/${encodeURIComponent(uid)}`,
  )
}

export async function createToolMemory(
  data: ToolMemoryCreate,
): Promise<ToolMemory> {
  return await clientFetch<ToolMemory>('/tool-memories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateToolMemory(
  uid: string,
  data: ToolMemoryUpdate,
): Promise<ToolMemory> {
  return await clientFetch<ToolMemory>(
    `/tool-memories/${encodeURIComponent(uid)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}

export async function deleteToolMemory(uid: string): Promise<void> {
  await clientFetch<void>(`/tool-memories/${encodeURIComponent(uid)}`, {
    method: 'DELETE',
  })
}
