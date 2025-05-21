import {useMutation, useQuery, useQueryClient, UseQueryOptions} from "@tanstack/react-query";
import {projectApi} from "@/services/api.tsx";
import {Project, ProjectCreateProp, ProjectTag} from "@/types/project.tsx";

export function useCreateTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({name, color}: { name: string, color: string }) => projectApi.newTag(name, color),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['tagList']}).then();
        }
    });
}

export function useTagList() {
    const options: UseQueryOptions<ProjectTag[], Error> = {
        queryKey: ['tagList'],
        queryFn: projectApi.getTagList,
    };

    return useQuery(options);
}


export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({project}: { project: ProjectCreateProp }) => projectApi.newProject(project),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['allProjects']}).then();
            queryClient.invalidateQueries({queryKey: ['allStarredProjects']}).then();
            queryClient.invalidateQueries({queryKey: ['allMyProjects']}).then();
            queryClient.invalidateQueries({queryKey: ['recentProject']}).then();
        }
    });
}

export function useAllProjects() {
    const options: UseQueryOptions<Project[], Error> = {
        queryKey: ['allProjects'],
        queryFn: projectApi.getProjectList,
    };

    return useQuery(options);
}

export function useStarredProjects() {
    const options: UseQueryOptions<Project[], Error> = {
        queryKey: ['allStarredProjects'],
        queryFn: projectApi.getStarredProjectList,
    };

    return useQuery(options);
}

export function useMyProjects() {
    const options: UseQueryOptions<Project[], Error> = {
        queryKey: ['allMyProjects'],
        queryFn: projectApi.getMyProjectList,
    };

    return useQuery(options);
}

export function useRecentProject() {
    const options: UseQueryOptions<Project, Error> = {
        queryKey: ['recentProject'],
        queryFn: projectApi.getRecentProject,
    };

    return useQuery(options);
}

export function useStarProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, starred}: { id: number, starred: boolean }) => {
            if (starred) {
                return projectApi.unstarProject(`${id}`);
            } else {
                return projectApi.starProject(`${id}`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['allProjects']}).then();
            queryClient.invalidateQueries({queryKey: ['starredProjects']}).then();
            queryClient.invalidateQueries({queryKey: ['myProjects']}).then();
        }
    });
}

export function useProjectDetail(id?: string) {
    const options: UseQueryOptions<Project, Error> = {
        queryKey: ['projectDetail', id],
        queryFn: ({queryKey}) => {
            const [, id] = queryKey as [string, string];
            return projectApi.getProject(id);
        },
        enabled: !!id
    };

    return useQuery(options);
}

