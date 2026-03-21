'use client'

import { MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'

export function ChatSidebarToggle() {
  const toggle = useChatSidebarStore((s) => s.toggle)

  return (
    <Button variant='ghost' size='icon' onClick={toggle} title='AI Chat'>
      <MessageSquareIcon className='size-5' />
    </Button>
  )
}
