"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Edit3Icon, HistoryIcon, PlusIcon, Trash2Icon} from "lucide-react";
import {useState} from "react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog.tsx";
import {useChatHistories, useCreateSession, useDeleteChatSession} from "@/hooks/use-chat.tsx";
import {useChatStore} from "@/stores/chatStore.tsx";
import {toast} from "sonner";
import {LangchainMessage, Message, ChatSessionPublic} from "@/types/chat.tsx";
import {chatApi} from "@/services/api.tsx";
import {useTranslation} from "react-i18next";

interface HistoryMenuProps {
    setEditID: (uid: string) => void,
    setDescription: (description: string) => void,
    setShowEditDialog: (value: boolean) => void
}

export function HistoryMenu({setEditID, setDescription, setShowEditDialog}: HistoryMenuProps) {
    const {t} = useTranslation();
    const {data: chatHistories = []} = useChatHistories();
    const [isOpen, setIsOpen] = useState(false);

    const {
        currentSession,

        // Actions
        setCurrentSession,
        clearMessages,
        addMessage
    } = useChatStore();

    const createSessionMutation = useCreateSession();
    const deleteSessionMutation = useDeleteChatSession();

    const createNewChat = async () => {
        try {
            // 使用mutation创建新会话
            const newSession = await createSessionMutation.mutateAsync();
            setCurrentSession(newSession);
            clearMessages(); // 清空消息，准备新对话
            toast.success(t('chat.history.new_chat'));
        } catch (error) {
            // 如果失败，显示错误并清空当前会话
            console.error('Failed to create new chat:', error);
            toast.error(t('chat.history.new_chat_failed'));
            setCurrentSession(null);
            clearMessages();
        }
    }

    // 转换后端聊天历史为前端消息格式
    const convertMessages = (history: LangchainMessage[]): Message[] => {
        return history.map((msg, index) => ({
            id: msg.id || `history_${index}`,
            type: msg.type === 'human' ? 'user' : msg.type as Message['type'],
            content: msg.content,
            timestamp: new Date(),
            status: 'sent',
            toolCall: msg.tool_calls && msg.tool_calls.length > 0 ? {
                name: msg.tool_calls[0].name,
                status: 'completed',
                result: msg.content
            } : undefined
        }))
    }

    // 历史对话相关函数
    const switchToHistory = async (history: ChatSessionPublic) => {
        if (history.uid === currentSession?.uid) return

        try {
            // 设置新的会话
            setCurrentSession(history)

            // 主动加载该会话的历史记录
            const messages = await chatApi.getSessionHistory(history.uid)
            const convertedMessages = convertMessages(messages)
            clearMessages()
            convertedMessages.forEach(msg => addMessage(msg))

            toast.success(t('chat.history.switched_to', {name: chatHistories.find(h => h.uid === history.uid)?.description || '未知对话'}))
        } catch (error) {
            console.error('Failed to load chat history:', error)
            toast.error(t('chat.history.load_history_failed'))
            // 即使加载失败，也要设置session ID，用户可以开始新的对话
            setCurrentSession(history)
        }
    }

    const formatRelativeTime = (date_string: string) => {
        const now = new Date()
        const date = new Date(date_string)
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor(diff / (1000 * 60))

        if (days > 0) return t('chat.history.time_ago.days_ago', {count: days})
        if (hours > 0) return t('chat.history.time_ago.hours_ago', {count: hours})
        if (minutes > 0) return t('chat.history.time_ago.minutes_ago', {count: minutes})
        return t('chat.history.time_ago.just_now')
    }

    const deleteHistory = async (historyId: string) => {
        try {
            // 先检查是否是当前会话，如果是，需要先切换到其他会话或清空
            const isCurrentSession = historyId === currentSession?.uid;
            
            if (isCurrentSession) {
                // 找到一个不同的会话来切换，或者清空状态
                const otherSession = chatHistories.find(h => h.uid !== historyId);
                if (otherSession) {
                    // 先切换到其他会话
                    setCurrentSession(otherSession);
                } else {
                    // 如果没有其他会话，清空当前状态
                    setCurrentSession(null);
                }
                // 清空消息
                clearMessages();
            }
            
            // 使用mutation删除会话
            await deleteSessionMutation.mutateAsync(historyId);
            
            // 关闭下拉菜单
            setIsOpen(false);
            
        } catch (error) {
            console.error('Failed to delete chat session:', error);
            // 如果删除失败且之前改变了状态，需要恢复
            if (historyId === currentSession?.uid) {
                // 尝试恢复到被删除的会话
                const targetSession = chatHistories.find(h => h.uid === historyId);
                if (targetSession) {
                    setCurrentSession(targetSession);
                }
            }
            // 错误处理已在mutation的onError中处理，这里不需要额外处理
        }
    }

    const startEditDescription = (historyId: string, currentDescription: string) => {
        setEditID(historyId)
        setDescription(currentDescription)
        setShowEditDialog(true)
    }

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                        <HistoryIcon className="w-4 h-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center justify-between p-2">
                        <span className="font-medium text-sm">{t('chat.history.title')}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={createNewChat}
                            className="h-6 w-6 p-0"
                            disabled={!currentSession?.uid}
                        >
                            <PlusIcon className="w-3 h-3"/>
                        </Button>
                    </div>
                    <DropdownMenuSeparator/>

                    <div className="max-h-64 overflow-y-auto">
                        {chatHistories.map((history) => (
                            <DropdownMenuItem
                                key={history.uid}
                                className={`flex items-center justify-between p-2 cursor-pointer group ${
                                    history.uid === currentSession?.uid ? 'bg-accent' : ''
                                }`}
                                onSelect={(e) => {
                                    // 阻止默认的选择行为，只有在点击主要区域时才切换
                                    e.preventDefault()
                                }}
                            >
                                <div 
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => switchToHistory(history)}
                                >
                                    <div className="font-medium text-sm truncate">
                                        {history.description}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatRelativeTime(history.update_time)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            startEditDescription(history.uid, history.description)
                                        }}
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit3Icon className="w-3 h-3"/>
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                                <Trash2Icon className="w-3 h-3"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('chat.history.delete_confirm_title')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('chat.history.delete_confirm_message', {name: history.description})}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('chat.history.cancel')}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteHistory(history.uid)}
                                                    className="bg-destructive hover:bg-destructive/90"
                                                >
                                                    {t('chat.history.delete')}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>

                    {chatHistories.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            {t('chat.history.no_history')}
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}