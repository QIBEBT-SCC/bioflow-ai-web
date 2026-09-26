import type { Edge } from '@xyflow/react'
import { cleanGraph } from '@/lib/subgraph'
import type {
  WorkflowDefinition,
  WorkflowInterface,
  WorkflowNode,
} from '@/types/workflow'

export const WORKFLOW_JSON_FORMAT = 'bioflow-workflow'
export const WORKFLOW_JSON_VERSION = 1

export type WorkflowImportErrorCode =
  | 'duplicate_node_id'
  | 'invalid_edge'
  | 'invalid_json'
  | 'invalid_node'
  | 'invalid_structure'
  | 'missing_node'
  | 'unsupported_version'

export class WorkflowImportError extends Error {
  readonly code: WorkflowImportErrorCode

  constructor(code: WorkflowImportErrorCode) {
    super(code)
    this.name = 'WorkflowImportError'
    this.code = code
  }
}

export interface ParsedWorkflowJson {
  name?: string
  workflow: WorkflowDefinition
}

interface WorkflowJsonEnvelope {
  format: typeof WORKFLOW_JSON_FORMAT
  version: typeof WORKFLOW_JSON_VERSION
  name?: string
  exported_at: string
  workflow: WorkflowDefinition
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidNode(value: unknown): value is WorkflowNode {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()) {
    return false
  }

  if (
    'type' in value &&
    value.type !== undefined &&
    typeof value.type !== 'string'
  ) {
    return false
  }

  if (!isRecord(value.data)) {
    return false
  }

  if (value.position === undefined || value.position === null) {
    return true
  }

  return (
    isRecord(value.position) &&
    typeof value.position.x === 'number' &&
    Number.isFinite(value.position.x) &&
    typeof value.position.y === 'number' &&
    Number.isFinite(value.position.y)
  )
}

function isValidEdge(value: unknown): value is Edge {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    !!value.id.trim() &&
    typeof value.source === 'string' &&
    !!value.source.trim() &&
    typeof value.target === 'string' &&
    !!value.target.trim()
  )
}

function parseInterface(value: unknown): WorkflowInterface | null {
  if (value == null) return null
  if (
    !isRecord(value) ||
    !Array.isArray(value.inputs) ||
    !Array.isArray(value.outputs)
  )
    throw new WorkflowImportError('invalid_structure')
  const target = (value: unknown) =>
    isRecord(value) &&
    typeof value.node_id === 'string' &&
    !!value.node_id &&
    typeof value.handle === 'string' &&
    !!value.handle
  for (const kind of ['inputs', 'outputs'] as const) {
    const ports = value[kind] as unknown[]
    const ids = new Set<string>()
    for (const port of ports) {
      if (
        !isRecord(port) ||
        typeof port.id !== 'string' ||
        !port.id ||
        ids.has(port.id) ||
        typeof port.name !== 'string' ||
        !port.name.trim() ||
        ('description' in port && typeof port.description !== 'string')
      )
        throw new WorkflowImportError('invalid_structure')
      ids.add(port.id)
      if (
        kind === 'inputs' &&
        (!Array.isArray(port.targets) ||
          !port.targets.length ||
          !port.targets.every(target))
      )
        throw new WorkflowImportError('invalid_structure')
      if (kind === 'outputs' && !target(port.source))
        throw new WorkflowImportError('invalid_structure')
    }
  }
  return {
    inputs: (value.inputs as WorkflowInterface['inputs']).map((port) => ({
      ...port,
      description: port.description ?? '',
    })),
    outputs: (value.outputs as WorkflowInterface['outputs']).map((port) => ({
      ...port,
      description: port.description ?? '',
    })),
    ...(value.positions
      ? { positions: value.positions as WorkflowInterface['positions'] }
      : {}),
  }
}

function parseDefinition(value: unknown, depth = 0): WorkflowDefinition {
  if (depth > 32) throw new WorkflowImportError('invalid_structure')
  if (
    !isRecord(value) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges)
  ) {
    throw new WorkflowImportError('invalid_structure')
  }

  if (!value.nodes.every(isValidNode)) {
    throw new WorkflowImportError('invalid_node')
  }

  if (!value.edges.every(isValidEdge)) {
    throw new WorkflowImportError('invalid_edge')
  }

  const nodeIds = new Set<string>()
  for (const node of value.nodes) {
    if (nodeIds.has(node.id)) {
      throw new WorkflowImportError('duplicate_node_id')
    }
    nodeIds.add(node.id)
  }

  if (
    value.edges.some(
      (edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target),
    )
  ) {
    throw new WorkflowImportError('missing_node')
  }

  for (const node of value.nodes) {
    if (node.type === 'subgraph')
      node.data.workflow = parseDefinition(node.data.workflow, depth + 1)
  }
  return cleanGraph({
    nodes: value.nodes,
    edges: value.edges,
    interface: parseInterface(value.interface),
  })
}

export function parseWorkflowJson(json: string): ParsedWorkflowJson {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new WorkflowImportError('invalid_json')
  }

  if (!isRecord(value)) {
    throw new WorkflowImportError('invalid_structure')
  }

  if (
    value.format === WORKFLOW_JSON_FORMAT &&
    value.version !== WORKFLOW_JSON_VERSION
  ) {
    throw new WorkflowImportError('unsupported_version')
  }

  const definition =
    Array.isArray(value.nodes) && Array.isArray(value.edges)
      ? value
      : value.workflow

  return {
    name: typeof value.name === 'string' ? value.name : undefined,
    workflow: parseDefinition(definition),
  }
}

export function serializeWorkflowJson(
  workflow: WorkflowDefinition,
  name?: string,
): string {
  const envelope: WorkflowJsonEnvelope = {
    format: WORKFLOW_JSON_FORMAT,
    version: WORKFLOW_JSON_VERSION,
    ...(name?.trim() ? { name: name.trim() } : {}),
    exported_at: new Date().toISOString(),
    workflow: cleanGraph(workflow),
  }

  return JSON.stringify(envelope, null, 2)
}
