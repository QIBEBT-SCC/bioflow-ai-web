import {fetchEventSource} from '@microsoft/fetch-event-source';
import {
    ChatEventHandlers,
    ChatRequest,
    SSEEventType,
    LoadingEventData,
    GeneratingEventData,
    ToolCallEventData,
    InterruptEventData,
    SuccessEventData,
    ErrorEventData
} from "@/types/chat.tsx";
import {AiGenRequest, DockerToolCreate} from "@/types/tool.tsx";


class SSEChatError extends Error {
    constructor(message: string, public readonly data?: ErrorEventData) {
        super(message);
        this.name = 'SSEChatError';
    }
}

/**
 * 类型安全的SSE数据解析函数
 */
function parseSSEData(eventType: SSEEventType, rawData: string): LoadingEventData | GeneratingEventData | ToolCallEventData | InterruptEventData | SuccessEventData | ErrorEventData {
    const data = JSON.parse(rawData);

    switch (eventType) {
        case SSEEventType.LOADING:
            return data as LoadingEventData;
        case SSEEventType.GENERATING:
            return data as GeneratingEventData;
        case SSEEventType.TOOL_CALL:
            return data as ToolCallEventData;
        case SSEEventType.INTERRUPT:
            return data as InterruptEventData;
        case SSEEventType.SUCCESS:
            return data as SuccessEventData;
        case SSEEventType.ERROR:
            return data as ErrorEventData;
        default:
            throw new Error(`未知的事件类型: ${eventType}`);
    }
}

/**
 * 聊天SSE服务类
 */
export class ChatSSEService {
    private abortController: AbortController | null = null;

    /**
     * 发送聊天消息并处理SSE流
     */
    async sendMessage(
        request: ChatRequest,
        handlers: ChatEventHandlers
    ): Promise<void> {
        // 如果有正在进行的请求，先取消
        this.abort();

        this.abortController = new AbortController();

        try {
            const token = localStorage.getItem('token');

            // 创建FormData用于表单请求
            const formData = new FormData();
            formData.append('message', request.message);
            formData.append('session_id', request.session_id);

            if (request.resume !== undefined) {
                formData.append('resume', request.resume.toString());
            }

            // 添加文件到
            if (request.files && request.files.length > 0) {
                request.files.forEach((file) => {
                    formData.append('files', file);
                });
            }

            await fetchEventSource('/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    // 浏览器自动设置multipart/form-data
                    ...(token && {'Authorization': `Bearer ${token}`}),
                },
                body: formData,
                signal: this.abortController.signal,

                onopen: async (response) => {
                    if (response.ok) {
                        handlers.onOpen?.();
                        return;
                    }

                    // 处理HTTP错误
                    if (response.status === 401) {
                        throw new SSEChatError('认证失败，请重新登录');
                    } else if (response.status === 400) {
                        const errorText = await response.text();
                        throw new SSEChatError(`请求错误: ${errorText}`);
                    } else {
                        throw new SSEChatError(`服务器错误: ${response.status} ${response.statusText}`);
                    }
                },

                onmessage: (event) => {
                    try {
                        const eventType = event.event as SSEEventType;
                        const parsedData = parseSSEData(eventType, event.data);

                        switch (eventType) {
                            case SSEEventType.LOADING:
                                handlers.onLoading?.(parsedData as LoadingEventData);
                                break;
                            case SSEEventType.GENERATING:
                                handlers.onGenerating?.(parsedData as GeneratingEventData);
                                break;
                            case SSEEventType.TOOL_CALL:
                                handlers.onToolCall?.(parsedData as ToolCallEventData);
                                break;
                            case SSEEventType.INTERRUPT:
                                handlers.onInterrupt?.(parsedData as InterruptEventData);
                                break;
                            case SSEEventType.SUCCESS:
                                handlers.onSuccess?.(parsedData as SuccessEventData);
                                break;
                            case SSEEventType.ERROR:
                                handlers.onError?.(parsedData as ErrorEventData);
                                break;
                            default:
                                console.warn('Unknown event type:', event.event, parsedData);
                        }
                    } catch (error) {
                        // 如果解析失败，返回错误数据
                        return {
                            error: '解析服务器响应失败',
                            detail: error instanceof Error ? error.message : String(error)
                        } as ErrorEventData;
                    }
                },

                onerror: (error) => {
                    console.error('SSE connection error:', error);

                    if (error.name === 'AbortError') {
                        // 用户主动取消，不需要报错
                        return;
                    }

                    let errorMessage = '连接服务器失败';
                    if (error instanceof TypeError) {
                        errorMessage = '网络连接错误，请检查网络连接';
                    } else if (error instanceof SSEChatError) {
                        errorMessage = error.message;
                    }

                    handlers.onError?.({
                        error: errorMessage,
                        detail: error.message
                    } as ErrorEventData);

                    throw error;
                },

                onclose: () => {
                    handlers.onClose?.();
                    this.abortController = null;
                },
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                // 用户主动取消，正常情况
                return;
            }

            // 重新抛出错误，让调用者处理
            throw error;
        }
    }

    /**
     * 取消当前聊天请求
     */
    abort(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

// 工具配置生成事件处理器接口
export interface ToolConfigEventHandlers {
    onLoading?: (data: string) => void;
    onGenerating?: (data: string) => void;
    onSuccess?: (data: DockerToolCreate) => void;
    onError?: (data: string) => void;
    onOpen?: () => void;
    onClose?: () => void;
}

/**
 * 工具配置生成SSE服务类
 */
export class ToolConfigSSEService {
    private abortController: AbortController | null = null;

    /**
     * 生成工具配置并处理SSE事件
     */
    async generateToolConfig(
        request: AiGenRequest,
        handlers: ToolConfigEventHandlers
    ): Promise<void> {
        // 如果有正在进行的请求，先取消
        this.abort();

        this.abortController = new AbortController();

        try {
            const token = localStorage.getItem('token');

            // 创建FormData用于表单请求
            const formData = new FormData();
            formData.append('name', request.name);
            formData.append('description', request.description);
            formData.append('image_uid', request.image_uid);

            await fetchEventSource('/api/v1/tools/generate', {
                method: 'POST',
                headers: {
                    // 注意：不要设置Content-Type，让浏览器自动设置multipart/form-data
                    ...(token && {'Authorization': `Bearer ${token}`}),
                },
                body: formData,
                signal: this.abortController.signal,

                onopen: async (response) => {
                    if (response.ok) {
                        handlers.onOpen?.();
                        return;
                    }

                    // 处理HTTP错误
                    if (response.status === 401) {
                        throw new Error('认证失败，请重新登录');
                    } else if (response.status === 400) {
                        const errorText = await response.text();
                        throw new Error(`请求错误: ${errorText}`);
                    } else {
                        throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
                    }
                },

                onmessage: (event) => {
                    try {
                        const data = event.data;

                        switch (event.event) {
                            case 'generating':
                                handlers.onGenerating?.(data);
                                break;
                            case 'success': {
                                const configData: DockerToolCreate = JSON.parse(data);
                                handlers.onSuccess?.(configData);
                                break;
                            }
                            case 'error':
                                handlers.onError?.(data);
                                break;
                            default:
                                console.warn('Unknown event type:', event.event, data);
                        }
                    } catch (error) {
                        console.error('Failed to parse SSE message:', error, event);
                        // 如果解析失败，尝试直接显示原始数据
                        if (event.event === 'generating' || event.event === 'loading') {
                            handlers.onGenerating?.(event.data);
                        } else if (event.event === 'error') {
                            handlers.onError?.(event.data);
                        }
                    }
                },

                onerror: (error) => {
                    console.error('SSE connection error:', error);

                    if (error.name === 'AbortError') {
                        // 用户主动取消，不需要报错
                        return;
                    }

                    let errorMessage = '连接服务器失败';
                    if (error instanceof TypeError) {
                        errorMessage = '网络连接错误，请检查网络连接';
                    } else if (error instanceof Error) {
                        errorMessage = error.message;
                    }

                    handlers.onError?.(errorMessage);
                    throw error;
                },

                onclose: () => {
                    handlers.onClose?.();
                    this.abortController = null;
                },
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                // 用户主动取消，正常情况
                return;
            }

            // 重新抛出错误，让调用者处理
            throw error;
        }
    }

    /**
     * 取消当前生成请求
     */
    abort(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

// 创建单例实例
export const chatSSEService = new ChatSSEService();
export const toolConfigSSEService = new ToolConfigSSEService();
