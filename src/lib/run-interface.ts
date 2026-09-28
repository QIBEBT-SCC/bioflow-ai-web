import type { Edge } from '@xyflow/react'
import { interfaceView } from '@/lib/subgraph-interface'
import type { WorkflowNode } from '@/types/workflow'
import type { NodeRunDataV2, WorkflowRunV2 } from '@/types/workflow-v2'

/** Project the saved boundary onto a run without changing its execution graph. */
export function runInterfaceView(run: WorkflowRunV2): {
  nodes: WorkflowNode[]
  edges: Edge[]
} {
  if (!run.interface) return { nodes: run.nodes, edges: run.edges }

  const boundSources = new Map<string, NodeRunDataV2 | undefined>()
  for (const [index, port] of run.interface.inputs.entries()) {
    const source = run.nodes.find(
      (node) =>
        node.id === `@foreach/input/${index}` &&
        node.type === 'resource_frozen_path',
    )
    if (source)
      boundSources.set(
        port.id,
        source.data.run_data as NodeRunDataV2 | undefined,
      )
  }

  const sourceIds = new Set(
    run.interface.inputs
      .map((_, index) => `@foreach/input/${index}`)
      .filter((id) =>
        run.nodes.some(
          (node) => node.id === id && node.type === 'resource_frozen_path',
        ),
      ),
  )
  const nodes = run.nodes.filter((node) => !sourceIds.has(node.id))
  const edges = run.edges.filter(
    (edge) => !sourceIds.has(edge.source) && !sourceIds.has(edge.target),
  )
  const view = interfaceView({ nodes, edges, interface: run.interface })
  return {
    nodes: [...nodes, ...view.nodes],
    edges: [
      ...edges,
      ...view.edges.map((edge) => {
        if (edge.data?.interfaceKind !== 'inputs') return edge
        const runData = boundSources.get(String(edge.data.portId))
        return runData
          ? { ...edge, data: { ...edge.data, run_data: runData } }
          : edge
      }),
    ],
  }
}
