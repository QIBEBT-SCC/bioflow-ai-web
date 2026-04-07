'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface ChatSidebarState {
  isOpen: boolean
  sessions: Record<string, string | null>
  toggle: () => void
  open: () => void
  close: () => void
  setSessionId: (pageKey: string, id: string) => void
  clearSession: (pageKey: string) => void
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
        setSessionId: (pageKey, id) =>
          set((state) => ({
            sessions: { ...state.sessions, [pageKey]: id },
          })),
        clearSession: (pageKey) =>
          set((state) => ({
            sessions: { ...state.sessions, [pageKey]: null },
          })),
      }),
      {
        name: 'chat-sidebar',
        partialize: (state) => ({ isOpen: state.isOpen }),
      },
    ),
    { name: 'chat-sidebar-store' },
  ),
)
