import {create} from 'zustand';

interface ToolNodeStore {
    currentGroupId?: number;
    setCurrentGroupId: (id?: number) => void;
}

export const useToolNodeStore = create<ToolNodeStore>((set) => ({
    currentGroupId: undefined,
    setCurrentGroupId: (id) => set({currentGroupId: id}),
}))