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
            queryClient.invalidateQueries({queryKey: ['tools']}).then();
        }
    });
}

export function useAllTools() {
    const options: UseQueryOptions<SimpleToolInfo[], Error> = {
        queryKey: ['allTools'],
        queryFn: toolApi.getToolList,
    };

    return useQuery(options);
}

export function useTool({uid}: { uid: string }) {
    const options: UseQueryOptions<ToolInfo, Error> = {
        queryKey: ['tool', uid],
        queryFn: ({queryKey}) => {
            const [, uid] = queryKey as [string, string];
            return toolApi.getTool(uid);
        },
    };

    return useQuery(options);
}

export function useToolArg({uid}: { uid: string }) {
    const options: UseQueryOptions<ToolArgPublic, Error> = {
        queryKey: ['toolArg', uid],
        queryFn: ({queryKey}) => {
            const [, uid] = queryKey as [string, string];
            return toolApi.getToolArg(uid);
        },
    };

    return useQuery(options);
}