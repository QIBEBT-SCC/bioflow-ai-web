'use client'

import type { ChatStatus, UIMessage } from 'ai'
import { isToolUIPart } from 'ai'
import {
  AlertTriangleIcon,
  CheckIcon,
  CircleIcon,
  CopyIcon,
  Loader2Icon,
  MessageCircleQuestionIcon,
  RefreshCcwIcon,
  XIcon,
} from 'lucide-react'
import { Fragment, useState } from 'react'
import {
  Attachment,
  AttachmentPreview,
  Attachments,
} from '@/components/ai-elements/attachments'
import {
  MessageAction,
  MessageActions,
  Message as MessageComponent,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
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
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from '@/components/ai-elements/task'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type DataPart = {
  type: `data-${string}`
  data: Record<string, unknown>
}

type InterruptValue = {
  max_token?: number
  question?: string
}

interface ChatMessagePartsProps {
  message: UIMessage
  messages: UIMessage[]
  messageIndex: number
  status: ChatStatus
  onRegenerate: (messageId: string) => void
  onResume: (approved: boolean, feedback?: string) => Promise<void>
}

function isDataPart(part: UIMessage['parts'][number]): part is DataPart {
  return part.type.startsWith('data-') && 'data' in part
}

function getProgressLabel(data: Record<string, unknown>) {
  const value = data.info ?? data.message
  return typeof value === 'string' ? value : JSON.stringify(data)
}

function getInterrupt(data: Record<string, unknown>): InterruptValue | null {
  const value = data.value
  return value && typeof value === 'object' ? (value as InterruptValue) : null
}

function InterruptCard({
  interrupt,
  disabled,
  onResume,
}: {
  interrupt: InterruptValue
  disabled: boolean
  onResume: (approved: boolean, feedback?: string) => Promise<void>
}) {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resume = async (approved: boolean, value?: string) => {
    setIsSubmitting(true)
    try {
      await onResume(approved, value)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (interrupt.max_token !== undefined) {
    return (
      <Alert className='my-2'>
        <AlertTriangleIcon />
        <AlertTitle>Continue this task?</AlertTitle>
        <AlertDescription>
          <p>
            The agent has used approximately{' '}
            {interrupt.max_token.toLocaleString()} tokens and needs approval to
            continue.
          </p>
          <div className='mt-2 flex gap-2'>
            <Button
              size='sm'
              onClick={() => void resume(true)}
              disabled={disabled || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2Icon className='animate-spin' />
              ) : (
                <CheckIcon />
              )}
              Continue
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => void resume(false, 'Stop the current task.')}
              disabled={disabled || isSubmitting}
            >
              <XIcon />
              Stop
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className='my-2'>
      <MessageCircleQuestionIcon />
      <AlertTitle>The agent needs your input</AlertTitle>
      <AlertDescription className='w-full'>
        <p>{interrupt.question ?? 'Please provide more information.'}</p>
        <Textarea
          className='mt-2 min-h-20 resize-y'
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder='Type your response…'
          disabled={disabled || isSubmitting}
        />
        <Button
          className='mt-2 justify-self-end'
          size='sm'
          onClick={() => void resume(false, feedback.trim())}
          disabled={disabled || isSubmitting || !feedback.trim()}
        >
          {isSubmitting && <Loader2Icon className='animate-spin' />}
          Send response
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function ChatMessageParts({
  message,
  messages,
  messageIndex,
  status,
  onRegenerate,
  onResume,
}: ChatMessagePartsProps) {
  const fileParts = message.parts.filter((part) => part.type === 'file')
  const sourceParts = message.parts.filter((part) => part.type === 'source-url')
  const dataParts = message.parts.filter(isDataPart)
  const progressParts = dataParts.filter((part) => part.type === 'data-info')
  const interruptPart = dataParts.findLast(
    (part) => part.type === 'data-interrupt',
  )
  const interrupt = interruptPart ? getInterrupt(interruptPart.data) : null
  const isLastMessage = messageIndex === messages.length - 1
  const isActive =
    isLastMessage && (status === 'submitted' || status === 'streaming')

  return (
    <MessageComponent from={message.role}>
      {fileParts.length > 0 && (
        <Attachments className='mb-2' variant='grid'>
          {fileParts.map((attachment) => (
            <Attachment
              data={{ ...attachment, id: `${message.id}-${attachment.url}` }}
              key={attachment.url}
            >
              <AttachmentPreview />
            </Attachment>
          ))}
        </Attachments>
      )}
      {message.role === 'assistant' && sourceParts.length > 0 && (
        <Sources>
          <SourcesTrigger count={sourceParts.length} />
          {sourceParts.map((part) => (
            <SourcesContent key={part.sourceId}>
              <Source href={part.url} title={part.title ?? part.url} />
            </SourcesContent>
          ))}
        </Sources>
      )}
      <MessageContent>
        {progressParts.length > 0 && (
          <Task defaultOpen={isActive}>
            <TaskTrigger
              title={isActive ? 'Agent is working…' : 'Agent activity'}
            />
            <TaskContent>
              {progressParts.map((part, index) => {
                const running = isActive && index === progressParts.length - 1
                return (
                  <TaskItem
                    className='flex items-start gap-2 break-words'
                    key={`${message.id}-progress-${index}`}
                  >
                    {running ? (
                      <Loader2Icon className='mt-0.5 size-3.5 shrink-0 animate-spin' />
                    ) : (
                      <CircleIcon className='mt-1 size-2.5 shrink-0 fill-current opacity-50' />
                    )}
                    <span>{getProgressLabel(part.data)}</span>
                  </TaskItem>
                )
              })}
            </TaskContent>
          </Task>
        )}
        {message.parts.map((part, partIndex) => {
          switch (part.type) {
            case 'text':
              return (
                <Fragment key={`${message.id}-text-${partIndex}`}>
                  <MessageResponse>{part.text}</MessageResponse>
                  {message.role === 'assistant' && isLastMessage && (
                    <MessageActions>
                      <MessageAction
                        onClick={() => onRegenerate(message.id)}
                        label='Retry'
                      >
                        <RefreshCcwIcon className='size-3' />
                      </MessageAction>
                      <MessageAction
                        onClick={() =>
                          void navigator.clipboard.writeText(part.text)
                        }
                        label='Copy'
                      >
                        <CopyIcon className='size-3' />
                      </MessageAction>
                    </MessageActions>
                  )}
                </Fragment>
              )
            case 'reasoning':
              return (
                <Reasoning
                  key={`${message.id}-reasoning-${partIndex}`}
                  className='w-full'
                  isStreaming={isActive && message.parts.at(-1) === part}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              )
            default:
              if (isToolUIPart(part)) {
                return (
                  <Tool key={part.toolCallId}>
                    <ToolHeader type={part.type} state={part.state} />
                    <ToolContent>
                      <ToolInput input={part.input} />
                      <ToolOutput
                        output={part.output}
                        errorText={part.errorText}
                      />
                    </ToolContent>
                  </Tool>
                )
              }
              return null
          }
        })}
        {interrupt && isLastMessage && (
          <InterruptCard
            interrupt={interrupt}
            disabled={isActive}
            onResume={onResume}
          />
        )}
      </MessageContent>
    </MessageComponent>
  )
}
