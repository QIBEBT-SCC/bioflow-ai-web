import {useMutation, useQuery, useQueryClient, UseQueryOptions} from "@tanstack/react-query";
import {resourceApi} from "@/services/api.tsx";
import {BioDb, BioDbCreate, BioDbSimple} from "@/types/resource.tsx";

export function useCreateBd() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({db}: { db: BioDbCreate }) => resourceApi.newDb(db),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['dbList']}).then();
            queryClient.invalidateQueries({queryKey: ['db']}).then();
            queryClient.invalidateQueries({queryKey: ['dbCounts']}).then();
        }
    });
}

export function useDBList(offset: number, enabled: boolean = true) {
    const options: UseQueryOptions<BioDbSimple[], Error> = {
        queryKey: ['dbList', offset],
        queryFn: ({queryKey}) => {
            const [, offset] = queryKey as [string, number];
            return resourceApi.getDBList(offset);
        },
        enabled
    }

    return useQuery(options)
}

export function useDBCount() {
    const options: UseQueryOptions<number, Error> = {
        queryKey: ['dbCounts'],
        queryFn: resourceApi.getDBCount,
    }

    return useQuery(options);
}

export function useDB(id: number) {
    const options: UseQueryOptions<BioDb, Error> = {
        queryKey: ['db', id],
        queryFn: ({queryKey}) => {
            const [, id] = queryKey as [string, number];
            return resourceApi.getDB(id);
        },
        enabled: !!id
    }

    return useQuery(options)
}

export function useDeleteDB() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id}: { id: number }) => resourceApi.deleteDB(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['dbList']}).then();
            queryClient.invalidateQueries({queryKey: ['db']}).then();
            queryClient.invalidateQueries({queryKey: ['dbCounts']}).then();
        }
    });
}

export function useSearchDB(name: string) {
    const options: UseQueryOptions<BioDb[], Error> = {
        queryKey: ['dbSearch', name],
        queryFn: ({queryKey}) => {
            const [, name] = queryKey as [string, string];
            return resourceApi.searchDB(name);
        },
        enabled: !!name
    }

    return useQuery(options);
}