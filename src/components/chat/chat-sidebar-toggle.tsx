'use client'

import { MessageSquareIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'

type ChatSidebarToggleButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'size' | 'variant'
>

export function ChatSidebarToggleButton(props: ChatSidebarToggleButtonProps) {
  return (
    <Button variant='ghost' size='icon' {...props}>
      <MessageSquareIcon className='size-5' />
    </Button>
  )
}

export function ChatSidebarToggle() {
  const toggle = useChatSidebarStore((s) => s.toggle)

  return <ChatSidebarToggleButton onClick={toggle} title='AI Chat' />
}
