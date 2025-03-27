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