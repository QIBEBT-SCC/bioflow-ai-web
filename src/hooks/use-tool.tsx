import {toolApi} from '@/services/api';
import {useMutation, useQuery, useQueryClient, UseQueryOptions} from "@tanstack/react-query";
import {type DockerToolCreate, type SimpleToolInfo, type ToolInfo, type ToolTag, type ToolGroup} from "@/types/tool.tsx";
import {ToolArgPublic} from "@/types/node.tsx";

export function useToolTagList() {
    const options: UseQueryOptions<ToolTag[], Error> = {
        queryKey: ['toolTagList'],
        queryFn: toolApi.getTagList,
    };

    return useQuery(options);
}

export function useToolGroupList() {
    const options: UseQueryOptions<ToolGroup[], Error> = {
        queryKey: ['toolGroupList'],
        queryFn: toolApi.getGroupList,
    };

    return useQuery(options);
}

export function useGroupTools({parent_id}: { parent_id?: number }) {
    const options: UseQueryOptions<SimpleToolInfo[], Error> = {
        queryKey: ['groupTools', parent_id],
        queryFn: ({queryKey}) => {
            const [, parent_id] = queryKey as [string, number | undefined];
            return toolApi.getGroupTools(parent_id);
        },
    };

    return useQuery(options);
}

export function useSearchTools({name, offset}: { name: string, offset?: number }) {
    const options: UseQueryOptions<SimpleToolInfo[], Error> = {
        queryKey: ['searchTools', name, offset],
        queryFn: ({queryKey}) => {
            const [, name, offset] = queryKey as [string, string, number | undefined];
            return toolApi.searchToolList(name, offset);
        },
        enabled: !!name,
    }

    return useQuery(options);
}

export function useCreateTool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({tool}: { tool: DockerToolCreate }) => toolApi.newTool(tool),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['allTools']}).then();
            queryClient.invalidateQueries({queryKey: ['groupTools']}).then();
            queryClient.invalidateQueries({queryKey: ['toolTagList']}).then();
            queryClient.invalidateQueries({queryKey: ['searchTools']}).then();
        }
    });
}

export function useToolCount() {
    const options: UseQueryOptions<number, Error> = {
        queryKey: ['toolCounts'],
        queryFn: toolApi.getToolCount,
    }

    return useQuery(options);
}

export function useAllTools(offset: number) {
    const options: UseQueryOptions<SimpleToolInfo[], Error> = {
        queryKey: ['allTools',offset],
        queryFn: ({queryKey}) => {
            const [, offset] = queryKey as [string, number];
            return toolApi.getToolList(offset);
        }
    };

    return useQuery(options);
}

export function useTool({id}: { id: string }) {
    const options: UseQueryOptions<ToolInfo, Error> = {
        queryKey: ['tool', id],
        queryFn: ({queryKey}) => {
            const [, id] = queryKey as [string, string];
            return toolApi.getTool(id);
        },
    };

    return useQuery(options);
}

export function useToolArg({id}: { id: string }) {
    const options: UseQueryOptions<ToolArgPublic, Error> = {
        queryKey: ['toolArg', id],
        queryFn: ({queryKey}) => {
            const [, id] = queryKey as [string, string];
            return toolApi.getToolArg(id);
        },
    };

    return useQuery(options);
}