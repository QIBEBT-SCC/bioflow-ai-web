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
import type { SetStateAction } from 'react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { cleanGraph, graphNodes } from '@/lib/subgraph'
import type { WorkflowDefinition, WorkflowInterface } from '@/types/workflow'

interface ParentFrame {
  id: string
  name: string
  graph: WorkflowDefinition
}
export interface NodeEditorStore {
  parents: ParentFrame[]
  graphInterface: WorkflowInterface | null
  setInterface: (value: WorkflowInterface) => void
  getGraph: () => WorkflowDefinition
  getRootGraph: () => WorkflowDefinition
  getActiveSubgraphSourceUid: () => string
  loadGraph: (graph: WorkflowDefinition) => void
  enterSubgraph: (id: string) => void
  leaveSubgraph: () => void

  currentWorkflowUid: string
  setCurrentWorkflowUid: (uid: string) => void

  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  setNodes: (nodes: SetStateAction<Node[]>) => void
  setEdges: (edges: SetStateAction<Edge[]>) => void
}

export const useNodeEditorStore = create<NodeEditorStore>()(
  devtools(
    (set, get) => ({
      parents: [],
      graphInterface: null,
      setInterface: (graphInterface) => set({ graphInterface }),
      getGraph: () => ({
        nodes: get().nodes,
        edges: get().edges,
        interface: get().graphInterface,
      }),
      getRootGraph: () => {
        let graph = get().getGraph()
        for (const frame of [...get().parents].reverse()) {
          graph = {
            ...frame.graph,
            nodes: frame.graph.nodes.map((node) =>
              node.id === frame.id
                ? { ...node, data: { ...node.data, workflow: graph } }
                : node,
            ),
          }
        }
        return cleanGraph(graph)
      },
      getActiveSubgraphSourceUid: () => {
        const frame = get().parents.at(-1)
        const sourceUid = frame?.graph.nodes.find(
          (node) => node.id === frame.id,
        )?.data.source_uid
        return typeof sourceUid === 'string' ? sourceUid : ''
      },
      loadGraph: (graph) =>
        set({
          nodes: graphNodes(graph),
          edges: graph.edges,
          graphInterface: graph.interface ?? null,
          parents: [],
        }),
      enterSubgraph: (id) => {
        const node = get().nodes.find(
          (node) => node.id === id && node.type === 'subgraph',
        )
        if (!node) return
        const graph = node.data.workflow as WorkflowDefinition
        set({
          parents: [
            ...get().parents,
            { id, name: String(node.data.name || id), graph: get().getGraph() },
          ],
          nodes: graphNodes(graph),
          edges: graph.edges,
          graphInterface: graph.interface ?? null,
        })
      },
      leaveSubgraph: () => {
        const frame = get().parents.at(-1)
        if (!frame) return
        const graph = get().getGraph()
        set({
          nodes: graphNodes({
            ...frame.graph,
            nodes: frame.graph.nodes.map((node) =>
              node.id === frame.id
                ? { ...node, data: { ...node.data, workflow: graph } }
                : node,
            ),
          }),
          edges: frame.graph.edges,
          graphInterface: frame.graph.interface ?? null,
          parents: get().parents.slice(0, -1),
        })
      },
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
        set((state) => ({
          nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
        }))
      },
      setEdges: (edges) => {
        set((state) => ({
          edges: typeof edges === 'function' ? edges(state.edges) : edges,
        }))
      },
    }),
    { name: 'node-store' },
  ),
)
