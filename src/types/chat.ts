/**
 * Chat Session Types
 */
export interface ChatSessionCreate {
  description?: string
}

export interface ChatSessionPublic {
  uid: string
  description: string
  created_at: string
}

/**
 * SSE Event Types
 */
export enum SSEEventType {
  LOADING = 'loading',
  GENERATING = 'generating',
  TOOL_CALL = 'tool_call',
  INTERRUPT = 'interrupt',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * SSE Event Data Types
 */
export interface LoadingEventData {
  message?: string
}

export interface GeneratingEventData {
  id: string
  full_text: string
  thinking?: boolean
}

export interface ToolCallEventData {
  id: string
  name: string
  status: 'calling' | 'completed' | 'error'
  result?: string
}

export interface InterruptEventData {
  question?: string
  confirm?: string
}

export interface SuccessEventData {
  link?: string
  info?: string
}

export interface ErrorEventData {
  error: string
  detail?: string
}

/**
 * Message Types
 */
export type MessageStatus = 'sending' | 'sent' | 'error'

export interface MessageAttachment {
  type: 'image' | 'file'
  name: string
  url: string
  size?: number
}

export interface BaseMessage {
  id: string
  timestamp: Date
}

export interface UserMessage extends BaseMessage {
  type: 'user'
  content: string
  status: MessageStatus
  attachments?: MessageAttachment[]
}

export interface AIMessage extends BaseMessage {
  type: 'ai'
  content: string
}

export interface ThinkingMessage extends BaseMessage {
  type: 'thinking'
  content: string
}

export interface ToolMessage extends BaseMessage {
  type: 'tool'
  name: string
  status: 'calling' | 'completed' | 'error'
  result?: string
}

export interface InterruptMessage extends BaseMessage {
  type: 'interrupt'
  content: string
  status: MessageStatus
  action?: {
    id: string
    label: string
    type: 'confirm' | 'cancel'
    pending: boolean
  }
}

export interface LinkMessage extends BaseMessage {
  type: 'link'
  link: string
  title?: string
  description?: string
}

export interface InfoMessage extends BaseMessage {
  type: 'info'
  content: string
}

export type Message =
  | UserMessage
  | AIMessage
  | ThinkingMessage
  | ToolMessage
  | InterruptMessage
  | LinkMessage
  | InfoMessage

/**
 * Chat Request
 */
export interface ChatRequest {
  message: string
  session_id: string
  files?: File[]
  resume?: boolean
}

/**
 * SSE Event Handlers
 */
export interface ChatEventHandlers {
  onLoading?: (data: LoadingEventData) => void
  onGenerating?: (data: GeneratingEventData) => void
  onToolCall?: (data: ToolCallEventData) => void
  onInterrupt?: (data: InterruptEventData) => void
  onSuccess?: (data: SuccessEventData) => void
  onError?: (data: ErrorEventData) => void
  onOpen?: () => void
  onClose?: () => void
}

