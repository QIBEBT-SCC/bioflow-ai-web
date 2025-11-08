'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/api-server'
import type { ChatSessionCreate, ChatSessionPublic } from '@/types/chat'

/**
 * 获取聊天会话列表
 */
export async function getChatSessions(
  offset: number = 0,
  limit: number = 8,
): Promise<ChatSessionPublic[]> {
  return await serverFetch<ChatSessionPublic[]>('/chat', {
      params: { offset: String(offset), limit: String(limit) },
  })
}

/**
 * 创建新的聊天会话
 */
export async function createChatSession(
  data: ChatSessionCreate = {},
): Promise<ChatSessionPublic> {
  const response = await serverFetch<ChatSessionPublic>('/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  revalidatePath('/chat')

  return response
}

/**
 * 更新聊天会话描述
 */
export async function updateChatSession(
  sessionId: string,
  description: string,
): Promise<ChatSessionPublic> {
  const response = await serverFetch<ChatSessionPublic>(`/chat/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify({ description }),
  })

  revalidatePath('/chat')

  return response
}

/**
 * 删除聊天会话
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await serverFetch(`/chat/${sessionId}`, {
    method: 'DELETE',
  })

  revalidatePath('/chat')
}
