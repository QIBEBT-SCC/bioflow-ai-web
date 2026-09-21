import type { Connection, Edge, Node } from '@xyflow/react'
import { layoutWorkflowNodes } from '@/lib/workflow-layout'
import type {
  PortTarget,
  WorkflowDefinition,
  WorkflowInterface,
} from '@/types/workflow'

// These nodes and edges are a view of interface mappings, never workflow tasks.
export function interfaceView(graph: WorkflowDefinition) {
  const ids = new Set(graph.nodes.map((node) => node.id))
  const unique = (name: string) => {
    let id = `@interface/${name}`
    while (ids.has(id)) id += '_'
    ids.add(id)
    return id
  }
  const inputId = unique('inputs'),
    outputId = unique('outputs')
  const iface = graph.interface
  if (!iface)
    return { nodes: [] as Node[], edges: [] as Edge[], inputId, outputId }
  const xs = graph.nodes.map((node) => node.position?.x ?? 0)
  const ys = graph.nodes.map((node) => node.position?.y ?? 0)
  const y = Math.min(0, ...ys)
  const nodes: Node[] = [
    {
      id: inputId,
      position: iface.positions?.inputs ?? { x: Math.min(0, ...xs) - 440, y },
      data: { kind: 'inputs', ports: iface.inputs },
    },
    {
      id: outputId,
      position: iface.positions?.outputs ?? {
        x:
          Math.max(
            0,
            ...graph.nodes.map(
              (node) => (node.position?.x ?? 0) + (node.measured?.width ?? 350),
            ),
          ) + 100,
        y,
      },
      data: { kind: 'outputs', ports: iface.outputs },
    },
  ].map((node) => ({
    ...node,
    type: 'subgraph_interface',
    width: 300,
    height: Math.max(150, 70 + node.data.ports.length * 24),
    measured: {
      width: 300,
      height: Math.max(150, 70 + node.data.ports.length * 24),
    },
    draggable: false,
    deletable: false,
    selectable: false,
  }))
  const edges: Edge[] = []
  const edgeIds = new Set(graph.edges.map((edge) => edge.id))
  const add = (
    port: string,
    target: PortTarget,
    kind: 'inputs' | 'outputs',
  ) => {
    if (!target.node_id || !target.handle) return
    let id = JSON.stringify([
      '@interface',
      kind,
      port,
      target.node_id,
      target.handle,
    ])
    while (edgeIds.has(id)) id += '_'
    edgeIds.add(id)
    edges.push({
      id,
      source: kind === 'inputs' ? inputId : target.node_id,
      sourceHandle:
        kind === 'inputs' ? port : `${target.node_id}-out-${target.handle}`,
      target: kind === 'inputs' ? target.node_id : outputId,
      targetHandle:
        kind === 'inputs' ? `${target.node_id}-in-${target.handle}` : port,
      data: { interfaceKind: kind, portId: port, binding: target },
    })
  }
  for (const port of iface.inputs)
    for (const target of port.targets) add(port.id, target, 'inputs')
  for (const port of iface.outputs) add(port.id, port.source, 'outputs')
  return { nodes, edges, inputId, outputId }
}

export function connectInterface(
  graph: WorkflowDefinition,
  connection: Connection,
): WorkflowInterface | null {
  const iface = graph.interface
  if (!iface) return null
  const { inputId, outputId } = interfaceView(graph)
  const { source, target, sourceHandle, targetHandle } = connection
  if (source === inputId && target !== outputId) {
    const prefix = `${target}-in-`
    if (
      !iface.inputs.some((port) => port.id === sourceHandle) ||
      !targetHandle?.startsWith(prefix) ||
      !graph.nodes.some((node) => node.id === target)
    )
      return null
    const binding = {
      node_id: target,
      handle: targetHandle.slice(prefix.length),
    }
    if (
      !binding.handle ||
      graph.edges.some(
        (edge) => edge.target === target && edge.targetHandle === targetHandle,
      ) ||
      iface.inputs.some((port) =>
        port.targets.some(
          (item) => item.node_id === target && item.handle === binding.handle,
        ),
      )
    )
      return null
    return {
      ...iface,
      inputs: iface.inputs.map((port) =>
        port.id === sourceHandle
          ? { ...port, targets: [...port.targets, binding] }
          : port,
      ),
    }
  }
  if (target === outputId && source !== inputId) {
    const prefix = `${source}-out-`
    if (
      !iface.outputs.some((port) => port.id === targetHandle) ||
      !sourceHandle?.startsWith(prefix) ||
      !graph.nodes.some((node) => node.id === source)
    )
      return null
    const binding = {
      node_id: source,
      handle: sourceHandle.slice(prefix.length),
    }
    if (!binding.handle) return null
    return {
      ...iface,
      outputs: iface.outputs.map((port) =>
        port.id === targetHandle ? { ...port, source: binding } : port,
      ),
    }
  }
  return null
}

export function disconnectInterface(
  iface: WorkflowInterface,
  removed: Edge[],
): WorkflowInterface {
  return {
    ...iface,
    inputs: iface.inputs.map((port) => ({
      ...port,
      targets: port.targets.filter(
        (target) =>
          !removed.some(
            (edge) =>
              edge.data?.interfaceKind === 'inputs' &&
              edge.data.portId === port.id &&
              JSON.stringify(edge.data.binding) === JSON.stringify(target),
          ),
      ),
    })),
    outputs: iface.outputs.map((port) =>
      removed.some(
        (edge) =>
          edge.data?.interfaceKind === 'outputs' &&
          edge.data.portId === port.id,
      )
        ? { ...port, source: { node_id: '', handle: '' } }
        : port,
    ),
  }
}

/** Layout boundary projections with ordinary nodes, retaining only their positions. */
export function layoutSubgraph(graph: WorkflowDefinition) {
  const view = interfaceView(graph)
  const nodes = layoutWorkflowNodes(
    [
      ...graph.nodes.map((node) => ({
        ...node,
        position: node.position ?? { x: 0, y: 0 },
      })),
      ...view.nodes,
    ],
    [...graph.edges, ...view.edges],
  )
  const input = nodes.find((node) => node.id === view.inputId)
  const output = nodes.find((node) => node.id === view.outputId)
  return {
    nodes: nodes.filter(
      (node) => node.id !== view.inputId && node.id !== view.outputId,
    ),
    interface:
      graph.interface && input && output
        ? {
            ...graph.interface,
            positions: { inputs: input.position, outputs: output.position },
          }
        : graph.interface,
  }
}
