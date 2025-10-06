'use client'

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface NodeEditorStore {
  currentWorkflowUid: string
  setCurrentWorkflowUid: (uid: string) => void

  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
}

export const useNodeEditorStore = create<NodeEditorStore>()(
  devtools(
    (set, get) => ({
      currentWorkflowUid: '',
      setCurrentWorkflowUid: (uid) => set({ currentWorkflowUid: uid }),

      nodes: [],
      edges: [],
      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        })
      },
      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        })
      },
      onConnect: (connection) => {
        set({
          edges: addEdge(connection, get().edges),
        })
      },
      setNodes: (nodes) => {
        set({ nodes })
      },
      setEdges: (edges) => {
        set({ edges })
      },
    }),
    { name: 'node-store' },
  ),
)
