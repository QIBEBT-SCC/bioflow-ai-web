'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { CopyIcon, GlobeIcon, PlusIcon, RefreshCcwIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Fragment, useEffect, useRef, useState } from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import {
  MessageAction,
  MessageActions,
  MessageAttachment,
  MessageAttachments,
  Message as MessageComponent,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { ChatHistoryMenu } from '@/components/chat/chat-history-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import {
  useChatHistory,
  useChatSession,
  useCreateChatSession,
} from '@/hooks/use-chat'
import { getToken } from '@/lib/api-client'
import { useChatStore } from '@/stores/chat-store'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.uid as string

  const [text, setText] = useState<string>('')
  const [useRebuildMode, setUseRebuildMode] = useState<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { setDebugMessages } = useChatStore()

  const { data: chatSession, error: sessionError } = useChatSession(sessionId)
  const { data: initMessages } = useChatHistory(sessionId)
  const { mutateAsync: createChatSession } = useCreateChatSession()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat/${sessionId}/completions`,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      credentials: 'include',
    }),
    messages: initMessages,
  })

  // 当会话不存在时重定向到 /chat
  useEffect(() => {
    if (sessionError) {
      console.warn('Chat session not found, redirecting to /chat')
      router.replace('/chat')
    }
  }, [sessionError, router])

  const handleNewChat = async () => {
    const session = await createChatSession()
    router.push(`/chat/${session.uid}`)
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)
    if (!(hasText || hasAttachments)) {
      return
    }

    await sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files,
      },
      {
        body: {
          rebuild: useRebuildMode,
        },
      },
    )
    setText('')
  }

  // Sync messages for debug store
  useEffect(() => {
    setDebugMessages(messages)
  }, [messages, setDebugMessages])

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>Chat</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {chatSession?.description ?? '新对话'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className='ml-auto flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              title='New Chat'
              onClick={handleNewChat}
              disabled={messages.length === 0}
            >
              <PlusIcon className='size-5' />
            </Button>
            <ChatHistoryMenu />
          </div>
        </div>
      </header>

      <main className='p-0 pb-14 relative size-full'>
        <div className='flex flex-col h-full'>
          <Conversation className='h-full'>
            <ConversationContent className='max-w-5xl mx-auto w-full'>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title='Start a conversation'
                  description='Type a message below to begin'
                />
              ) : (
                messages.map((message, messageIndex) => (
                  <MessageComponent key={message.id} from={message.role}>
                    {/*Attachments*/}
                    {message.parts.filter((part) => part.type === 'file')
                      .length > 0 && (
                      <MessageAttachments className='mb-2'>
                        {message.parts
                          .filter((part) => part.type === 'file')
                          .map((part, i) => (
                            <MessageAttachment data={part} key={part.url} />
                          ))}
                      </MessageAttachments>
                    )}
                    {/*Sources*/}
                    {message.role === 'assistant' &&
                      message.parts.filter((part) => part.type === 'source-url')
                        .length > 0 && (
                        <Sources>
                          <SourcesTrigger
                            count={
                              message.parts.filter(
                                (part) => part.type === 'source-url',
                              ).length
                            }
                          />
                          {message.parts
                            .filter((part) => part.type === 'source-url')
                            .map((part, i) => (
                              <SourcesContent key={`${message.id}-${i}`}>
                                <Source
                                  key={`${message.id}-${i}`}
                                  href={part.url}
                                  title={part.url}
                                />
                              </SourcesContent>
                            ))}
                        </Sources>
                      )}
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text': {
                            const isLastMessage =
                              messageIndex === messages.length - 1
                            return (
                              <Fragment key={`${message.id}-${i}`}>
                                <MessageResponse>{part.text}</MessageResponse>
                                {message.role === 'assistant' &&
                                  isLastMessage && (
                                    <MessageActions>
                                      <MessageAction
                                        onClick={() => {}}
                                        label='Retry'
                                      >
                                        <RefreshCcwIcon className='size-3' />
                                      </MessageAction>
                                      <MessageAction
                                        onClick={() =>
                                          navigator.clipboard.writeText(
                                            part.text,
                                          )
                                        }
                                        label='Copy'
                                      >
                                        <CopyIcon className='size-3' />
                                      </MessageAction>
                                    </MessageActions>
                                  )}
                              </Fragment>
                            )
                          }
                          case 'reasoning':
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className='w-full'
                                isStreaming={
                                  status === 'streaming' &&
                                  i === message.parts.length - 1 &&
                                  message.id === messages.at(-1)?.id
                                }
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            )
                          case 'tool-getWeather':
                            return (
                              <Tool
                                key={part.toolCallId || `${message.id}-${i}`}
                              >
                                <ToolHeader
                                  type={part.type}
                                  state={part.state}
                                />
                                <ToolContent>
                                  <ToolInput input={part.input} />
                                  <ToolOutput
                                    output={JSON.stringify(
                                      part.output,
                                      null,
                                      2,
                                    )}
                                    errorText={part.errorText}
                                  />
                                </ToolContent>
                              </Tool>
                            )
                          default:
                            return null
                        }
                      })}
                    </MessageContent>
                  </MessageComponent>
                ))
              )}
              {status === 'submitted' && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={handleSubmit}
            className='mt-4 max-w-5xl mx-auto w-full px-4'
            globalDrop
            multiple
          >
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(e) => setText(e.target.value)}
                ref={textareaRef}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputSpeechButton
                  onTranscriptionChange={setText}
                  textareaRef={textareaRef}
                />
                <PromptInputButton
                  onClick={() => setUseRebuildMode(!useRebuildMode)}
                  variant={useRebuildMode ? 'default' : 'ghost'}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit disabled={!text && !status} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </main>
    </SidebarInset>
  )
}
