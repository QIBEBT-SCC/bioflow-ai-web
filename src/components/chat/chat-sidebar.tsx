'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  FlaskConicalIcon,
  Loader2Icon,
  PlusIcon,
  TestTubeDiagonalIcon,
  WrenchIcon,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
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
import { SidebarHistoryMenu } from '@/components/chat/chat-history-menu'
import { ChatMessageParts } from '@/components/chat/chat-message-parts'
import {
  type SlashCommand,
  SlashCommandItem,
  SlashCommandItemDescription,
  SlashCommandItemLabel,
  SlashCommandMenu,
  useSlashCommand,
} from '@/components/chat/slash-commannd'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useChatHistory, useCreateChatSession } from '@/hooks/use-chat'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'

const CHAT_COMMANDS: SlashCommand[] = [
  {
    key: 'workflow-builder',
    label: 'Workflow Builder',
    description: 'Create or update a project workflow',
    icon: FlaskConicalIcon,
  },
  {
    key: 'sample-manager',
    label: 'Sample Manager',
    description: 'Organize and inspect project samples',
    icon: TestTubeDiagonalIcon,
  },
  {
    key: 'tool-generator',
    label: 'Tool Generator',
    description: 'Create a reusable bioinformatics tool',
    icon: WrenchIcon,
  },
]

function ChatSidebarInner({
  pageKey,
  projectId,
  width,
  onResizeStart,
}: {
  pageKey: string
  projectId?: string
  width: number
  onResizeStart: (e: React.MouseEvent) => void
}) {
  const { sessions, setSessionId } = useChatSidebarStore()
  const sessionId = sessions[pageKey] ?? null
  const { mutateAsync: createChatSession } = useCreateChatSession()
  const { data: initMessages, isLoading: isHistoryLoading } = useChatHistory(
    sessionId ?? '',
  )
  const [text, setText] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const numericProjectId = projectId ? Number(projectId) : undefined
  const transport = useMemo(
    () =>
      sessionId
        ? new DefaultChatTransport({
            api: `${process.env.NEXT_PUBLIC_API_URL}/chat/${sessionId}/completions`,
            credentials: 'include',
            body:
              numericProjectId !== undefined
                ? { project_id: numericProjectId }
                : undefined,
          })
        : undefined,
    [numericProjectId, sessionId],
  )

  const { messages, sendMessage, status, error, regenerate, stop, clearError } =
    useChat({ transport, messages: initMessages })
  const availableCommands = projectId
    ? CHAT_COMMANDS
    : CHAT_COMMANDS.filter((command) => command.key === 'tool-generator')
  const slashCommand = useSlashCommand({
    commands: availableCommands,
    value: text,
    onValueChange: setText,
  })

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (!message.text?.trim() || !sessionId) return
      clearError()
      await sendMessage({ text: message.text })
      setText('')
    },
    [clearError, sessionId, sendMessage],
  )

  const handleResume = useCallback(
    async (approved: boolean, feedback?: string) => {
      clearError()
      if (feedback) {
        await sendMessage(
          { text: feedback },
          { body: { resume: true, approved: false } },
        )
        return
      }
      await sendMessage(undefined, {
        body: { resume: true, approved },
      })
    },
    [clearError, sendMessage],
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
    (uid: string) => setSessionId(pageKey, uid),
    [pageKey, setSessionId],
  )

  const isBusy = status === 'submitted' || status === 'streaming'
  const newChatDisabled =
    isCreating || (sessionId !== null && messages.length === 0)
  const inputDisabled = sessionId === null || isHistoryLoading

  return (
    <div className='flex h-full shrink-0'>
      <button
        type='button'
        aria-label='Resize chat sidebar'
        onMouseDown={onResizeStart}
        className='w-1 shrink-0 cursor-col-resize border-l bg-background p-0 transition-colors hover:bg-primary/40'
      />
      <div
        className='flex h-full flex-col overflow-hidden bg-background'
        style={{ width }}
      >
        <div className='flex h-12 items-center justify-between border-b px-3'>
          <span className='text-sm font-medium'>AI Chat</span>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={handleNewChat}
              disabled={newChatDisabled || isBusy}
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

        <Conversation className='min-h-0 flex-1'>
          <ConversationContent className='px-3'>
            {isHistoryLoading ? (
              <Loader />
            ) : messages.length === 0 ? (
              <ConversationEmptyState
                title='AI Assistant'
                description='Choose an assistant with /, then describe what you need.'
              />
            ) : (
              messages.map((message, index) => (
                <ChatMessageParts
                  key={message.id}
                  message={message}
                  messages={messages}
                  messageIndex={index}
                  status={status}
                  onRegenerate={(messageId) => void regenerate({ messageId })}
                  onResume={handleResume}
                />
              ))
            )}
            {status === 'submitted' && <Loader />}
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>
                  {error.message ||
                    'The chat request failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className='relative mx-3 mb-3'>
          {slashCommand.open && (
            <SlashCommandMenu
              aria-label='Available assistants'
              className='absolute inset-x-0 bottom-full z-20 mb-2'
            >
              <div className='px-2.5 pt-1.5 pb-1 font-medium text-[11px] text-muted-foreground'>
                Assistants
              </div>
              {slashCommand.suggestions.map((command, index) => {
                const Icon = command.icon
                return (
                  <SlashCommandItem
                    key={command.key}
                    active={index === slashCommand.activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => slashCommand.setActiveIndex(index)}
                    onClick={() => slashCommand.select(command)}
                  >
                    {Icon && (
                      <Icon
                        aria-hidden='true'
                        className='size-4 shrink-0 text-muted-foreground group-aria-selected:text-foreground'
                        strokeWidth={1.75}
                      />
                    )}
                    <SlashCommandItemLabel>
                      {command.label}
                    </SlashCommandItemLabel>
                    <SlashCommandItemDescription>
                      {command.description}
                    </SlashCommandItemDescription>
                  </SlashCommandItem>
                )
              })}
              <div
                className='mt-1 flex items-center gap-3 border-border/60 border-t px-2.5 pt-2 pb-1 text-[10px] text-muted-foreground'
                aria-hidden='true'
              >
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
            </SlashCommandMenu>
          )}
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(event) =>
                  slashCommand.onValueChange(event.target.value)
                }
                onKeyDown={slashCommand.onKeyDown}
                ref={textareaRef}
                value={text}
                placeholder={
                  inputDisabled
                    ? 'Create or load a conversation to start chatting'
                    : 'Type / to choose an assistant…'
                }
                disabled={inputDisabled}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <span className='truncate text-muted-foreground text-xs'>
                {projectId ? 'Project context enabled' : 'Global chat'}
              </span>
              <PromptInputSubmit
                disabled={inputDisabled || (!text.trim() && !isBusy)}
                status={status}
                onClick={
                  isBusy
                    ? (event) => {
                        event.preventDefault()
                        void stop()
                      }
                    : undefined
                }
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}

export function ChatSidebar({
  pageKey,
  projectId,
  width,
  onResizeStartAction,
}: {
  pageKey: string
  projectId?: string
  width: number
  onResizeStartAction: (e: React.MouseEvent) => void
}) {
  const { sessions } = useChatSidebarStore()
  const sessionId = sessions[pageKey] ?? null
  return (
    <ChatSidebarInner
      key={sessionId || 'new'}
      pageKey={pageKey}
      projectId={projectId}
      width={width}
      onResizeStart={onResizeStartAction}
    />
  )
}
