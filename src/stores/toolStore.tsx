import {create} from 'zustand';
import {DefaultArgs} from '@/services/api';

interface ToolStore {
    defaultArgs: DefaultArgs | null;
    setDefaultArgs: (args: DefaultArgs) => void;
}

export const useToolStore = create<ToolStore>((set) => ({
    defaultArgs: null,
    setDefaultArgs: (args) => set({defaultArgs: args}),
})); 