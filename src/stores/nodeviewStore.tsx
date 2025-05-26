import {create} from "zustand";

interface NodeEditorStore {
    currentWorkflowUid: string;
    setCurrentWorkflowUid: (uid: string) => void;
}

export const useNodeEditorStore = create<NodeEditorStore>((set) => ({
    currentWorkflowUid: '',
    setCurrentWorkflowUid: (uid) => set({currentWorkflowUid: uid})
}))