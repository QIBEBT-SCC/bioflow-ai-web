import type { UIMessage } from 'ai'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ChatState {
  currentSessionId: string | null
  currentSessionTitle: string | null
  debugMessages: UIMessage[]
  setCurrentSessionId: (id: string | null) => void
  setCurrentSessionTitle: (title: string) => void
  setDebugMessages: (messages: UIMessage[]) => void
  clearSession: () => void
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      currentSessionId: null,
      currentSessionTitle: null,
      debugMessages: [],
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      setCurrentSessionTitle: (title) => set({ currentSessionTitle: title }),
      setDebugMessages: (messages) => set({ debugMessages: messages }),
      clearSession: () => set({ currentSessionId: null }),
    }),
    { name: 'chat-store' },
  ),
)
