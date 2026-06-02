import type { UIMessage } from 'ai'
import { clientFetch } from '@/lib/api-client'
import type { ChatSessionPage, ChatSessionPublic } from '@/types/chat'

/**
 * 获取聊天会话列表
 */
export async function getChatSessions(
  cursor: string | null = null,
  limit: number = 8,
): Promise<ChatSessionPage> {
  const params: Record<string, string> = {
    limit: String(limit),
  }

  if (cursor) {
    params.cursor = cursor
  }

  return await clientFetch<ChatSessionPage>('/chat', {
    params,
  })
}

/**
 * 获取聊天会话信息
 */
export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionPublic> {
  return await clientFetch<ChatSessionPublic>(`/chat/${sessionId}`)
}

/**
 * 新建会话
 */
export async function createChatSession(): Promise<ChatSessionPublic> {
  return await clientFetch<ChatSessionPublic>('/chat', {
    method: 'POST',
  })
}

/**
 * 删除会话
 */
export async function deleteChatSession(
  sessionId: string,
): Promise<{ message: string }> {
  return await clientFetch<{ message: string }>(`/chat/${sessionId}`, {
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
  return await clientFetch<ChatSessionPublic>(`/chat/${sessionId}`, {
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
  return await clientFetch<UIMessage[]>(`/chat/${sessionId}/history`)
}
