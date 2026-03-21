'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface ChatSidebarState {
  isOpen: boolean
  sessionId: string | null
  toggle: () => void
  open: () => void
  close: () => void
  setSessionId: (id: string) => void
  clearSession: () => void
}

export const useChatSidebarStore = create<ChatSidebarState>()(
  devtools(
    persist(
      (set) => ({
        isOpen: false,
        sessionId: null,
        toggle: () => set((state) => ({ isOpen: !state.isOpen })),
        open: () => set({ isOpen: true }),
        close: () => set({ isOpen: false }),
        setSessionId: (id) => set({ sessionId: id }),
        clearSession: () => set({ sessionId: null }),
      }),
      {
        name: 'chat-sidebar',
        partialize: (state) => ({ isOpen: state.isOpen }),
      },
    ),
    { name: 'chat-sidebar-store' },
  ),
)
