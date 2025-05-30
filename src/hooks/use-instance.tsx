import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import {instanceApi} from "@/services/api.tsx";
import {MonitorRecord, TaskInstance} from "@/types/instance.tsx";

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

export function useTaskList(offset: number) {
    const options: UseQueryOptions<TaskInstance[], Error> = {
        queryKey: ['tasks', offset],
        queryFn: ({queryKey}) => {
            const [, offset] = queryKey as [string, number];
            return instanceApi.getTaskList(offset);
        }
    }

    return useQuery(options)
}

export function useTaskCount() {
    const options: UseQueryOptions<number, Error> = {
        queryKey: ['taskCount'],
        queryFn: instanceApi.getTaskCount,
    }

    return useQuery(options)
}

export function useTaskMonitor(uid: string) {
    const options: UseQueryOptions<MonitorRecord[], Error> = {
        queryKey: ['taskMonitor', uid],
        queryFn: ({queryKey}) => {
            const [, uid] = queryKey as [string, string];
            return instanceApi.getTaskMonitor(uid);
        }
    }

    return useQuery(options)
}