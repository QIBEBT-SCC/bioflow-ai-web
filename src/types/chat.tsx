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
export interface SSEEventData {
    id?: string;
    message?: string;
    delta?: string;
    full_text?: string;
    thinking?: boolean;
    name?: string;
    status?: 'calling' | 'completed' | 'error';
    question?: string;
    confirm?: string;
    link?: string;
    info?: string;
    error?: string;
    detail?: string;
}

// SSE事件处理器接口
export interface ChatEventHandlers {
    onLoading?: (data: SSEEventData) => void;
    onGenerating?: (data: SSEEventData) => void;
    onToolCall?: (data: SSEEventData) => void;
    onInterrupt?: (data: SSEEventData) => void;
    onSuccess?: (data: SSEEventData) => void;
    onError?: (data: SSEEventData) => void;
    onOpen?: () => void;
    onClose?: () => void;
}

// 聊天请求类型
export interface ChatRequest {
    message: string;
    session_id?: string;
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
    type: "human" | "ai" | "system" | "tool";
    content: string;
    additional_kwargs?: Record<string, never>;
    response_metadata?: Record<string, never>;
    tool_calls?: Array<{
        name: string;
        args: Record<string, never>;
        id: string;
    }>;
    id?: string;
}

// 消息基类
interface BaseMessage {
    id: string;
    timestamp: Date;
}

// 普通AI消息类型（无边框，直接显示文本）
export interface AIMessage extends BaseMessage {
    type: "ai";
    content: string;
    thinking?: false;
}

// 思考消息类型（折叠显示，小号浅色字体）
export interface ThinkingMessage extends BaseMessage {
    type: "thinking";
    content: string;
    thinking: true;
    loadingMessage?: string;
}

// 中断消息类型（全宽带边框，可显示确认按钮）
export interface InterruptMessage extends BaseMessage {
    type: "interrupt";
    content: string;
    question?: string;
    confirm?: string;
    status?: "sending" | "sent" | "error";
    action?: Action;
}

// 用户消息类型
export interface UserMessage extends BaseMessage {
    type: "user";
    content: string;
    attachments?: Attachment[];
    status?: "sending" | "sent" | "error";
}

// 工具消息类型
export interface ToolMessage extends BaseMessage {
    type: "tool";
    name: string;
    status: "calling" | "completed" | "error";
    result?: string;
}

// 链接消息类型（显示跳转卡片）
export interface LinkMessage extends BaseMessage {
    type: "link";
    link: string;
    title?: string;
    description?: string;
}

// 信息消息类型
export interface InfoMessage extends BaseMessage {
    type: "info";
    content: string;
}

// 综合消息类型
export type Message = AIMessage | ThinkingMessage | InterruptMessage | UserMessage | ToolMessage | LinkMessage | InfoMessage;

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