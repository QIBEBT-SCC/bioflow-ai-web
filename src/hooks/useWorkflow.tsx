import {useMutation, useQuery, UseQueryOptions} from '@tanstack/react-query';
import {workflowApi} from '@/services/api.tsx';

export function useSaveWorkflow() {
    const runWorkflowMutation = useMutation({
        mutationFn: workflowApi.saveWorkflow,
        onSuccess: () => {
            console.log('工作流保存成功');
        },
        onError: (error) => {
            console.error('保存工作流时出错：', error);
        }
    });

    return {
        saveWorkflow: runWorkflowMutation.mutate,
        isRunning: runWorkflowMutation.isPending,
        error: runWorkflowMutation.error
    };
}

export function useWorkflows() {
    const options: UseQueryOptions<string[], Error> = {
        queryKey: ['workflows'],
        queryFn: workflowApi.getWorkflows,
    };

    return useQuery(options);
} 