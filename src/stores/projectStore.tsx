import {create} from 'zustand';
import type {Project, Tag} from '@/types/project';

interface TagStore {
    tags: Tag[];
    setTags: (tags: Tag[]) => void;
}

export const useTagStore = create<TagStore>((set) => ({
    tags: [],
    setTags: (tags) => set({tags}),
}));

interface ProjectsStore {
    projects: Project[];
    starredProjects: Project[];
    myProjects: Project[];
    setProjects: (projects: Project[]) => void;
    setStarredProjects: (projects: Project[]) => void;
    setMyProjects: (projects: Project[]) => void;
}

export const useProjectStore = create<ProjectsStore>((set) => ({
    projects: [],
    starredProjects: [],
    myProjects: [],
    setProjects: (projects) => set({projects: projects}),
    setStarredProjects: (projects) => set({starredProjects: projects}),
    setMyProjects: (projects) => set({myProjects: projects}),
}))