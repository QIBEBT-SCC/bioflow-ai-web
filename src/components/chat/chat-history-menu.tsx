'use client'

import { HistoryIcon, Loader2Icon, MessageSquareIcon } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChatHistoryItem } from '@/components/chat/chat-history-item'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInfiniteChats } from '@/hooks/use-chat'
import { useInView } from '@/hooks/use-in-view'
import type { ChatSessionPublic } from '@/types/chat'

export function ChatHistoryMenu() {
  const params = useParams()
  const router = useRouter()
  const currentSessionId = params.uid as string

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteChats()

  const { ref, inView } = useInView()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const flatData = data?.pages.flatMap((page) => page.data) ?? []

  const handleSelectChat = async (chat: ChatSessionPublic) => {
    setOpen(false)
    router.push(`/chat/${chat.uid}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' title='History'>
          <HistoryIcon className='size-5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='end'>
        <div className='p-4 border-b'>
          <h4 className='font-medium leading-none'>Chat History</h4>
        </div>
        <ScrollArea className='h-[300px]'>
          <div className='flex flex-col p-2'>
            {isLoading && (
              <div className='flex justify-center p-4'>
                <Loader2Icon className='animate-spin size-6 text-muted-foreground' />
              </div>
            )}

            {flatData.length === 0 && !isLoading && (
              <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground py-8'>
                <MessageSquareIcon className='size-8 opacity-50' />
                <p className='text-sm'>No chat history yet</p>
              </div>
            )}

            <div className='flex flex-col gap-1'>
              {flatData.map((chat) => (
                <ChatHistoryItem
                  key={chat.uid}
                  chat={chat}
                  isActive={
                    pathname === `/chat/${chat.uid}` ||
                    currentSessionId === chat.uid
                  }
                  onSelect={handleSelectChat}
                />
              ))}
            </div>

            <div
              ref={ref}
              className='h-4 w-full flex justify-center mt-2 shrink-0'
            >
              {isFetchingNextPage && (
                <Loader2Icon className='animate-spin size-4 text-muted-foreground' />
              )}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
