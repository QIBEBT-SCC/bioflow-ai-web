"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    User,
    Bot,
    Settings,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Eye,
    Wrench,
    Loader2,
    ChevronDown,
    ChevronRight,
} from "lucide-react"
import {MarkdownRenderer} from "@/components/markdown-render.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Message} from "@/types/chat.tsx";

interface ChatMessageProps {
    message: Message
    onActionClick: (messageId: string, actionId: string) => void
}

export function ChatMessage({ message, onActionClick }: ChatMessageProps) {
    const [imageError, setImageError] = useState(false)
    const [isToolCollapsed, setIsToolCollapsed] = useState(message.toolCall?.status === "completed")

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ""
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }

    const getStatusIcon = () => {
        switch (message.status) {
            case "sending":
                return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />
            case "sent":
                return <CheckCircle className="w-3 h-3 text-green-500" />
            case "error":
                return <XCircle className="w-3 h-3 text-destructive" />
            default:
                return null
        }
    }

    const getAvatar = () => {
        switch (message.type) {
            case "user":
                return (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary">
                            <User className="w-4 h-4" />
                        </AvatarFallback>
                    </Avatar>
                )
            case "ai":
                return (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                            <Bot className="w-4 h-4" />
                        </AvatarFallback>
                    </Avatar>
                )
            case "system":
                return (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-muted">
                            <Settings className="w-4 h-4" />
                        </AvatarFallback>
                    </Avatar>
                )
            case "tool":
                return (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                            <Wrench className="w-4 h-4" />
                        </AvatarFallback>
                    </Avatar>
                )
        }
    }

    const isUserMessage = message.type === "user"
    const isSystemMessage = message.type === "system"
    const isToolMessage = message.type === "tool"

    if (isSystemMessage) {
        return (
            <div className="flex justify-center my-4">
                <Badge
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium bg-accent/20 text-accent-foreground border border-accent/30 shadow-sm flex items-center gap-2"
                >
                    {message.content.includes("确认") && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {message.content.includes("取消") && <XCircle className="w-4 h-4 text-red-500" />}
                    {message.content}
                </Badge>
            </div>
        )
    }

    if (isToolMessage && message.toolCall) {
        return (
            <div className="flex items-start gap-3">
                {getAvatar()}
                <div className="flex flex-col gap-2 max-w-[75%]">
                    <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800 py-0">
                        {isToolCollapsed && message.toolCall.status === "completed" ? (
                            <div
                                className="p-3 flex items-center gap-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900 rounded"
                                onClick={() => setIsToolCollapsed(false)}
                            >
                                <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                <span className="text-sm text-orange-800 dark:text-orange-200 flex-1">
                  {message.toolCall.name} - 已完成
                </span>
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <ChevronRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        ) : (
                            <div className="p-4">
                                <div
                                    className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900 -m-2 p-2 rounded"
                                    onClick={() => message.toolCall?.status === "completed" && setIsToolCollapsed(!isToolCollapsed)}
                                >
                                    <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    <span className="font-medium text-orange-800 dark:text-orange-200 flex-1">
                    工具调用: {message.toolCall.name}
                  </span>
                                    {message.toolCall.status === "calling" && (
                                        <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                                    )}
                                    {message.toolCall.status === "completed" && (
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <ChevronDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    )}
                                    {message.toolCall.status === "error" && <XCircle className="w-4 h-4 text-red-600" />}
                                </div>

                                <div className="text-sm text-orange-700 dark:text-orange-300">
                                    {message.toolCall.status === "calling" && "正在调用工具..."}
                                    {message.toolCall.status === "completed" && "工具调用完成"}
                                    {message.toolCall.status === "error" && "工具调用失败"}
                                </div>

                                {message.toolCall.result && message.toolCall.status === "completed" && (
                                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded border border-orange-200 dark:border-orange-700">
                                        <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">返回结果:</div>
                                        <div className="text-sm text-foreground">
                                            <MarkdownRenderer content={message.toolCall.result} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex items-start gap-3 ${isUserMessage ? "flex-row-reverse" : ""}`}>
            {!isSystemMessage && getAvatar()}

            <div className={`flex flex-col gap-2 max-w-[75%] ${isUserMessage ? "items-end" : "items-start"}`}>
                {/* 消息内容 */}
                <Card className={`p-4 break-words ${isUserMessage ? "bg-muted text-foreground" : "bg-card"}`}>
                    <div className="space-y-3">
                        {/* 附件显示 */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2">
                                {message.attachments.map((attachment, index) => (
                                    <div key={index} className="border border-border rounded-lg overflow-hidden">
                                        {attachment.type === "image" && !imageError ? (
                                            <div className="relative">
                                                <img
                                                    src={attachment.url || "/placeholder.svg"}
                                                    alt={attachment.name}
                                                    className="max-w-full h-auto max-h-64 object-contain"
                                                    onError={() => setImageError(true)}
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <Button size="sm" variant="secondary" className="h-6 px-2">
                                                        <Eye className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="secondary" className="h-6 px-2">
                                                        <Download className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 flex items-center gap-3 bg-muted/50">
                                                <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center">
                                                    <Download className="w-4 h-4 text-accent" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                                                    {attachment.size && (
                                                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                                                    )}
                                                </div>
                                                <Button size="sm" variant="ghost">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 消息文本 */}
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <MarkdownRenderer content={message.content} />
                        </div>

                        {/* 操作按钮 */}
                        {message.actions && message.actions.length > 0 && (
                            <div className="flex gap-2 pt-2 border-t border-border">
                                {message.actions.map((action) => (
                                    <Button
                                        key={action.id}
                                        size="sm"
                                        variant={action.type === "confirm" ? "default" : "outline"}
                                        onClick={() => onActionClick(message.id, action.id)}
                                        disabled={action.pending}
                                        className="h-8"
                                    >
                                        {action.pending && <Clock className="w-3 h-3 mr-1 animate-pulse" />}
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* 时间戳和状态 */}
                <div
                    className={`flex items-center gap-2 text-xs text-muted-foreground ${isUserMessage ? "flex-row-reverse" : ""}`}
                >
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {getStatusIcon()}
                </div>
            </div>
        </div>
    )
}
