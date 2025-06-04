import {create} from 'zustand';


interface TaskStore {
    timeRange: string;
    refreshInterval: string;
    setTimeRange: (time: string) => void;
    setRefreshInterval: (time: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
    timeRange: "12",
    refreshInterval: "off",
    setTimeRange: (time) => set({timeRange: time}),
    setRefreshInterval: (time) => set({refreshInterval: time}),
}))