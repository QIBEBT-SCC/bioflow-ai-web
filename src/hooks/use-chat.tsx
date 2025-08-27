import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {chatApi} from '@/services/api.tsx';
import {ChatSessionPublic} from '@/types/chat.tsx';
import {toast} from 'sonner';

// 查询键常量
export const CHAT_QUERY_KEYS = {
    sessions: (offset?: number, limit?: number) => ['chat', 'sessions', {offset, limit}] as const,
    history: (sessionId: string) => ['chat', 'history', sessionId] as const,
    all: ['chat'] as const,
} as const;

// 获取聊天历史列表
export const useChatHistories = (offset: number = 0, limit: number = 8) => {
    return useQuery({
        queryKey: CHAT_QUERY_KEYS.sessions(offset, limit),
        queryFn: () => chatApi.getSessions(offset, limit),
        staleTime: 5 * 60 * 1000, // 5分钟内认为数据是新鲜的
        gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
    });
};

// 创建新聊天会话的mutation
export const useCreateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: chatApi.createSession,
        onSuccess: (session) => {
            // 刷新聊天历史列表
            queryClient.invalidateQueries({
                queryKey: CHAT_QUERY_KEYS.all,
            }).then();

            // 为新创建的会话预置空的历史记录
            queryClient.setQueryData(
                CHAT_QUERY_KEYS.history(session.uid),
                []
            );
        },
        onError: (error) => {
            console.error('Failed to create chat session:', error);
            toast.error('创建聊天会话失败');
        },
    });
};

// 更新聊天历史描述的mutation
export const useUpdateChatHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({sessionId, description}: { sessionId: string; description: string }) =>
            chatApi.updateSession(sessionId, description),
        onSuccess: (updatedHistory, {sessionId}) => {
            // 更新聊天历史列表缓存
            queryClient.setQueriesData(
                {queryKey: CHAT_QUERY_KEYS.all},
                (oldData: ChatSessionPublic[] | undefined) => {
                    if (!oldData) return oldData;
                    return oldData.map(history =>
                        history.uid === sessionId ? updatedHistory : history
                    );
                }
            );

            toast.success('聊天描述已更新');
        },
        onError: (error) => {
            console.error('Failed to update chat history:', error);
            toast.error('更新聊天描述失败');
        },
    });
};

// 删除聊天会话的mutation
export const useDeleteChatSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) => chatApi.deleteSession(sessionId),
        onSuccess: (_, sessionId) => {
            // 从聊天历史列表缓存中移除已删除的会话
            queryClient.setQueriesData(
                {queryKey: CHAT_QUERY_KEYS.all},
                (oldData: ChatSessionPublic[] | undefined) => {
                    if (!oldData) return oldData;
                    return oldData.filter(history => history.uid !== sessionId);
                }
            );

            // 清除已删除会话的历史记录缓存
            queryClient.removeQueries({
                queryKey: CHAT_QUERY_KEYS.history(sessionId)
            });

            toast.success('对话已删除');
        },
        onError: (error) => {
            console.error('Failed to delete chat session:', error);
            toast.error('删除对话失败');
        },
    });
};