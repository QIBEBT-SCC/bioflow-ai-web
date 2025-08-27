// SSE事件类型
export enum SSEEventType {
    LOADING = 'loading',
    GENERATING = 'generating',
    TOOL_CALL = 'tool_call',
    ERROR = 'error',
    SUCCESS = 'success',
}

// SSE事件数据
export interface SSEEventData {
    id?: string;
    message?: string | { role: string; content: string };
    delta?: string;
    full_text?: string;
    tool_name?: string;
    status?: 'begin' | 'end';
    result?: string; // 工具调用的返回结果
    error?: string;
    detail?: string;
}

// SSE事件处理器接口
export interface ChatEventHandlers {
    onLoading?: (data: SSEEventData) => void;
    onGenerating?: (data: SSEEventData) => void;
    onToolCall?: (data: SSEEventData) => void;
    onSuccess?: (data: SSEEventData) => void;
    onError?: (data: SSEEventData) => void;
    onOpen?: () => void;
    onClose?: () => void;
}

// 聊天请求类型
export interface ChatRequest {
    message: string;
    session_id?: string;
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
    additional_kwargs?: Record<string, any>;
    response_metadata?: Record<string, any>;
    tool_calls?: Array<{
        name: string;
        args: Record<string, any>;
        id: string;
    }>;
    id?: string;
}

// 聊天消息类型
export interface Message {
    id: string;
    type: "user" | "ai" | "system" | "tool";
    content: string;
    timestamp: Date;
    status?: "sending" | "sent" | "error";
    toolCall?: ToolCall;
    attachments?: Attachment[];
    actions?: Action[];
}

// 工具调用
export interface ToolCall {
    name: string;
    status: "calling" | "completed" | "error";
    result?: string;
}

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
    type: "confirm" | "cancel" | "execute";
    pending?: boolean;
}