import {fetchEventSource} from '@microsoft/fetch-event-source';
import {ChatEventHandlers, ChatRequest, SSEEventData, SSEEventType} from "@/types/chat.tsx";


class SSEChatError extends Error {
    constructor(message: string, public readonly data?: SSEEventData) {
        super(message);
        this.name = 'SSEChatError';
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
            if (request.session_id) {
                formData.append('session_id', request.session_id);
            }
            
            // 添加文件到FormData
            if (request.files && request.files.length > 0) {
                request.files.forEach((file) => {
                    formData.append('files', file);
                });
            }

            await fetchEventSource('/api/v1/chat/completions', {
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
                        const data: SSEEventData = JSON.parse(event.data);

                        switch (event.event as SSEEventType) {
                            case SSEEventType.LOADING:
                                handlers.onLoading?.(data);
                                break;
                            case SSEEventType.GENERATING:
                                handlers.onGenerating?.(data);
                                break;
                            case SSEEventType.TOOL_CALL:
                                handlers.onToolCall?.(data);
                                break;
                            case SSEEventType.SUCCESS:
                                handlers.onSuccess?.(data);
                                break;
                            case SSEEventType.ERROR:
                                handlers.onError?.(data);
                                break;
                            default:
                                console.warn('Unknown event type:', event.event, data);
                        }
                    } catch (error) {
                        console.error('Failed to parse SSE message:', error, event);
                        handlers.onError?.({
                            error: '解析服务器响应失败',
                            detail: error instanceof Error ? error.message : String(error)
                        });
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
                    });

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

    /**
     * 检查是否有进行中的请求
     */
    isConnected(): boolean {
        return this.abortController !== null;
    }
}

// 创建单例实例
export const chatSSEService = new ChatSSEService();
