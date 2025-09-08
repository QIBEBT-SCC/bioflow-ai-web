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
import React, {useEffect, useRef, useState} from "react";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ChatMessage} from "@/components/chat/chat-messages.tsx";
import {FileUpload} from "@/components/chat/file-upload.tsx";
import {chatSSEService} from "@/services/sse-api.tsx";
import {Message, SSEEventData} from "@/types/chat.tsx";
import {toast} from "sonner";
import {useChatStore} from "@/stores/chatStore.tsx";
import {useCreateSession} from "@/hooks/use-chat.tsx";
import {HistoryMenu} from "@/components/chat/history-menu.tsx";
import {EditDialog} from "@/components/chat/edit-dialog.tsx";

export function ChatPage() {
    // 使用zustand store管理状态
    const {
        currentSession,
        messages,
        isGenerating,

        // Actions
        setCurrentSession,
        addMessage,
        updateMessage,
        clearMessages,
        setIsGenerating,
    } = useChatStore();

    // 使用react-query hooks获取数据
    const createSessionMutation = useCreateSession();

    // 编辑状态（这些保持本地状态，因为是临时的UI状态）
    const [inputValue, setInputValue] = useState("");
    const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null)
    const [editingDescription, setEditingDescription] = useState("")
    const [showEditDialog, setShowEditDialog] = useState(false)

    // 文件上传相关状态
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }

    // 滚动到底部
    useEffect(() => {
        scrollToBottom()
    }, [messages, currentStreamingMessage])

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

    // 停止生成
    const stopGeneration = () => {
        chatSSEService.abort()
        setIsGenerating(false)
        setCurrentStreamingMessage(null)

        // 添加一个系统消息表示已停止
        const stopMessage: Message = {
            id: `stop_${Date.now()}`,
            type: "system",
            content: "生成已停止",
            timestamp: new Date(),
            status: "sent",
        }
        addMessage(stopMessage)
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

        // 创建用户消息
        const userMessage: Message = {
            id: `user_${Date.now()}`,
            type: "user",
            content: currentInput || `上传了 ${filesToSend.length} 个文件`,
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

        try {
            let sessionId = currentSession?.uid

            // 如果没有当前会话ID，先创建会话
            if (!sessionId) {
                try {
                    const new_session = await createSessionMutation.mutateAsync();
                    sessionId = new_session.uid
                    setCurrentSession(new_session);
                } catch (error) {
                    // 如果创建会话失败，停止执行并显示错误
                    console.error('Failed to create session:', error);
                    toast.error('创建会话失败，请稍后重试');
                    setIsGenerating(false);
                    return;
                }
            }

            // 发送聊天请求
            await chatSSEService.sendMessage(
                {
                    message: currentInput,
                    session_id: sessionId || undefined,
                    files: filesToSend.length > 0 ? filesToSend : undefined,
                },
                {
                    onLoading: (data: SSEEventData) => {
                        // 显示加载状态，可以在UI中显示加载动画
                        console.log('Loading:', data.message)
                    },

                    onGenerating: (data: SSEEventData) => {
                        // 处理流式生成
                        if (data.id && data.full_text !== undefined) {
                            setCurrentStreamingMessage({
                                id: data.id,
                                type: "ai",
                                content: data.full_text,
                                timestamp: new Date(),
                                status: "sending",
                            })
                        }
                    },

                    onToolCall: (data: SSEEventData) => {
                        // 处理工具调用
                        console.log('Tool call event:', data)

                        if (data.id && data.tool_name) {
                            if (data.status === 'begin') {
                                console.log(`Tool call started: ${data.tool_name} (${data.id})`)
                                const toolMessage: Message = {
                                    id: `tool_${data.id}`,
                                    type: "tool",
                                    content: "",
                                    timestamp: new Date(),
                                    toolCall: {
                                        name: data.tool_name,
                                        status: "calling",
                                    },
                                }
                                addMessage(toolMessage)
                            } else if (data.status === 'end') {
                                // 更新工具调用状态为完成或错误
                                const toolId = `tool_${data.id}`
                                const isSuccess = !data.error

                                console.log(`Tool call ended: ${data.tool_name} (${data.id}) - ${isSuccess ? 'success' : 'error'}`)

                                updateMessage(toolId, {
                                    toolCall: {
                                        name: data.tool_name,
                                        status: isSuccess ? "completed" : "error",
                                        result: data.result || undefined, // 如果有返回结果，保存它
                                    }
                                })

                                // 如果工具调用失败，可以选择显示错误提示
                                if (!isSuccess && data.error) {
                                    console.error(`Tool call failed: ${data.tool_name} - ${data.error}`)
                                }
                            }
                        }
                    },

                    onInterrupt: (data: SSEEventData) => {
                        // 处理中断消息，创建带确认框的消息
                        console.log('Interrupt event:', data)

                        if (data.full_text) {
                            const interruptMessage: Message = {
                                id: `interrupt_${Date.now()}`,
                                type: "ai",
                                content: data.full_text,
                                timestamp: new Date(),
                                status: "sent",
                                actions: [
                                    {
                                        id: "confirm",
                                        label: "确认",
                                        type: "confirm",
                                        pending: false,
                                    },
                                    {
                                        id: "cancel",
                                        label: "取消",
                                        type: "cancel",
                                        pending: false,
                                    }
                                ]
                            }
                            addMessage(interruptMessage)
                        } else {
                            console.warn('No message content found in interrupt data:', data)
                        }
                    },

                    onSuccess: (data: SSEEventData) => {
                        // 生成完成
                        if (data.id && typeof data.message === 'object' && data.message.content) {
                            const aiMessage: Message = {
                                id: data.id,
                                type: "ai",
                                content: data.message.content,
                                timestamp: new Date(),
                                status: "sent",
                            }
                            addMessage(aiMessage)
                        }

                        setCurrentStreamingMessage(null)
                        setIsGenerating(false)
                    },

                    onError: (data: SSEEventData) => {
                        // 处理错误
                        console.error('Chat error:', data)
                        toast.error(data.error || '发生未知错误')

                        const errorMessage: Message = {
                            id: `error_${Date.now()}`,
                            type: "system",
                            content: `错误: ${data.error || '发生未知错误'}`,
                            timestamp: new Date(),
                            status: "error",
                        }
                        addMessage(errorMessage)
                        setCurrentStreamingMessage(null)
                        setIsGenerating(false)
                    },

                    onClose: () => {
                        setIsGenerating(false)
                        setCurrentStreamingMessage(null)
                    },
                }
            )
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('发送消息失败')
            setIsGenerating(false)
            setCurrentStreamingMessage(null)
        }
    }


    const handleActionClick = (messageId: string, actionId: string) => {
        // 更新按钮状态为pending
        const targetMessage = messages.find(msg => msg.id === messageId)
        if (targetMessage?.actions) {
            const updatedActions = targetMessage.actions.map((action) =>
                action.id === actionId ? {...action, pending: true} : action,
            )
            updateMessage(messageId, {actions: updatedActions})
        }

        setTimeout(() => {
            if (actionId === "confirm") {
                const systemMessage: Message = {
                    id: Date.now().toString(),
                    type: "system",
                    content: "操作已确认并执行完成",
                    timestamp: new Date(),
                    status: "sent",
                }
                addMessage(systemMessage)
            } else if (actionId === "cancel") {
                const systemMessage: Message = {
                    id: Date.now().toString(),
                    type: "system",
                    content: "操作已取消",
                    timestamp: new Date(),
                    status: "sent",
                }
                addMessage(systemMessage)
            }

            // 移除操作按钮
            updateMessage(messageId, {actions: undefined})
        }, 1500)
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
                                        Chat
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block"/>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        <span
                                            className="text-sm text-muted-foreground hidden sm:block">{currentSession?.description || "新对话"}</span>
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

                        {/* 生成中的加载动画 */}
                        {isGenerating && !currentStreamingMessage && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                    <BotIcon className="w-4 h-4 text-accent-foreground"/>
                                </div>
                                <div className="bg-card text-card-foreground border border-border rounded-lg p-4 animate-pulse">
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
                                <span className="text-sm font-medium">已选择 {selectedFiles.length} 个文件</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFiles([])}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    清空全部
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
                                placeholder={isGenerating ? "AI正在生成回复..." : `输入消息... (支持 Shift+Enter 换行，Ctrl+V 粘贴图片)${selectedFiles.length > 0 ? ` • 已选择 ${selectedFiles.length} 个文件` : ""}`}
                                className={`pr-24 resize-none transition-all duration-200 ${
                                    isInputExpanded ? "min-h-[120px]" : "min-h-[44px]"
                                }`}
                                rows={isInputExpanded ? 5 : 1}
                                disabled={isGenerating}
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsInputExpanded(!isInputExpanded)}
                                    className="h-8 w-8 p-0"
                                    title={isInputExpanded ? "收缩输入框" : "展开输入框"}
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
                            className={`px-4 transition-all duration-200 ${isInputExpanded ? "h-[120px] self-stretch" : "h-11"}`}
                            variant={isGenerating ? "destructive" : "default"}
                        >
                            {isGenerating ? <StopCircleIcon className="w-4 h-4"/> : <SendIcon className="w-4 h-4"/>}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        {/*<span>*/}
                        {/*  支持 Markdown 格式 • 代码高亮 • Mermaid 图表 •{" "}*/}
                        {/*    {isInputExpanded ? "展开模式" : "点击展开按钮获得更大输入区域"}*/}
                        {/*</span>*/}
                        <span>{inputValue.length}/2000</span>
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