import {create} from 'zustand';
import type {Tag} from '@/types/project';

interface TagStore {
    tags: Tag[];
    setTags: (tags: Tag[]) => void;
}

export const useTagStore = create<TagStore>((set) => ({
    tags: [],
    setTags: (tags) => set({tags}),
})); 