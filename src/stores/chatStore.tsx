import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import {Message, ChatSessionPublic} from '@/types/chat.tsx';

interface ChatStore {
    // 当前会话状态
    currentSession: ChatSessionPublic | null;
    messages: Message[];
    isGenerating: boolean;
    loadingMessage: string | null;

    // Actions
    setCurrentSession: (session: ChatSessionPublic | null) => void;
    addMessage: (message: Message) => void;
    updateMessage: (messageId: string, updates: Partial<Message>) => void;
    clearMessages: () => void;
    setIsGenerating: (generating: boolean) => void;
    setLoadingMessage: (message: string | null) => void;
}


export const useChatStore = create<ChatStore>()(
    devtools(
        (set) => ({
            // 初始状态
            currentSession: null,
            messages: [],
            isGenerating: false,
            loadingMessage: null,

            // Session 管理
            setCurrentSession: (session: ChatSessionPublic | null) => {
                set({currentSession: session});
            },

            // 消息管理
            addMessage: (message: Message) => {
                set(state => ({
                    messages: [...state.messages, message]
                }));
            },

            updateMessage: (messageId: string, updates: Partial<Message>) => {
                set((state: ChatStore) => ({
                    messages: state.messages.map(msg =>
                        msg.id === messageId ? {...msg, ...updates} : msg
                    ) as Message[]
                }));
            },

            clearMessages: () => {
                set({messages: []});
            },

            setIsGenerating: (generating: boolean) => {
                set({isGenerating: generating});
            },

            setLoadingMessage: (message: string | null) => {
                set({loadingMessage: message});
            },
        }),
        {name: 'chat-store'}
    )
);
