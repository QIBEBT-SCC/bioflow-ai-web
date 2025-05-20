import {useMutation, useQuery, UseQueryOptions} from '@tanstack/react-query';
import {workflowApi} from '@/services/api.tsx';
import {SimpleWorkflowInfo, Workflow} from "@/types/workflow.tsx";

export function useWorkflows({offset}: { offset: number }) {
    const options: UseQueryOptions<SimpleWorkflowInfo[], Error> = {
        queryKey: ['workflows', offset],
        queryFn: () => workflowApi.getWorkflows(offset),
    };

    return useQuery(options);
}


export function useWorkflowCount() {
    const options: UseQueryOptions<number, Error> = {
        queryKey: ['workflowCount'],
        queryFn: workflowApi.getWorkflowCount,
    };

    return useQuery(options);
}

export function useWorkflow({uid}: { uid: string }) {
    const options: UseQueryOptions<Workflow, Error> = {
        queryKey: ['workflow', uid],
        queryFn: () => workflowApi.getWorkflow(uid),
        enabled: !!uid,
    };

    return useQuery(options);
}

export function useSaveWorkflow() {
    return useMutation({
        mutationFn: ({workflow}: { workflow: Workflow }) => workflowApi.saveWorkflow(workflow),
    });
}