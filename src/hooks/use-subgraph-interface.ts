'use client'

import type { Connection, Edge, EdgeChange, NodeChange } from '@xyflow/react'
import { useState } from 'react'
import {
  connectInterface,
  disconnectInterface,
  interfaceView,
} from '@/lib/subgraph-interface'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

export function useSubgraphInterface() {
  const store = useNodeEditorStore()
  const view = interfaceView(store.getGraph())
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const isBoundary = (id: string) => id === view.inputId || id === view.outputId
  const isValidConnection = (connection: Connection | Edge) => {
    if (isBoundary(connection.source) || isBoundary(connection.target))
      return (
        connectInterface(store.getGraph(), {
          ...connection,
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
        }) !== null
      )
    // A leaf input cannot be fed by both the parent interface and an internal edge.
    return !view.edges.some(
      (edge) =>
        edge.target === connection.target &&
        edge.targetHandle === connection.targetHandle,
    )
  }
  return {
    nodes: [...store.nodes, ...view.nodes],
    edges: view.edges.map((edge) => ({
      ...edge,
      selected: selectedEdges.includes(edge.id),
    })),
    isValidConnection,
    onConnect: (connection: Connection) => {
      const iface = connectInterface(store.getGraph(), connection)
      if (iface) store.setInterface(iface)
      else if (
        !isBoundary(connection.source) &&
        !isBoundary(connection.target) &&
        isValidConnection(connection)
      )
        store.onConnect(connection)
    },
    onNodesChange: (changes: NodeChange[]) =>
      store.onNodesChange(
        changes.filter((change) =>
          'id' in change ? !isBoundary(change.id) : true,
        ),
      ),
    onEdgesChange: (changes: EdgeChange[]) => {
      const virtualIds = new Set(view.edges.map((edge) => edge.id))
      const removed = view.edges.filter((edge) =>
        changes.some(
          (change) => change.type === 'remove' && change.id === edge.id,
        ),
      )
      if (removed.length && store.graphInterface)
        store.setInterface(disconnectInterface(store.graphInterface, removed))
      setSelectedEdges((current) => {
        const selected = new Set(current)
        for (const change of changes) {
          if (change.type === 'select' && virtualIds.has(change.id)) {
            if (change.selected) selected.add(change.id)
            else selected.delete(change.id)
          }
          if (change.type === 'remove') selected.delete(change.id)
        }
        return [...selected]
      })
      store.onEdgesChange(
        changes.filter((change) =>
          'id' in change ? !virtualIds.has(change.id) : true,
        ),
      )
    },
  }
}
