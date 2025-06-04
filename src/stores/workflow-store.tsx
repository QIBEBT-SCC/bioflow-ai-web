import {create} from 'zustand';


interface WorkflowStore {
    refreshInterval: string;
    setRefreshInterval: (time: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
    refreshInterval: "off",
    setRefreshInterval: (time) => set({refreshInterval: time}),
}))