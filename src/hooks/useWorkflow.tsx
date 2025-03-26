import { useMutation } from '@tanstack/react-query';
import { workflowApi } from '@/services/api.tsx';

export function SaveWorkflow() {
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
        saveWorkflow: runWorkflowMutation.mutate,
        isRunning: runWorkflowMutation.isPending,
        error: runWorkflowMutation.error
    };
} 