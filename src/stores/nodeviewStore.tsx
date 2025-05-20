import {create} from "zustand";

interface NodeEditorStore {
    currentRunInstanceId: string;
    setCurrentRunInstanceId: (uid: string) => void;
}

export const useNodeEditorStore = create<NodeEditorStore>((set) => ({
    currentRunInstanceId: '',
    setCurrentRunInstanceId: (uid) => set({currentRunInstanceId: uid})
}))