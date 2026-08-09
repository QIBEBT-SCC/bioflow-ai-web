import { HistoryIcon, Loader2Icon, MessageSquareIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { AgentScope } from '@/app/actions/agent'
import { ChatHistoryItem } from '@/components/chat/chat-history-item'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInfiniteAgentSessions } from '@/hooks/use-agent'
import { useInView } from '@/hooks/use-in-view'
import type { AgentSession } from '@/types/agent'

export function SidebarHistoryMenu({
  scope,
  currentSessionId,
  onSelect,
  onDeleteActive,
}: {
  scope: AgentScope
  currentSessionId: string | null
  onSelect: (uid: string) => void
  onDeleteActive: () => void
}) {
  const t = useTranslations('Chat')
  const [open, setOpen] = useState(false)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteAgentSessions(scope)
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage) void fetchNextPage()
  }, [inView, hasNextPage, fetchNextPage])

  const chats = data?.pages.flatMap((page) => page.data) ?? []
  const select = (chat: AgentSession) => {
    setOpen(false)
    onSelect(chat.uid)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='size-7'
          title={t('history')}
        >
          <HistoryIcon className='size-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[22rem] max-w-[calc(100vw-1rem)] overflow-hidden p-0'
        align='end'
        collisionPadding={8}
      >
        <div className='border-b p-3'>
          <h4 className='font-medium text-sm'>{t('history')}</h4>
        </div>
        <ScrollArea className='h-70 w-full min-w-0'>
          <div className='flex w-full min-w-0 flex-col p-2 pr-3'>
            {isLoading && (
              <Loader2Icon className='m-4 size-5 animate-spin self-center' />
            )}
            {!isLoading && chats.length === 0 && (
              <div className='flex flex-col items-center gap-2 py-6 text-muted-foreground'>
                <MessageSquareIcon className='size-7 opacity-50' />
                <p className='text-sm'>{t('no_history')}</p>
              </div>
            )}
            <div className='flex flex-col gap-1'>
              {chats.map((chat) => (
                <ChatHistoryItem
                  key={chat.uid}
                  chat={chat}
                  isActive={currentSessionId === chat.uid}
                  onSelectAction={select}
                  onDeleteAction={onDeleteActive}
                />
              ))}
            </div>
            <div ref={ref} className='mt-2 flex h-4 justify-center'>
              {isFetchingNextPage && (
                <Loader2Icon className='size-4 animate-spin' />
              )}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
