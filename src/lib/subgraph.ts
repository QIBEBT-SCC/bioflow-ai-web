import type { Node } from '@xyflow/react'
import { generateLetterId } from '@/lib/id-generator'
import type { WorkflowDefinition, WorkflowInterface } from '@/types/workflow'

export const emptyInterface = (): WorkflowInterface => ({
  inputs: [],
  outputs: [],
})
export const graphNodes = (graph: WorkflowDefinition): Node[] =>
  graph.nodes.map((node) => ({
    ...node,
    position: node.position ?? { x: 0, y: 0 },
    dragHandle: node.dragHandle ?? '.nodeDragable',
    zIndex: node.zIndex ?? 20,
  }))

export function cleanGraph(graph: WorkflowDefinition): WorkflowDefinition {
  return {
    ...graph,
    interface: graph.interface
      ? {
          ...(graph.interface.positions
            ? { positions: graph.interface.positions }
            : {}),
          inputs: graph.interface.inputs,
          outputs: graph.interface.outputs,
        }
      : graph.interface,
    nodes: graph.nodes.map((node) => {
      const { run_data: _run, ...data } = node.data
      if (node.type === 'subgraph')
        data.workflow = cleanGraph(data.workflow as WorkflowDefinition)
      const { selected: _selected, measured: _measured, ...definition } = node
      return {
        ...definition,
        data,
        dragHandle: node.dragHandle ?? '.nodeDragable',
        zIndex: node.zIndex ?? 20,
      }
    }),
  }
}

export function makeSubgraph(
  graph: WorkflowDefinition,
  name: string,
  sourceUid?: string,
): Node {
  return {
    id: generateLetterId(),
    type: 'subgraph',
    position: { x: 100, y: 100 },
    dragHandle: '.nodeDragable',
    zIndex: 20,
    data: {
      name,
      source_uid: sourceUid,
      workflow: structuredClone(cleanGraph(graph)),
    },
  }
}

export function groupSelection(graph: WorkflowDefinition): WorkflowDefinition {
  const selected = new Set(
    graph.nodes.filter((node) => node.selected).map((node) => node.id),
  )
  if (!selected.size) return graph
  const inside = graph.nodes.filter((node) => selected.has(node.id))
  const boundary = emptyInterface()
  const group = makeSubgraph(
    {
      nodes: inside,
      edges: graph.edges.filter(
        (edge) => selected.has(edge.source) && selected.has(edge.target),
      ),
      interface: boundary,
    },
    'Subgraph',
  )
  const edges = graph.edges.flatMap((edge) => {
    const sourceIn = selected.has(edge.source),
      targetIn = selected.has(edge.target)
    if (sourceIn && targetIn) return []
    if (!sourceIn && !targetIn) return [edge]
    if (targetIn) {
      const handle = (edge.targetHandle ?? '').slice(
        `${edge.target}-in-`.length,
      )
      let port = boundary.inputs.find(
        (port) =>
          port.targets[0].node_id === edge.target &&
          port.targets[0].handle === handle,
      )
      if (!port) {
        port = {
          id: generateLetterId(),
          name: handle,
          targets: [{ node_id: edge.target, handle }],
        }
        boundary.inputs.push(port)
      }
      return [
        {
          ...edge,
          target: group.id,
          targetHandle: `${group.id}-in-${port.id}`,
        },
      ]
    }
    const handle = (edge.sourceHandle ?? '').slice(`${edge.source}-out-`.length)
    let port = boundary.outputs.find(
      (port) =>
        port.source.node_id === edge.source && port.source.handle === handle,
    )
    if (!port) {
      port = {
        id: generateLetterId(),
        name: handle,
        source: { node_id: edge.source, handle },
      }
      boundary.outputs.push(port)
    }
    return [
      { ...edge, source: group.id, sourceHandle: `${group.id}-out-${port.id}` },
    ]
  })
  // makeSubgraph clones: install the final boundary assembled above.
  ;(group.data.workflow as WorkflowDefinition).interface = boundary
  group.position = inside[0].position ?? group.position
  // Existing interfaces of this level must follow nodes into the new group.
  const iface = graph.interface ? structuredClone(graph.interface) : null
  if (iface) {
    for (const input of iface.inputs)
      input.targets = input.targets.map((target) => {
        if (!selected.has(target.node_id)) return target
        let port = boundary.inputs.find(
          (port) =>
            port.targets.length === 1 &&
            port.targets[0].node_id === target.node_id &&
            port.targets[0].handle === target.handle,
        )
        if (!port) {
          port = { id: generateLetterId(), name: input.name, targets: [target] }
          boundary.inputs.push(port)
        }
        return { node_id: group.id, handle: port.id }
      })
    for (const output of iface.outputs)
      if (selected.has(output.source.node_id)) {
        let port = boundary.outputs.find(
          (port) =>
            port.source.node_id === output.source.node_id &&
            port.source.handle === output.source.handle,
        )
        if (!port) {
          port = {
            id: generateLetterId(),
            name: output.name,
            source: output.source,
          }
          boundary.outputs.push(port)
        }
        output.source = { node_id: group.id, handle: port.id }
      }
  }
  return {
    ...graph,
    interface: iface,
    nodes: [...graph.nodes.filter((node) => !selected.has(node.id)), group],
    edges,
  }
}
