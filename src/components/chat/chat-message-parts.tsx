'use client'

import type { ChatStatus, UIMessage } from 'ai'
import { CopyIcon, RefreshCcwIcon } from 'lucide-react'
import { Fragment } from 'react'
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
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'

interface ChatMessagePartsProps {
  message: UIMessage
  messages: UIMessage[]
  messageIndex: number
  status: ChatStatus
}

export function ChatMessageParts({
  message,
  messages,
  messageIndex,
  status,
}: ChatMessagePartsProps) {
  const fileParts = message.parts.filter((part) => part.type === 'file')
  const sourceParts = message.parts.filter((part) => part.type === 'source-url')
  return (
    <MessageComponent from={message.role}>
      {/* Attachments */}
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
      {/* Sources */}
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
              const isLastMessage = messageIndex === messages.length - 1
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: message parts have no unique ID
                <Fragment key={`${message.id}-${i}`}>
                  <MessageResponse>{part.text}</MessageResponse>
                  {message.role === 'assistant' && isLastMessage && (
                    <MessageActions>
                      <MessageAction onClick={() => {}} label='Retry'>
                        <RefreshCcwIcon className='size-3' />
                      </MessageAction>
                      <MessageAction
                        onClick={() => navigator.clipboard.writeText(part.text)}
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
                <Tool key={part.toolCallId || `${message.id}-${i}`}>
                  <ToolHeader type={part.type} state={part.state} />
                  <ToolContent>
                    <ToolInput input={part.input} />
                    <ToolOutput
                      output={JSON.stringify(part.output, null, 2)}
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
  )
}
