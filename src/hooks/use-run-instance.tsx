import {useQuery, UseQueryOptions} from "@tanstack/react-query";
import {runInstanceApi} from "@/services/api.tsx";
import {RunPublic, Stats} from "@/types/run.tsx";

export function useRunStats() {
    const options: UseQueryOptions<Stats, Error> = {
        queryKey: ['runStats'],
        queryFn: runInstanceApi.getRunStats,
    }

    return useQuery(options)
}

export function useRunCount() {
    const options: UseQueryOptions<number, Error> = {
        queryKey: ['runCount'],
        queryFn: runInstanceApi.getRunCount,
    }

    return useQuery(options)
}

export function useRunList(offset: number) {
    const options: UseQueryOptions<RunPublic[], Error> = {
        queryKey: ['runs', offset],
        queryFn: ({queryKey}) => {
            const [, offset] = queryKey as [string, number];
            return runInstanceApi.getRunList(offset);
        }
    }

    return useQuery(options)
}