'use server'

import type { UIMessage } from 'ai'
import { serverFetch } from '@/lib/api-server'
import type { ChatSessionPublic, PaginatedChatResponse } from '@/types/chat'

/**
 * 获取聊天会话列表
 */
export async function getChatSessions(
  offset: number = 0,
  limit: number = 12,
): Promise<PaginatedChatResponse> {
  return await serverFetch<PaginatedChatResponse>('/chat', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取聊天会话信息
 */
export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionPublic> {
  return await serverFetch<ChatSessionPublic>(`/chat/${sessionId}`)
}

/**
 * 新建会话
 */
export async function createChatSession(): Promise<ChatSessionPublic> {
  return await serverFetch<ChatSessionPublic>('/chat', {
    method: 'POST',
  })
}

/**
 * 删除会话
 */
export async function deleteChatSession(
  sessionId: string,
): Promise<{ message: string }> {
  return await serverFetch<{ message: string }>(`/chat/${sessionId}`, {
    method: 'DELETE',
  })
}

/**
 * 更新会话信息
 */
export async function updateChatSession(
  sessionId: string,
  description: string,
): Promise<ChatSessionPublic> {
  return await serverFetch<ChatSessionPublic>(`/chat/${sessionId}`, {
    method: 'PUT',
    params: {
      description,
    },
  })
}

/**
 * 获取聊天会话对话历史
 */
export async function getChatSessionHistory(
  sessionId: string,
): Promise<UIMessage[]> {
  return await serverFetch<UIMessage[]>(`/chat/${sessionId}/history`)
}
