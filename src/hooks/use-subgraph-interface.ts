'use client'

import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { clientFetch } from '@/lib/api-client'
import {
  connectInterface,
  disconnectInterface,
  interfaceView,
} from '@/lib/subgraph-interface'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import type { ToolArgPublic } from '@/types/node'
import { ToolType } from '@/types/tool'
import type { WorkflowDefinition } from '@/types/workflow'

// Node types whose input handles accept several incoming edges.
const MULTI_INPUT_NODE_TYPES = new Set(['collect_mount_dirs'])

/** Whether a new edge at this level could break pass-through topology (subgraphs may hide pass-through Tools). */
function mayAffectPassthrough(nodes: Node[], queryClient: QueryClient) {
  return nodes.some(
    (node) =>
      node.type === 'subgraph' ||
      (node.type === 'tool' &&
        queryClient.getQueryData<ToolArgPublic>(['toolArg', node.data.tool_uid])
          ?.tool_type === ToolType.DOCKER_PASSTHROUGH),
  )
}

/** Ask the workflow validator for the first pass-through violation in a whole graph. */
async function passthroughIssue(graph: WorkflowDefinition) {
  const { diagnostics } = await clientFetch<{
    diagnostics: { code: string; message: string }[]
  }>('/workflows/validate', {
    method: 'POST',
    body: JSON.stringify({ graph }),
  })
  return diagnostics.find((d) => d.code.startsWith('passthrough.'))?.message
}

export function useSubgraphInterface() {
  const t = useTranslations('editor.subgraph')
  const store = useNodeEditorStore()
  const queryClient = useQueryClient()
  const view = interfaceView(store.getGraph())
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const isBoundary = (id: string) => id === view.inputId || id === view.outputId
  const isValidConnection = (connection: Connection | Edge) => {
    const source = store.nodes.find((node) => node.id === connection.source)
    const target = store.nodes.find((node) => node.id === connection.target)
    if (source?.type === 'collect_file_collection') {
      if (
        target?.type !== 'subgraph' ||
        connection.sourceHandle !== `${source.id}-out-collection` ||
        store.edges.some(
          (edge) =>
            edge.source === source.id ||
            (edge.target === target.id &&
              store.nodes.some(
                (node) =>
                  node.id === edge.source &&
                  node.type === 'collect_file_collection',
              )),
        )
      )
        return false
    }
    const multiInput = MULTI_INPUT_NODE_TYPES.has(target?.type ?? '')
    if (
      !multiInput &&
      store.edges.some(
        (edge) =>
          edge.target === connection.target &&
          edge.targetHandle === connection.targetHandle,
      )
    )
      return false
    if (isBoundary(connection.source) || isBoundary(connection.target))
      return (
        connectInterface(store.getGraph(), {
          ...connection,
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
        }) !== null
      )
    // A leaf input cannot be fed by both the parent interface and an internal edge.
    return (
      multiInput ||
      !view.edges.some(
        (edge) =>
          edge.target === connection.target &&
          edge.targetHandle === connection.targetHandle,
      )
    )
  }
  return {
    nodes: [...store.nodes, ...view.nodes],
    edges: view.edges.map((edge) => ({
      ...edge,
      selected: selectedEdges.includes(edge.id),
    })),
    isValidConnection,
    onConnect: async (connection: Connection) => {
      const graph = store.getGraph()
      const iface = connectInterface(graph, connection)
      if (mayAffectPassthrough(store.nodes, queryClient)) {
        const candidate = iface
          ? { ...graph, interface: iface }
          : {
              ...graph,
              edges: [
                ...graph.edges,
                {
                  ...connection,
                  id: `pending-${connection.source}-${connection.target}`,
                },
              ],
            }
        let issue: string | undefined
        try {
          issue = await passthroughIssue(store.getRootGraph(candidate))
        } catch {
          toast.error(t('sharedValidationFailed'))
          return
        }
        if (issue) {
          toast.error(issue)
          return
        }
        // Do not apply stale validation after another edit occurred.
        const latest = store.getGraph()
        if (latest.nodes !== graph.nodes || latest.edges !== graph.edges) return
      }
      if (iface) store.setInterface(iface)
      else if (
        !isBoundary(connection.source) &&
        !isBoundary(connection.target) &&
        isValidConnection(connection)
      ) {
        const source = store.nodes.find((node) => node.id === connection.source)
        if (source?.type === 'collect_file_collection') {
          const obsolete = store.edges.filter(
            (edge) =>
              edge.source === connection.target &&
              edge.sourceHandle !== `${connection.target}-out-results_folder`,
          )
          const exposed =
            store.graphInterface?.outputs.filter(
              (port) =>
                port.source.node_id === connection.target &&
                port.source.handle !== 'results_folder',
            ) ?? []
          if (obsolete.length || exposed.length) {
            store.setEdges((edges) =>
              edges.filter(
                (edge) => !obsolete.some((old) => old.id === edge.id),
              ),
            )
            if (store.graphInterface)
              store.setInterface({
                ...store.graphInterface,
                outputs: store.graphInterface.outputs.filter(
                  (port) => !exposed.includes(port),
                ),
              })
            toast.info(t('batch_reconnect'))
          }
        }
        store.onConnect(connection)
      }
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
