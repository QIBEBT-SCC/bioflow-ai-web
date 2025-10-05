// SSE事件类型
export enum SSEEventType {
    LOADING = 'loading',
    GENERATING = 'generating',
    TOOL_CALL = 'tool_call',
    INTERRUPT = 'interrupt',
    ERROR = 'error',
    SUCCESS = 'success',
}

// SSE事件数据
interface BaseSSEEventData {
    id?: string;
}

export interface LoadingEventData extends BaseSSEEventData {
    message: string;
}

export interface GeneratingEventData extends BaseSSEEventData {
    delta: string;
    full_text: string;
    thinking: boolean;
}

export interface ToolCallEventData extends BaseSSEEventData {
    name: string;
    status: 'calling' | 'completed' | 'error';
}

export interface InterruptEventData extends BaseSSEEventData {
    question?: string;
    confirm?: string;
}

export interface SuccessEventData extends BaseSSEEventData {
    link?: string;
    info?: string;
}

export interface ErrorEventData extends BaseSSEEventData {
    error: string;
    detail?: string;
}

// SSE事件处理器接口
export interface ChatEventHandlers {
    onLoading?: (data: LoadingEventData) => void;
    onGenerating?: (data: GeneratingEventData) => void;
    onToolCall?: (data: ToolCallEventData) => void;
    onInterrupt?: (data: InterruptEventData) => void;
    onSuccess?: (data: SuccessEventData) => void;
    onError?: (data: ErrorEventData) => void;
    onOpen?: () => void;
    onClose?: () => void;
}

// 聊天请求类型
export interface ChatRequest {
    message: string;
    session_id: string;
    files?: File[];
    resume: boolean;
}

// 后端返回的聊天会话
export interface ChatSessionPublic {
    uid: string;
    description: string;
    create_time: string; // ISO string from backend
    update_time: string; // ISO string from backend
}

// 后端返回的聊天历史消息格式（基于LangChain格式）
export interface LangchainMessage {
    id?: string;
    type: "human" | "ai" | "system" | "tool";
    content: string;
    additional_kwargs?: Record<string, never>;
    response_metadata?: Record<string, never>;
    tool_calls?: Array<{
        name: string;
        args: Record<string, never>;
        id: string;
    }>;
}

// 前端消息类型
interface BaseMessage {
    id: string;
    timestamp: Date;
}

export interface AIMessage extends BaseMessage {
    type: "ai";
    content: string;
}

export interface ThinkingMessage extends BaseMessage {
    type: "thinking";
    content: string;
}

export interface InterruptMessage extends BaseMessage {
    type: "interrupt";
    content: string;
    question?: string;
    confirm?: string;
    status?: "sending" | "sent" | "error";
    action?: Action;
}

export interface UserMessage extends BaseMessage {
    type: "user";
    content: string;
    attachments?: Attachment[];
    status?: "sending" | "sent" | "error";
}

export interface ToolMessage extends BaseMessage {
    type: "tool";
    name: string;
    status: "calling" | "completed" | "error";
    result?: string;
}

export interface LinkMessage extends BaseMessage {
    type: "link";
    link: string;
    title?: string;
    description?: string;
}

export interface InfoMessage extends BaseMessage {
    type: "info";
    content: string;
}

export type Message =
    AIMessage |
    ThinkingMessage |
    InterruptMessage |
    UserMessage |
    ToolMessage |
    LinkMessage |
    InfoMessage;

// 附件
export interface Attachment {
    type: "image" | "file";
    name: string;
    url: string;
    size?: number;
}

// 操作按钮
export interface Action {
    id: string;
    label: string;
    type?: "confirm" | "cancel" | "default";
    pending?: boolean;
}