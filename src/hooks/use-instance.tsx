import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import {instanceApi} from "@/services/api.tsx";
import {TaskInstance} from "@/types/instance.tsx";

export function useRecentTasks(hour: number) {
    const options: UseQueryOptions<TaskInstance[], Error> = {
        queryKey: ['recentTasks', hour],
        queryFn: ({queryKey}) => {
            const [, hour] = queryKey as [string, number];
            return instanceApi.getRecentTasks(hour);
        }
    };

    return useQuery(options);
}