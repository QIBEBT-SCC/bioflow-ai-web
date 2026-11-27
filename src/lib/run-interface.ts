import type { Edge } from '@xyflow/react'
import { interfaceView } from '@/lib/subgraph-interface'
import type {
  InterfaceInput,
  WorkflowDefinition,
  WorkflowInterface,
  WorkflowNode,
} from '@/types/workflow'
import type { NodeRunDataV2, WorkflowRunV2 } from '@/types/workflow-v2'

function parseForeachIndex(id: string): number | null {
  const match = /^@foreach\/input\/(\d+)$/.exec(id)
  return match ? Number(match[1]) : null
}

function formatPortDescription(
  description: string | undefined,
  boundPath: unknown,
): string {
  const base = description ?? ''
  if (typeof boundPath === 'string' && boundPath) {
    if (!base) return boundPath
    if (!base.includes(boundPath)) return `${base}\n${boundPath}`
  }
  return base
}

/** Find the original input port definitions on a parent subgraph/foreach node by its run UID. */
export function findParentSubgraphInputs(
  nodes: WorkflowNode[],
  parentNodeUid: string,
): InterfaceInput[] | undefined {
  for (const node of nodes) {
    if (node.type !== 'subgraph' && node.type !== 'foreach') continue
    const workflow = node.data?.workflow as WorkflowDefinition | undefined
    if (
      (node.data?.run_data as NodeRunDataV2 | undefined)?.uid === parentNodeUid
    ) {
      return workflow?.interface?.inputs
    }
    if (workflow?.nodes.length) {
      const nested = findParentSubgraphInputs(workflow.nodes, parentNodeUid)
      if (nested) return nested
    }
  }
  return undefined
}

/** Project the saved boundary (or runtime ForEach inputs) onto a single consolidated interface view. */
export function runInterfaceView(
  run: WorkflowRunV2,
  fallbackInputs?: InterfaceInput[],
): {
  nodes: WorkflowNode[]
  edges: Edge[]
} {
  const frozenNodes = run.nodes
    .filter((node) => node.type === 'resource_frozen_path')
    .sort((a, b) => {
      const ia = parseForeachIndex(a.id) ?? Number.MAX_SAFE_INTEGER
      const ib = parseForeachIndex(b.id) ?? Number.MAX_SAFE_INTEGER
      return ia - ib
    })

  if (!run.interface && frozenNodes.length === 0) {
    return { nodes: run.nodes, edges: run.edges }
  }

  const frozenById = new Map<string, WorkflowNode>()
  const frozenByIndex = new Map<number, WorkflowNode>()
  for (const [listIndex, node] of frozenNodes.entries()) {
    frozenById.set(node.id, node)
    const parsedIndex = parseForeachIndex(node.id)
    frozenByIndex.set(parsedIndex ?? listIndex, node)
  }

  const nodeById = new Map(run.nodes.map((node) => [node.id, node]))
  const edgesBySource = new Map<string, Edge[]>()
  for (const edge of run.edges) {
    if (!frozenById.has(edge.source)) continue
    const list = edgesBySource.get(edge.source)
    if (list) list.push(edge)
    else edgesBySource.set(edge.source, [edge])
  }

  const nodes = run.nodes.filter((node) => !frozenById.has(node.id))
  const edges = run.edges.filter(
    (edge) => !frozenById.has(edge.source) && !frozenById.has(edge.target),
  )

  const boundSources = new Map<string, NodeRunDataV2 | undefined>()
  let effectiveInputs: InterfaceInput[]

  if (run.interface && run.interface.inputs.length > 0) {
    effectiveInputs = run.interface.inputs.map((port, index) => {
      const source =
        frozenById.get(`@foreach/input/${index}`) ?? frozenByIndex.get(index)
      if (source) {
        boundSources.set(
          port.id,
          source.data.run_data as NodeRunDataV2 | undefined,
        )
      }
      return {
        ...port,
        description: formatPortDescription(port.description, source?.data.path),
      }
    })
  } else if (frozenNodes.length > 0) {
    const usedNames = new Set<string>()
    effectiveInputs = frozenNodes.map((source, listIndex) => {
      const index = parseForeachIndex(source.id) ?? listIndex
      const fallback = fallbackInputs?.[index]
      const outgoing = edgesBySource.get(source.id) ?? []
      const targets = outgoing.flatMap((edge) => {
        const prefix = `${edge.target}-in-`
        const handle = edge.targetHandle?.startsWith(prefix)
          ? edge.targetHandle.slice(prefix.length)
          : (edge.targetHandle ?? '')
        return handle ? [{ node_id: edge.target, handle }] : []
      })
      const firstTarget = targets[0]
      let inferredHandleName = ''
      if (firstTarget) {
        const targetNode = nodeById.get(firstTarget.node_id)
        if (targetNode?.type === 'subgraph' || targetNode?.type === 'foreach') {
          const nested = targetNode.data.workflow as
            | WorkflowDefinition
            | undefined
          inferredHandleName =
            nested?.interface?.inputs.find((p) => p.id === firstTarget.handle)
              ?.name ?? firstTarget.handle
        } else {
          inferredHandleName = firstTarget.handle
        }
      }
      const rawName =
        fallback?.name?.trim() ||
        (typeof source.data.port_name === 'string' &&
          source.data.port_name.trim()) ||
        (typeof source.data.name === 'string' && source.data.name.trim()) ||
        inferredHandleName ||
        `input_${index + 1}`
      let uniqueName = rawName
      let suffix = 2
      while (usedNames.has(uniqueName)) {
        uniqueName = `${rawName} ${suffix++}`
      }
      usedNames.add(uniqueName)
      const id = `foreach-input-${index}`
      boundSources.set(id, source.data.run_data as NodeRunDataV2 | undefined)
      return {
        id,
        name: uniqueName,
        description: formatPortDescription(
          fallback?.description,
          source.data.path,
        ),
        targets,
      }
    })
  } else {
    effectiveInputs = []
  }

  const effectiveInterface: WorkflowInterface = {
    ...(run.interface?.positions ? { positions: run.interface.positions } : {}),
    inputs: effectiveInputs,
    outputs: run.interface?.outputs ?? [],
  }

  const view = interfaceView({ nodes, edges, interface: effectiveInterface })
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
