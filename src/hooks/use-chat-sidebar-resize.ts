import { useCallback, useRef, useState } from 'react'

export function useChatSidebarResize(initialWidth = 400) {
  const [chatSidebarWidth, setChatSidebarWidth] = useState(initialWidth)
  const isResizingChat = useRef(false)
  const startXChat = useRef(0)
  const startChatWidth = useRef(0)

  const handleChatResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizingChat.current = true
      startXChat.current = e.clientX
      startChatWidth.current = chatSidebarWidth

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizingChat.current) return
        const delta = startXChat.current - ev.clientX
        const newWidth = Math.min(
          700,
          Math.max(280, startChatWidth.current + delta),
        )
        setChatSidebarWidth(newWidth)
      }

      const onMouseUp = () => {
        isResizingChat.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [chatSidebarWidth],
  )

  return { chatSidebarWidth, handleChatResizeStart }
}
