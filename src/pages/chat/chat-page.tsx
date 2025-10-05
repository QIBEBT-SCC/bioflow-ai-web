import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {BotIcon, FileIcon, ImageIcon, Maximize2Icon, Minimize2Icon, PaperclipIcon, SendIcon, StopCircleIcon, XIcon} from "lucide-react";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ChatMessage} from "@/components/chat/chat-messages.tsx";
import {FileUpload} from "@/components/chat/file-upload.tsx";
import {chatSSEService} from "@/services/sse-api.tsx";
import {
    AIMessage,
    Message,
    ThinkingMessage,
    LoadingEventData,
    GeneratingEventData,
    ToolCallEventData, InterruptEventData, SuccessEventData, ErrorEventData, InterruptMessage, ToolMessage
} from "@/types/chat.tsx";
import {toast} from "sonner";
import {useChatStore} from "@/stores/chatStore.tsx";
import {useCreateSession} from "@/hooks/use-chat.tsx";
import {HistoryMenu} from "@/components/chat/history-menu.tsx";
import {EditDialog} from "@/components/chat/edit-dialog.tsx";
import {useTranslation} from "react-i18next";

export function ChatPage() {
    const {t} = useTranslation();

    // 使用zustand store管理状态
    const {
        currentSession,
        messages,
        isGenerating,
        loadingMessage,

        // Actions
        setCurrentSession,
        addMessage,
        updateMessage,
        clearMessages,
        setIsGenerating,
        setLoadingMessage,
    } = useChatStore();

    const createSessionMutation = useCreateSession();

    // 编辑状态
    const [inputValue, setInputValue] = useState("");
    const [currentStreamingMessage, setCurrentStreamingMessage] = useState<AIMessage | ThinkingMessage | null>(null);
    const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null)
    const [editingDescription, setEditingDescription] = useState("")
    const [showEditDialog, setShowEditDialog] = useState(false)

    // 中断状态管理
    const [lastMessageWasInterrupt, setLastMessageWasInterrupt] = useState(false)

    // 文件上传相关状态
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }, [])

    // 滚动到底部 - 只在消息内容变化时触发，避免输入区变化时触发
    useEffect(() => {
        scrollToBottom()
    }, [messages.length, scrollToBottom])

    // 当没有会话时清空消息
    useEffect(() => {
        if (!currentSession?.uid) {
            clearMessages()
        }
    }, [currentSession?.uid, clearMessages])

    // 清理函数，在组件卸载时取消正在进行的请求
    useEffect(() => {
        return () => {
            chatSSEService.abort()
        }
    }, [])

    const clearStreamingState = () => {
        if (currentStreamingMessage) {
            console.log(currentStreamingMessage)
            addMessage({
                ...currentStreamingMessage,
            })
        }

        setIsGenerating(false)
        setLoadingMessage(null)
        setCurrentStreamingMessage(null)
        setCurrentStreamingMessageId(null)
    }

    // 停止生成
    const stopGeneration = () => {
        chatSSEService.abort()
        clearStreamingState()

        // 添加一个系统消息表示已停止
        const stopMessage: Message = {
            id: `stop_${Date.now()}`,
            type: "info",
            content: t('chat.generation_stopped'),
            timestamp: new Date(),
        }
        addMessage(stopMessage)
    }


    // 统一的SSE事件处理器
    const createSSEHandlers = () => ({
        onLoading: (data: LoadingEventData) => {
            if (data.message) {
                setLoadingMessage(data.message)
            }
        },

        onGenerating: (data: GeneratingEventData) => {
            if (data.id && data.full_text !== undefined) {
                if (data.id !== currentStreamingMessageId) {
                    // 如果之前有正在生成的消息，先保存到消息列表
                    if (currentStreamingMessage) {
                        addMessage({
                            ...currentStreamingMessage,
                        })
                    }

                    setLoadingMessage(t('chat.thinking'))
                    setCurrentStreamingMessageId(data.id)

                    // 根据thinking字段决定消息类型
                    if (data.thinking) {
                        setCurrentStreamingMessage({
                            id: data.id,
                            type: "thinking" as const,
                            content: data.full_text,
                            timestamp: new Date(),
                        })
                    } else {
                        setCurrentStreamingMessage({
                            id: data.id,
                            type: "ai" as const,
                            content: data.full_text,
                            timestamp: new Date(),
                        })
                    }
                } else {
                    // 更新当前流式消息的内容
                    setCurrentStreamingMessage(prev => {
                        if (!prev || !('content' in prev)) return prev

                        // 如果是思考消息，确保保留thinking属性
                        if (prev.type === 'thinking') {
                            return {
                                ...prev,
                                content: data.full_text || prev.content,
                            }
                        } else {
                            return {
                                ...prev,
                                content: data.full_text || prev.content
                            }
                        }
                    })
                }
            }
        },

        onToolCall: (data: ToolCallEventData) => {
            console.log('Tool call event:', data)

            clearStreamingState()

            if (data.id && data.name) {
                if (data.status === 'calling') {
                    console.log(`Tool call started: ${data.name} (${data.id})`)
                    setLoadingMessage(`Calling tool: ${data.name}`)

                    const toolMessage: ToolMessage = {
                        id: data.id,
                        type: "tool",
                        name: data.name,
                        status: "calling",
                        timestamp: new Date(),
                    }
                    addMessage(toolMessage)
                } else if (data.status === 'completed' || data.status === 'error') {
                    const isSuccess = data.status === 'completed'

                    console.log(`Tool call ended: ${data.name} (${data.id}) - ${isSuccess ? 'success' : 'error'}`)

                    updateMessage(
                        data.id,
                        {status: data.status,}
                    )
                }
            }
        },

        onInterrupt: (data: InterruptEventData) => {
            console.log('Interrupt event:', data)

            clearStreamingState()

            // 处理问题类型的中断
            if (data.confirm) {
                const interruptMessage: InterruptMessage = {
                    id: `interrupt_${Date.now()}`,
                    type: "interrupt",
                    content: data.confirm,
                    timestamp: new Date(),
                    status: "sent",
                    action: {
                        id: "confirm",
                        label: t('chat.confirm'),
                        type: "confirm",
                        pending: false,
                    }
                }
                addMessage(interruptMessage)
                setLastMessageWasInterrupt(true)
            }
            // 处理确认类型的中断（不需要action按钮）
            else if (data.question) {
                const interruptMessage: Message = {
                    id: `interrupt_${Date.now()}`,
                    type: "interrupt",
                    content: data.question,
                    timestamp: new Date(),
                    status: "sent",
                }
                addMessage(interruptMessage)
                setLastMessageWasInterrupt(true)
            } else {
                console.warn('No question or confirm content found in interrupt data:', data)
            }
        },

        onSuccess: (data: SuccessEventData) => {
            clearStreamingState()

            // 处理链接消息
            if (data.link) {
                const linkMessage: Message = {
                    id: `link_${Date.now()}`,
                    type: "link",
                    link: data.link,
                    title: t('chat.jump_to_editor'),
                    description: t('chat.click_to_open_editor'),
                    timestamp: new Date(),
                }
                addMessage(linkMessage)
            }
            // 处理信息消息
            else if (data.info) {
                const infoMessage: Message = {
                    id: `info_${Date.now()}`,
                    type: "info",
                    content: data.info,
                    timestamp: new Date(),
                }
                addMessage(infoMessage)
            }
        },

        onError: (data: ErrorEventData) => {
            console.error('Chat error:', data)
            toast.error(data.error || t('chat.error_occurred'))

            clearStreamingState()

            const errorMessage: Message = {
                id: `error_${Date.now()}`,
                type: "info",
                content: t('chat.error_prefix', {error: data.error || t('chat.error_occurred')}),
                timestamp: new Date(),
            }
            addMessage(errorMessage)
            setLastMessageWasInterrupt(false)
        },

        onClose: () => {
            if (currentStreamingMessage) {
                addMessage({
                    ...currentStreamingMessage,
                })
            }
            setIsGenerating(false)
            setCurrentStreamingMessage(null)
            setCurrentStreamingMessageId(null)
            setLoadingMessage(null)
            setLastMessageWasInterrupt(false)
        },
    })

    // 统一的发送消息函数
    const sendMessageToSSE = async (
        message: string,
        files: File[] = [],
        isResume: boolean = false
    ) => {
        try {
            let sessionId = currentSession?.uid

            if (!sessionId) {
                try {
                    const new_session = await createSessionMutation.mutateAsync();
                    sessionId = new_session.uid
                    setCurrentSession(new_session);
                } catch (error) {
                    console.error('Failed to create session:', error);
                    toast.error(t('chat.create_session_failed'));
                    setIsGenerating(false);
                    return;
                }
            }

            await chatSSEService.sendMessage(
                {
                    message,
                    session_id: sessionId,
                    files: files.length > 0 ? files : undefined,
                    resume: isResume,
                },
                createSSEHandlers()
            )
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error(t('chat.send_message_failed'))
            setIsGenerating(false)
            setCurrentStreamingMessage(null)
            setCurrentStreamingMessageId(null)
            setLoadingMessage(null)
        } finally {
            setLastMessageWasInterrupt(false)
        }
    }

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && selectedFiles.length === 0) || isGenerating) return

        const currentInput = inputValue.trim()
        const filesToSend = [...selectedFiles]

        // 清空输入和文件
        setInputValue("")
        setSelectedFiles([])
        setShowFileUpload(false)
        setIsGenerating(true)
        setCurrentStreamingMessage(null)
        setCurrentStreamingMessageId(null)
        setLoadingMessage(null)

        // 创建用户消息
        const userMessage: Message = {
            id: `user_${Date.now()}`,
            type: "user",
            content: currentInput || t('chat.uploaded_files', {count: filesToSend.length}),
            timestamp: new Date(),
            status: "sent",
            attachments: filesToSend.map(file => ({
                type: file.type.startsWith("image/") ? "image" : "file",
                name: file.name,
                url: URL.createObjectURL(file),
                size: file.size,
            })),
        }

        addMessage(userMessage)

        // 发送消息
        await sendMessageToSSE(currentInput, filesToSend, lastMessageWasInterrupt)
    }


    const handleActionClick = async (messageId: string, actionId: string) => {
        // 更新按钮状态为pending
        const targetMessage = messages.find(msg => msg.id === messageId)
        if (targetMessage && 'action' in targetMessage && targetMessage.action) {
            const updatedAction = targetMessage.action.id === actionId
                ? {...targetMessage.action, pending: true}
                : targetMessage.action
            updateMessage(messageId, {action: updatedAction})
        }

        // 设置生成状态
        setIsGenerating(true)
        setCurrentStreamingMessage(null)
        setCurrentStreamingMessageId(null)
        setLoadingMessage(null)

        // 发送确认请求（resume=true）
        await sendMessageToSSE("", [], true)

        // 移除操作按钮
        updateMessage(messageId, {action: undefined})
    }

    const handleFileUpload = (files: File[]) => {
        setSelectedFiles(prev => [...prev, ...files])
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (!isGenerating) {
                handleSendMessage().then()
            }
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile()
                if (file) {
                    handleFileUpload([file])
                }
            }
        }
    }

    return (
        <SidebarInset className="h-screen flex flex-col">
            <header className="flex flex-col shrink-0 border-b">
                <div className="flex items-center justify-between px-4 h-12 bg-background">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1"/>
                        <Separator orientation="vertical" className="!mr-2 !h-4"/>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbPage>
                                        {t('chat.title')}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block"/>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        <span
                                            className="text-sm text-muted-foreground hidden sm:block">{currentSession?.description || t('chat.new_conversation')}</span>
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* 历史对话下拉菜单 */}
                    <HistoryMenu
                        setEditID={setEditingHistoryId}
                        setDescription={setEditingDescription}
                        setShowEditDialog={setShowEditDialog}
                    />
                </div>
            </header>
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4 bg-muted">
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} onActionClick={handleActionClick}/>
                        ))}

                        {/* 当前流式生成的消息 */}
                        {currentStreamingMessage && (
                            <ChatMessage
                                key={currentStreamingMessage.id}
                                message={currentStreamingMessage}
                                onActionClick={handleActionClick}
                            />
                        )}

                        {/* 生成中的加载动画 - 在SSE连接期间持续显示，直到收到generating消息 */}
                        {isGenerating && !currentStreamingMessage && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                    <BotIcon className="w-4 h-4 text-accent-foreground"/>
                                </div>
                                <div className="bg-card text-card-foreground border border-border rounded-lg p-4 animate-pulse">
                                    {loadingMessage ? (
                                        <div className="text-sm text-muted-foreground">
                                            {loadingMessage}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <div
                                                className="w-2 h-2 bg-current rounded-full animate-bounce"
                                                style={{animationDelay: "0ms"}}
                                            />
                                            <div
                                                className="w-2 h-2 bg-current rounded-full animate-bounce"
                                                style={{animationDelay: "150ms"}}
                                            />
                                            <div
                                                className="w-2 h-2 bg-current rounded-full animate-bounce"
                                                style={{animationDelay: "300ms"}}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef}/>
                    </div>
                </ScrollArea>
            </div>

            <div className="border-t border-border p-4 bg-card flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                    {showFileUpload && (
                        <div className="mb-4">
                            <FileUpload
                                onFileUpload={handleFileUpload}
                                disabled={isGenerating}
                            />
                        </div>
                    )}

                    {/* 显示已选择的文件 */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{t('chat.selected_files', {count: selectedFiles.length})}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFiles([])}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    {t('chat.clear_all')}
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
                                        {file.type.startsWith("image/") ? (
                                            <ImageIcon className="w-4 h-4 text-blue-500"/>
                                        ) : (
                                            <FileIcon className="w-4 h-4 text-gray-500"/>
                                        )}
                                        <span className="text-sm truncate max-w-32">{file.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                            disabled={isGenerating}
                                            className="h-4 w-4 p-0"
                                        >
                                            <XIcon className="w-3 h-3"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <Textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onPaste={handlePaste}
                                placeholder={isGenerating ? t('chat.input_placeholder_generating') : selectedFiles.length > 0 ? t('chat.input_placeholder_with_files', {count: selectedFiles.length}) : t('chat.input_placeholder')}
                                className={`pr-24 resize-none transition-all duration-200 ${
                                    isInputExpanded ? "min-h-[120px] max-h-[120px]" : "min-h-[44px] max-h-[120px]"
                                }`}
                                rows={isInputExpanded ? 5 : 1}
                                disabled={isGenerating}
                                style={{
                                    height: isInputExpanded ? '120px' : '44px',
                                    transition: 'height 0.2s ease-in-out'
                                }}
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsInputExpanded(!isInputExpanded)}
                                    className="h-8 w-8 p-0"
                                    title={isInputExpanded ? t('chat.collapse_input') : t('chat.expand_input')}
                                >
                                    {isInputExpanded ? <Minimize2Icon className="w-4 h-4"/> : <Maximize2Icon className="w-4 h-4"/>}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowFileUpload(!showFileUpload)}
                                    className="h-8 w-8 p-0"
                                >
                                    <PaperclipIcon className="w-4 h-4"/>
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()} className="h-8 w-8 p-0">
                                    <ImageIcon className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                        <Button
                            onClick={isGenerating ? stopGeneration : handleSendMessage}
                            disabled={!isGenerating && !inputValue.trim() && selectedFiles.length === 0}
                            className="px-4 h-11 flex-shrink-0"
                            variant={isGenerating ? "destructive" : "default"}
                        >
                            {isGenerating ? <StopCircleIcon className="w-4 h-4"/> : <SendIcon className="w-4 h-4"/>}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{t('chat.character_count', {count: inputValue.length})}</span>
                    </div>
                </div>
            </div>

            {/* 编辑对话描述弹窗 */}
            <EditDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                id={editingHistoryId}
                onIdChange={setEditingHistoryId}
                value={editingDescription}
                onValueChange={setEditingDescription}
            />
        </SidebarInset>
    )
}