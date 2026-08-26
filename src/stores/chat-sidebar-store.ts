'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface ChatSidebarState {
  isOpen: boolean
  sessions: Record<string, string | null>
  toggle: () => void
  open: () => void
  close: () => void
  setSessionId: (scopeKey: string, id: string) => void
  clearSession: (scopeKey: string) => void
}

export const useChatSidebarStore = create<ChatSidebarState>()(
  devtools(
    persist(
      (set) => ({
        isOpen: false,
        sessions: {},
        toggle: () => set((state) => ({ isOpen: !state.isOpen })),
        open: () => set({ isOpen: true }),
        close: () => set({ isOpen: false }),
        setSessionId: (scopeKey, id) =>
          set((state) => ({
            sessions: { ...state.sessions, [scopeKey]: id },
          })),
        clearSession: (scopeKey) =>
          set((state) => ({
            sessions: { ...state.sessions, [scopeKey]: null },
          })),
      }),
      {
        name: 'chat-sidebar',
        partialize: (state) => ({
          isOpen: state.isOpen,
          sessions: state.sessions,
        }),
      },
    ),
    { name: 'chat-sidebar-store' },
  ),
)
