'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type FileUIPart } from 'ai'
import { CopyIcon, GlobeIcon, PlusIcon, RefreshCcwIcon } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Attachment,
  AttachmentHoverCard,
  AttachmentHoverCardContent,
  AttachmentHoverCardTrigger,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  getAttachmentLabel,
  getMediaCategory,
} from '@/components/ai-elements/attachments'
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
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
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

const AttachmentItem = memo(
  ({
    attachment,
    onRemove,
  }: {
    attachment: FileUIPart & { id: string }
    onRemove: (id: string) => void
  }) => {
    const handleRemove = useCallback(
      () => onRemove(attachment.id),
      [onRemove, attachment.id],
    )
    const mediaCategory = getMediaCategory(attachment)
    const label = getAttachmentLabel(attachment)

    return (
      <AttachmentHoverCard key={attachment.id}>
        <AttachmentHoverCardTrigger asChild>
          <Attachment data={attachment} onRemove={handleRemove}>
            <div className='relative size-5 shrink-0'>
              <div className='absolute inset-0 transition-opacity group-hover:opacity-0'>
                <AttachmentPreview />
              </div>
              <AttachmentRemove className='absolute inset-0' />
            </div>
            <AttachmentInfo />
          </Attachment>
        </AttachmentHoverCardTrigger>
        <AttachmentHoverCardContent>
          <div className='space-y-3'>
            {mediaCategory === 'image' &&
              attachment.type === 'file' &&
              attachment.url && (
                <div className='flex max-h-96 w-80 items-center justify-center overflow-hidden rounded-md border'>
                  <Image
                    alt={label}
                    className='max-h-full max-w-full object-contain'
                    height={384}
                    src={attachment.url}
                    width={320}
                  />
                </div>
              )}
            <div className='space-y-1 px-0.5'>
              <h4 className='font-semibold text-sm leading-none'>{label}</h4>
              {attachment.mediaType && (
                <p className='font-mono text-muted-foreground text-xs'>
                  {attachment.mediaType}
                </p>
              )}
            </div>
          </div>
        </AttachmentHoverCardContent>
      </AttachmentHoverCard>
    )
  },
)

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()

  const handleRemove = useCallback(
    (id: string) => {
      attachments.remove(id)
    },
    [attachments],
  )

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <Attachments variant='inline'>
      {attachments.files.map((attachment) => (
        <AttachmentItem
          attachment={attachment}
          key={attachment.id}
          onRemove={handleRemove}
        />
      ))}
    </Attachments>
  )
}

export default function ChatPage() {
  const params = useParams()
  const { push, replace } = useRouter()
  const sessionId = params.uid as string

  const [text, setText] = useState<string>('')
  const [useRebuildMode, setUseRebuildMode] = useState<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: chatSession, error: sessionError } = useChatSession(sessionId)
  const { data: initMessages } = useChatHistory(sessionId)
  const { mutateAsync: createChatSession } = useCreateChatSession()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_URL}/chat/${sessionId}/completions`,
      credentials: 'include',
    }),
    messages: initMessages,
  })

  // 当会话不存在时重定向到 /chat
  useEffect(() => {
    if (sessionError) {
      console.warn('Chat session not found, redirecting to /chat')
      replace('/chat')
    }
  }, [sessionError, router])

  const handleNewChat = async () => {
    const session = await createChatSession()
    push(`/chat/${session.uid}`)
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
                messages.map((message, messageIndex) => {
                  const fileParts = message.parts.filter(
                    (part) => part.type === 'file',
                  )
                  const sourceParts = message.parts.filter(
                    (part) => part.type === 'source-url',
                  )
                  return (
                  <MessageComponent key={message.id} from={message.role}>
                    {/*Attachments*/}
                    {fileParts.length > 0 && (
                      <Attachments className='mb-2' variant='grid'>
                        {fileParts.map((attachment) => (
                          // @ts-expect-error
                          <Attachment data={attachment} key={attachment.url}>
                            <AttachmentPreview />
                          </Attachment>
                        ))}
                      </Attachments>
                    )}
                    {/*Sources*/}
                    {message.role === 'assistant' && sourceParts.length > 0 && (
                      <Sources>
                        <SourcesTrigger count={sourceParts.length} />
                        {sourceParts.map((part) => (
                          <SourcesContent key={part.url}>
                            <Source href={part.url} title={part.url} />
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
                              // biome-ignore lint/suspicious/noArrayIndexKey: message parts have no unique ID
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
                              // biome-ignore lint/suspicious/noArrayIndexKey: message parts have no unique ID
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
                )})
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
              <PromptInputAttachmentsDisplay />
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
