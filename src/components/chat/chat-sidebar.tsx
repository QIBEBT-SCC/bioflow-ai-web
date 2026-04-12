'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  HistoryIcon,
  Loader2Icon,
  MessageSquareIcon,
  PlusIcon,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { ChatHistoryItem } from '@/components/chat/chat-history-item'
import { ChatMessageParts } from '@/components/chat/chat-message-parts'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useChatHistory,
  useCreateChatSession,
  useInfiniteChats,
} from '@/hooks/use-chat'
import { useInView } from '@/hooks/use-in-view'
import { getToken } from '@/lib/api-client'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import type { ChatSessionPublic } from '@/types/chat'

function SidebarHistoryMenu({
  currentSessionId,
  onSelect,
}: {
  currentSessionId: string | null
  onSelect: (uid: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteChats()
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const flatData = data?.pages.flatMap((page) => page.data) ?? []

  const handleSelectChat = (chat: ChatSessionPublic) => {
    setOpen(false)
    onSelect(chat.uid)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='size-7' title='History'>
          <HistoryIcon className='size-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-72 p-0' align='end'>
        <div className='p-3 border-b'>
          <h4 className='font-medium leading-none text-sm'>Chat History</h4>
        </div>
        <ScrollArea className='h-[280px]'>
          <div className='flex flex-col p-2'>
            {isLoading && (
              <div className='flex justify-center p-4'>
                <Loader2Icon className='animate-spin size-5 text-muted-foreground' />
              </div>
            )}

            {flatData.length === 0 && !isLoading && (
              <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground py-6'>
                <MessageSquareIcon className='size-7 opacity-50' />
                <p className='text-sm'>No chat history yet</p>
              </div>
            )}

            <div className='flex flex-col gap-1'>
              {flatData.map((chat) => (
                <ChatHistoryItem
                  key={chat.uid}
                  chat={chat}
                  isActive={currentSessionId === chat.uid}
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

function ChatSidebarInner({
  pageKey,
  width,
  onResizeStart,
}: {
  pageKey: string
  width: number
  onResizeStart: (e: React.MouseEvent) => void
}) {
  const { sessions, setSessionId } = useChatSidebarStore()
  const sessionId = sessions[pageKey] ?? null

  const { mutateAsync: createChatSession } = useCreateChatSession()
  const { data: initMessages } = useChatHistory(sessionId ?? '')

  const [text, setText] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const transport = sessionId
    ? new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_API_URL}/chat/${sessionId}/completions`,
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      })
    : undefined

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initMessages,
  })

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || !sessionId) return
      await sendMessage({ text: message.text })
      setText('')
    },
    [sessionId, sendMessage],
  )

  const handleNewChat = useCallback(async () => {
    setIsCreating(true)
    try {
      const session = await createChatSession()
      setSessionId(pageKey, session.uid)
    } finally {
      setIsCreating(false)
    }
  }, [pageKey, createChatSession, setSessionId])

  const handleSelectHistory = useCallback(
    (uid: string) => {
      setSessionId(pageKey, uid)
    },
    [pageKey, setSessionId],
  )

  // New Chat is disabled when already on an empty session (no messages yet)
  const newChatDisabled =
    isCreating || (sessionId !== null && messages.length === 0)
  const inputDisabled = sessionId === null

  return (
    <div className='shrink-0 flex h-full'>
      {/* 左侧拖拽把手 */}
      <button
        type='button'
        aria-label='拖拽调整宽度'
        onMouseDown={onResizeStart}
        className='w-1 shrink-0 border-l hover:bg-primary/40 transition-colors cursor-col-resize bg-background p-0'
      />

      <div
        className='flex flex-col h-full bg-background overflow-hidden'
        style={{ width }}
      >
        {/* Header */}
        <div className='flex items-center justify-between h-12 px-3 border-b'>
          <span className='text-sm font-medium'>AI Chat</span>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={handleNewChat}
              disabled={newChatDisabled}
              title='New Chat'
            >
              {isCreating ? (
                <Loader2Icon className='size-4 animate-spin' />
              ) : (
                <PlusIcon className='size-4' />
              )}
            </Button>
            <SidebarHistoryMenu
              currentSessionId={sessionId}
              onSelect={handleSelectHistory}
            />
          </div>
        </div>

        {/* Conversation */}
        <Conversation className='flex-1 min-h-0'>
          <ConversationContent className='px-3'>
            {messages.length === 0 ? (
              <ConversationEmptyState
                title='AI Assistant'
                description='Ask anything about your project'
              />
            ) : (
              messages.map((message, idx) => (
                <ChatMessageParts
                  key={message.id}
                  message={message}
                  messages={messages}
                  messageIndex={idx}
                  status={status}
                />
              ))
            )}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input */}
        <PromptInput onSubmit={handleSubmit} className='px-3 pb-3'>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              ref={textareaRef}
              value={text}
              placeholder={
                inputDisabled
                  ? 'Create or load a conversation to start chatting'
                  : 'Ask a question...'
              }
              disabled={inputDisabled}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <div />
            <PromptInputSubmit
              disabled={inputDisabled || (!text && !status)}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}

export function ChatSidebar({
  pageKey,
  width,
  onResizeStart,
}: {
  pageKey: string
  width: number
  onResizeStart: (e: React.MouseEvent) => void
}) {
  const { sessions } = useChatSidebarStore()
  const sessionId = sessions[pageKey] ?? null
  return (
    <ChatSidebarInner
      key={sessionId || 'new'}
      pageKey={pageKey}
      width={width}
      onResizeStart={onResizeStart}
    />
  )
}
