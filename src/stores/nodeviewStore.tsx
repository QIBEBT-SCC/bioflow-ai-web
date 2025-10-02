import {
    type Edge,
    type Node,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
} from '@xyflow/react';
import {addEdge, applyNodeChanges, applyEdgeChanges} from '@xyflow/react';
import {devtools} from "zustand/middleware";
import {create} from "zustand";

export interface NodeEditorStore {
    currentWorkflowUid: string;
    setCurrentWorkflowUid: (uid: string) => void;

    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes:Node[]) => void;
    setEdges: (edges:Edge[]) => void;
}

export const useNodeEditorStore = create<NodeEditorStore>()(
    devtools((set, get) => ({
            currentWorkflowUid: "",
            setCurrentWorkflowUid: (uid) => set({currentWorkflowUid: uid}),

            nodes: [],
            edges: [],
            onNodesChange: (changes) => {
                set({
                    nodes: applyNodeChanges(changes, get().nodes),
                });
            },
            onEdgesChange: (changes) => {
                set({
                    edges: applyEdgeChanges(changes, get().edges),
                });
            },
            onConnect: (connection) => {
                set({
                    edges: addEdge(connection, get().edges),
                });
            },
            setNodes: (nodes) => {
                set({ nodes });
            },
            setEdges: (edges) => {
                set({ edges });
            },
        }),
        {name: 'node-store'}
    )
);