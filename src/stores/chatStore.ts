'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ChatSessionPublic, Message } from '@/types/chat'

interface ChatStore {
  // State
  currentSession: ChatSessionPublic | null
  messages: Message[]
  isGenerating: boolean
  loadingMessage: string | null

  // Actions
  setCurrentSession: (session: ChatSessionPublic | null) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  setIsGenerating: (isGenerating: boolean) => void
  setLoadingMessage: (message: string | null) => void
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      // Initial state
      currentSession: null,
      messages: [],
      isGenerating: false,
      loadingMessage: null,

      // Actions
      setCurrentSession: (session) => {
        set({ currentSession: session })
      },

      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }))
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      setIsGenerating: (isGenerating) => {
        set({ isGenerating })
      },

      setLoadingMessage: (message) => {
        set({ loadingMessage: message })
      },
    }),
    { name: 'chat-store' },
  ),
)

