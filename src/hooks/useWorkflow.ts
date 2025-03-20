import { useMutation } from '@tanstack/react-query';
import { workflowApi } from '@/services/api';

export function useWorkflow() {
    const runWorkflowMutation = useMutation({
        mutationFn: workflowApi.runWorkflow,
        onSuccess: () => {
            console.log('工作流保存成功');
        },
        onError: (error) => {
            console.error('保存工作流时出错：', error);
        }
    });

    return {
        runWorkflow: runWorkflowMutation.mutate,
        isRunning: runWorkflowMutation.isPending,
        error: runWorkflowMutation.error
    };
} 