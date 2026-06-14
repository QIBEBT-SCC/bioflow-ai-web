'use client'

import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport} from 'ai'
import {Loader2Icon, PlusIcon,} from 'lucide-react'
import type React from 'react'
import {useCallback, useRef, useState} from 'react'
import {Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton,} from '@/components/ai-elements/conversation'
import {Loader} from '@/components/ai-elements/loader'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import {ChatMessageParts} from '@/components/chat/chat-message-parts'
import {Button} from '@/components/ui/button'
import {useChatHistory, useCreateChatSession,} from '@/hooks/use-chat'
import {useChatSidebarStore} from '@/stores/chat-sidebar-store'
import {SidebarHistoryMenu} from "@/components/chat/chat-history-menu";

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
  onResizeStartAction,
}: {
  pageKey: string
  width: number
  onResizeStartAction: (e: React.MouseEvent) => void
}) {
  const { sessions } = useChatSidebarStore()
  const sessionId = sessions[pageKey] ?? null
  return (
    <ChatSidebarInner
      key={sessionId || 'new'}
      pageKey={pageKey}
      width={width}
      onResizeStart={onResizeStartAction}
    />
  )
}
