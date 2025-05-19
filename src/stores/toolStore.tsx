import {create} from 'zustand';
import {DefaultArgs} from '@/services/api';

interface ToolStore {
    defaultArgs: DefaultArgs;
    setDefaultArgs: (args: DefaultArgs) => void;
}

export const useToolStore = create<ToolStore>((set) => ({
    defaultArgs: {},
    setDefaultArgs: (args) => set({defaultArgs: args}),
}));

interface ToolNodeStore {
    currentGroupId?: number;
    setCurrentGroupId: (id?: number) => void;
}

export const useToolNodeStore = create<ToolNodeStore>((set) => ({
    currentGroupId: undefined,
    setCurrentGroupId: (id) => set({currentGroupId: id}),
}))