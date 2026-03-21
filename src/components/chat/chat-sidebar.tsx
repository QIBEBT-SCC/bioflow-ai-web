'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { PlusIcon, XIcon } from 'lucide-react'
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
import { ChatMessageParts } from '@/components/chat/chat-message-parts'
import { Button } from '@/components/ui/button'
import { useCreateChatSession } from '@/hooks/use-chat'
import { getToken } from '@/lib/api-client'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'

export function ChatSidebar() {
  const { sessionId, setSessionId, clearSession, close } = useChatSidebarStore()
  const { mutateAsync: createChatSession } = useCreateChatSession()

  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingMessageRef = useRef<PromptInputMessage | null>(null)

  const transport = sessionId
    ? new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_API_URL}/chat/${sessionId}/completions`,
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      })
    : undefined

  const { messages, sendMessage, status } = useChat({
    transport,
  })

  // When session is created and there's a pending message, send it
  useEffect(() => {
    if (sessionId && pendingMessageRef.current) {
      const msg = pendingMessageRef.current
      pendingMessageRef.current = null
      sendMessage({ text: msg.text || '' })
    }
  }, [sessionId, sendMessage])

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim()) return

      if (!sessionId) {
        // Lazy create session, store pending message
        pendingMessageRef.current = message
        const session = await createChatSession()
        setSessionId(session.uid)
      } else {
        await sendMessage({ text: message.text })
      }
      setText('')
    },
    [sessionId, createChatSession, setSessionId, sendMessage],
  )

  const handleNewChat = useCallback(() => {
    clearSession()
  }, [clearSession])

  return (
    <div className='w-[400px] shrink-0 border-l flex flex-col h-full bg-background'>
      {/* Header */}
      <div className='flex items-center justify-between h-12 px-3 border-b'>
        <span className='text-sm font-medium'>AI Chat</span>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='size-7'
            onClick={handleNewChat}
            disabled={messages.length === 0}
            title='New Chat'
          >
            <PlusIcon className='size-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-7'
            onClick={close}
            title='Close'
          >
            <XIcon className='size-4' />
          </Button>
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
            placeholder='Ask a question...'
          />
        </PromptInputBody>
        <PromptInputFooter>
          <div />
          <PromptInputSubmit disabled={!text && !status} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
