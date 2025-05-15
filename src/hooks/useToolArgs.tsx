import {useEffect} from 'react';
import {toolApi} from '@/services/api';
import {useToolStore} from '@/stores/toolStore.tsx';
import {useMutation, useQuery, useQueryClient, UseQueryOptions} from "@tanstack/react-query";
import {DockerToolCreate, ToolTag} from "@/types/tool.tsx";

export function useToolTagList() {
    const options: UseQueryOptions<ToolTag[], Error> = {
        queryKey: ['toolTagList'],
        queryFn: toolApi.getTagList,
    };

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

export function useToolArgs() {
    const {defaultArgs, setDefaultArgs} = useToolStore();

    useEffect(() => {
        if (Object.keys(defaultArgs).length === 0) {
            toolApi.getDefaultArgs().then(setDefaultArgs);
        }
    }, [defaultArgs, setDefaultArgs]);

    return defaultArgs;
} 