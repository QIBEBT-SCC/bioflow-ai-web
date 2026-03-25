import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { UIMessage } from 'ai'
import {
  createChatSession,
  deleteChatSession,
  getChatSession,
  getChatSessionHistory,
  getChatSessions,
  updateChatSession,
} from '@/app/actions/chat'
import type { ChatSessionPublic, PaginatedChatResponse } from '@/types/chat'

// ============================================
// Query Hooks (数据查询)
// ============================================
/**
 * 获取会话列表
 */
export function useChatSessions(page: number = 1, limit: number = 8) {
  return useQuery<PaginatedChatResponse>({
    queryKey: ['chat', page, limit],
    queryFn: () => getChatSessions(page, limit),
    staleTime: 30 * 1000,
  })
}

/**
 * 获取无限滚动会话列表
 */
export function useInfiniteChats(limit: number = 12) {
  return useInfiniteQuery<PaginatedChatResponse>({
    queryKey: ['chat', 'infinite'],
    queryFn: ({ pageParam }: { pageParam: unknown }) =>
      getChatSessions(pageParam as number, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedChatResponse) => {
      if (lastPage.has_more) {
        return lastPage.offset + lastPage.limit
      }
      return undefined
    },
    staleTime: 30 * 1000,
  })
}

export function useChatSession(sessionId: string) {
  return useQuery<ChatSessionPublic>({
    queryKey: ['chat', sessionId],
    queryFn: () => getChatSession(sessionId),
    staleTime: 30 * 1000,
    enabled: !!sessionId,
  })
}

/**
 * 获取指定会话的对话历史
 */
export function useChatHistory(sessionId: string) {
  return useQuery<UIMessage[]>({
    queryKey: ['chatHistory', sessionId],
    queryFn: () => getChatSessionHistory(sessionId),
    staleTime: 30 * 1000,
    enabled: !!sessionId,
  })
}

// ============================================
// Mutation Hooks (数据变更)
// ============================================
/**
 * 新建会话
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createChatSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] })
    },
  })
}

/**
 * 删除对话
 */
export function useDeleteChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteChatSession,
    onSuccess: () => {
      // 刷新会话列表
      queryClient.invalidateQueries({ queryKey: ['chat'] })
    },
  })
}

/**
 * 更新对话信息
 */
export function useUpdateChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      description,
    }: {
      sessionId: string
      description: string
    }) => updateChatSession(sessionId, description),
    // biome-ignore lint/correctness/noUnusedFunctionParameters: no need
    onSuccess: (data) => {
      // 刷新会话列表
      queryClient.invalidateQueries({ queryKey: ['chat'] })
      // 如果有单条会话的查询，也可以通过 `queryClient.setQueryData` 更新缓存
    },
  })
}
