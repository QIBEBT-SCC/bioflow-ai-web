"use client"

import {useState} from "react"
import {Card} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {
    UserIcon,
    BotIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    DownloadIcon,
    EyeIcon,
    WrenchIcon,
    Loader2Icon,
    ChevronDownIcon,
    ChevronRightIcon,
    ExternalLinkIcon,
    BrainIcon,
    AlertCircleIcon,
} from "lucide-react"
import {MarkdownRenderer} from "@/components/markdown-render.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Message} from "@/types/chat.tsx";
import {useTranslation} from "react-i18next";

interface ChatMessageProps {
    message: Message
    onActionClick: (messageId: string, actionId: string) => void
}

export function ChatMessage({message, onActionClick}: ChatMessageProps) {
    const {t} = useTranslation();
    const [imageError, setImageError] = useState(false)
    const [isToolCollapsed, setIsToolCollapsed] = useState(message.type === "tool" && message.status === "completed")
    const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(true)

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ""
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }

    const getStatusIcon = () => {
        if (message.type === "user" || message.type === "interrupt") {
            switch (message.status) {
                case "sending":
                    return <ClockIcon className="w-3 h-3 text-muted-foreground animate-pulse"/>
                case "sent":
                    return <CheckCircleIcon className="w-3 h-3 text-green-500"/>
                case "error":
                    return <XCircleIcon className="w-3 h-3 text-destructive"/>
                default:
                    return null
            }
        }
        return null
    }

    const getAvatar = () => {
        switch (message.type) {
            case "user":
                return (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary">
                            <UserIcon className="w-4 h-4"/>
                        </AvatarFallback>
                    </Avatar>
                )
            case "ai":
            case "thinking":
                return (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                            <BotIcon className="w-4 h-4"/>
                        </AvatarFallback>
                    </Avatar>
                )
            case "tool":
                return (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                            <WrenchIcon className="w-4 h-4"/>
                        </AvatarFallback>
                    </Avatar>
                )
            default:
                return null
        }
    }

    // 信息消息
    if (message.type === "info") {
        return (
            <div className="flex justify-center my-4">
                <Badge
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium bg-accent/20 text-accent-foreground border border-accent/30 shadow-sm flex items-center gap-2"
                >
                    {message.content}
                </Badge>
            </div>
        )
    }

    // 链接消息
    if (message.type === "link") {
        return (
            <div className="flex justify-center my-4">
                <Card className="max-w-md w-full p-4 hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ExternalLinkIcon className="w-5 h-5 text-primary"/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                                {message.title || t('chat.jump_to_editor')}
                            </h4>
                            {message.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {message.description}
                                </p>
                            )}
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0">
                            {t('chat.open')}
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    // 思考消息（折叠显示）
    if (message.type === "thinking") {
        return (
            <div className="flex items-start gap-3">
                {getAvatar()}
                <div className="flex flex-col gap-2 max-w-[75%]">
                    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 py-0">
                        {isThinkingCollapsed ? (
                            <div
                                className="p-3 flex items-center gap-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                                onClick={() => setIsThinkingCollapsed(false)}
                            >
                                <BrainIcon className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                                <span className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                                    {message.loadingMessage || t('chat.thinking')}
                                </span>
                                <ChevronRightIcon className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                            </div>
                        ) : (
                            <div className="p-4">
                                <div
                                    className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 -m-2 p-2 rounded"
                                    onClick={() => setIsThinkingCollapsed(true)}
                                >
                                    <BrainIcon className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                                    <span className="font-medium text-blue-800 dark:text-blue-200 flex-1">
                                        {t('chat.thinking_process')}
                                    </span>
                                    <ChevronDownIcon className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                                </div>
                                <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                    <MarkdownRenderer content={message.content}/>
                                </div>
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

    // 中断消息（全宽带边框）
    if (message.type === "interrupt") {
        return (
            <div className="flex items-start gap-3">
                {getAvatar()}
                <div className="flex flex-col gap-2 w-full">
                    <Card className="border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"/>
                            <div className="flex-1 space-y-3">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <MarkdownRenderer content={message.content}/>
                                </div>
                                {message.action && (
                                    <div className="flex gap-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                                        <Button
                                            key={message.action.id}
                                            size="sm"
                                            variant={message.action.type === "confirm" ? "default" : "outline"}
                                            onClick={() => onActionClick(message.id, message.action!.id)}
                                            disabled={message.action.pending}
                                            className="h-8"
                                        >
                                            {message.action.pending && <ClockIcon className="w-3 h-3 mr-1 animate-pulse"/>}
                                            {message.action.label}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {getStatusIcon()}
                    </div>
                </div>
            </div>
        )
    }

    // 工具消息
    if (message.type === "tool") {
        return (
            <div className="flex items-start gap-3">
                {getAvatar()}
                <div className="flex flex-col gap-2 max-w-[75%]">
                    <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800 py-0">
                        {isToolCollapsed && message.status === "completed" ? (
                            <div
                                className="p-3 flex items-center gap-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900 rounded"
                                onClick={() => setIsToolCollapsed(false)}
                            >
                                <WrenchIcon className="w-4 h-4 text-orange-600 dark:text-orange-400"/>
                                <span className="text-sm text-orange-800 dark:text-orange-200 flex-1">
                                    {t('chat.tool_completed_status', {name: message.name})}
                                </span>
                                <CheckCircleIcon className="w-3 h-3 text-green-600"/>
                                <ChevronRightIcon className="w-4 h-4 text-orange-600 dark:text-orange-400"/>
                            </div>
                        ) : (
                            <div className="p-4">
                                <div
                                    className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900 -m-2 p-2 rounded"
                                    onClick={() => message.status === "completed" && setIsToolCollapsed(!isToolCollapsed)}
                                >
                                    <WrenchIcon className="w-4 h-4 text-orange-600 dark:text-orange-400"/>
                                    <span className="font-medium text-orange-800 dark:text-orange-200 flex-1">
                                        {t('chat.tool_call', {name: message.name})}
                                    </span>
                                    {message.status === "calling" && (
                                        <Loader2Icon className="w-4 h-4 text-orange-600 animate-spin"/>
                                    )}
                                    {message.status === "completed" && (
                                        <div className="flex items-center gap-1">
                                            <CheckCircleIcon className="w-4 h-4 text-green-600"/>
                                            <ChevronDownIcon className="w-4 h-4 text-orange-600 dark:text-orange-400"/>
                                        </div>
                                    )}
                                    {message.status === "error" && <XCircleIcon className="w-4 h-4 text-red-600"/>}
                                </div>

                                <div className="text-sm text-orange-700 dark:text-orange-300">
                                    {message.status === "calling" && t('chat.tool_calling')}
                                    {message.status === "completed" && t('chat.tool_completed')}
                                    {message.status === "error" && t('chat.tool_failed')}
                                </div>

                                {message.result && message.status === "completed" && (
                                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded border border-orange-200 dark:border-orange-700">
                                        <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">{t('chat.return_result')}</div>
                                        <div className="text-sm text-foreground">
                                            <MarkdownRenderer content={message.result}/>
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

    // 普通AI消息（无边框，直接显示文本）
    if (message.type === "ai") {
        return (
            <div className="flex items-start gap-3">
                {getAvatar()}
                <div className="flex flex-col gap-2 max-w-[75%]">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <MarkdownRenderer content={message.content}/>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        )
    }

    // 用户消息
    if (message.type === "user") {
        return (
            <div className="flex items-start gap-3 flex-row-reverse">
                <div className="flex flex-col gap-2 max-w-[75%] items-end">
                    <Card className="p-4 break-words bg-muted text-foreground">
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
                                                            <EyeIcon className="w-3 h-3"/>
                                                        </Button>
                                                        <Button size="sm" variant="secondary" className="h-6 px-2">
                                                            <DownloadIcon className="w-3 h-3"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 flex items-center gap-3 bg-muted/50">
                                                    <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center">
                                                        <DownloadIcon className="w-4 h-4 text-accent"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                                                        {attachment.size && (
                                                            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                                                        )}
                                                    </div>
                                                    <Button size="sm" variant="ghost">
                                                        <DownloadIcon className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 消息文本 */}
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <MarkdownRenderer content={message.content}/>
                            </div>
                        </div>
                    </Card>

                    {/* 时间戳和状态 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-row-reverse">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {getStatusIcon()}
                    </div>
                </div>
            </div>
        )
    }

    return null
}
