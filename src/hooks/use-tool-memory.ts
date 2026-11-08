'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createToolMemory,
  deleteToolMemory,
  getToolMemories,
  getToolMemory,
  getToolMemorySummaries,
  updateToolMemory,
} from '@/app/actions/tool-memory'
import type { ToolMemoryCreate, ToolMemoryUpdate } from '@/types/tool-memory'

const TOOL_MEMORIES_KEY = 'tool-memories'

export function useToolMemories(
  toolUid: string | undefined,
  offset: number,
  limit: number,
) {
  return useQuery({
    queryKey: [TOOL_MEMORIES_KEY, 'list', toolUid, offset, limit],
    queryFn: () => getToolMemories(toolUid, offset, limit),
    placeholderData: keepPreviousData,
  })
}

export function useToolMemorySummaries(toolUid: string) {
  return useQuery({
    queryKey: [TOOL_MEMORIES_KEY, 'tool', toolUid],
    queryFn: () => getToolMemorySummaries(toolUid),
    enabled: !!toolUid,
  })
}

export function useToolMemory(uid: string | null) {
  return useQuery({
    queryKey: [TOOL_MEMORIES_KEY, 'detail', uid],
    queryFn: () => getToolMemory(uid as string),
    enabled: !!uid,
  })
}

export function useCreateToolMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ToolMemoryCreate) => createToolMemory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TOOL_MEMORIES_KEY] })
    },
  })
}

export function useUpdateToolMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: ToolMemoryUpdate }) =>
      updateToolMemory(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TOOL_MEMORIES_KEY] })
    },
  })
}

export function useDeleteToolMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uid: string) => deleteToolMemory(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TOOL_MEMORIES_KEY] })
    },
  })
}
