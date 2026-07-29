import { Graph, layout } from '@dagrejs/dagre'
import type { Edge, Node, XYPosition } from '@xyflow/react'
import type { WorkflowNode } from '@/types/workflow'

const DEFAULT_NODE_WIDTH = 300
const DEFAULT_NODE_HEIGHT = 200
const NODE_GAP = 80
const RANK_GAP = 140
const SECTION_GAP = 120
const MIN_ISOLATED_ROW_WIDTH = 1200

interface NodeSize {
  width: number
  height: number
}

interface WorkflowLayoutOptions {
  initialLayout?: boolean
}

interface PreparedWorkflowNodes {
  needsLayout: boolean
  nodes: Node[]
}

interface NodeRect extends NodeSize, XYPosition {}

function getNodeSize(node: Node): NodeSize {
  return {
    width: node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH,
    height: node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT,
  }
}

function hasValidPosition(node: WorkflowNode): boolean {
  return Number.isFinite(node.position?.x) && Number.isFinite(node.position?.y)
}

/**
 * Convert API nodes into renderable React Flow nodes.
 *
 * Workflow layouts are all-or-nothing: if any node has no valid position, all
 * nodes receive a temporary origin and the whole graph is marked for layout.
 */
export function prepareWorkflowNodes(
  nodes: WorkflowNode[],
): PreparedWorkflowNodes {
  const needsLayout =
    nodes.length > 0 && !nodes.every((node) => hasValidPosition(node))

  if (!needsLayout) {
    return {
      needsLayout,
      nodes: nodes.map((node) => ({
        ...node,
        position: node.position as XYPosition,
      })),
    }
  }

  return {
    needsLayout,
    nodes: nodes.map((node) => ({ ...node, position: { x: 0, y: 0 } })),
  }
}

function overlaps(a: NodeRect, b: NodeRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

function placeInitialNotes(
  nodes: Node[],
  positions: Map<string, Node['position']>,
  sizes: Map<string, NodeSize>,
): void {
  const notes = nodes.filter((node) => node.type === 'note')
  if (notes.length === 0) {
    return
  }

  const occupied: NodeRect[] = nodes
    .filter((node) => node.type !== 'note')
    .map((node) => {
      const position = positions.get(node.id) ?? node.position
      const size = sizes.get(node.id) ?? getNodeSize(node)
      return { ...position, ...size }
    })
  const globalNotes: Node[] = []

  for (const note of notes) {
    const anchorNodeId = note.data.anchor_node_id
    const anchorPosition =
      typeof anchorNodeId === 'string' ? positions.get(anchorNodeId) : undefined
    const anchorSize =
      typeof anchorNodeId === 'string' ? sizes.get(anchorNodeId) : undefined

    if (!anchorPosition || !anchorSize) {
      globalNotes.push(note)
      continue
    }

    const noteSize = sizes.get(note.id) ?? getNodeSize(note)
    const candidate: NodeRect = {
      x: anchorPosition.x,
      y: anchorPosition.y + anchorSize.height + NODE_GAP,
      ...noteSize,
    }

    let collisions = occupied.filter((rect) => overlaps(candidate, rect))
    while (collisions.length > 0) {
      candidate.y =
        Math.max(...collisions.map((rect) => rect.y + rect.height)) + NODE_GAP
      collisions = occupied.filter((rect) => overlaps(candidate, rect))
    }

    positions.set(note.id, { x: candidate.x, y: candidate.y })
    occupied.push(candidate)
  }

  if (globalNotes.length === 0) {
    return
  }

  const minX =
    occupied.length > 0 ? Math.min(...occupied.map((rect) => rect.x)) : 0
  const maxX =
    occupied.length > 0
      ? Math.max(...occupied.map((rect) => rect.x + rect.width))
      : MIN_ISOLATED_ROW_WIDTH
  const maxY =
    occupied.length > 0
      ? Math.max(...occupied.map((rect) => rect.y + rect.height))
      : -SECTION_GAP
  const rowEndX = minX + Math.max(maxX - minX, MIN_ISOLATED_ROW_WIDTH)

  let x = minX
  let y = maxY + SECTION_GAP
  let rowHeight = 0

  for (const note of globalNotes) {
    const size = sizes.get(note.id) ?? getNodeSize(note)
    if (x > minX && x + size.width > rowEndX) {
      x = minX
      y += rowHeight + NODE_GAP
      rowHeight = 0
    }

    positions.set(note.id, { x, y })
    x += size.width + NODE_GAP
    rowHeight = Math.max(rowHeight, size.height)
  }
}

/**
 * Arrange executable workflow nodes from left to right.
 *
 * Notes anchored to an executable node follow that node by the same displacement.
 * Global notes remain in place. Other disconnected nodes are placed below the
 * connected graph so they remain easy to find.
 */
export function layoutWorkflowNodes(
  nodes: Node[],
  edges: Edge[],
  options: WorkflowLayoutOptions = {},
): Node[] {
  const layoutableNodes = nodes.filter((node) => node.type !== 'note')
  if (layoutableNodes.length === 0 && !options.initialLayout) {
    return nodes
  }

  const layoutableNodeIds = new Set(layoutableNodes.map((node) => node.id))
  const connectedNodeIds = new Set<string>()

  for (const edge of edges) {
    if (
      layoutableNodeIds.has(edge.source) &&
      layoutableNodeIds.has(edge.target)
    ) {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    }
  }

  const connectedNodes = layoutableNodes.filter((node) =>
    connectedNodeIds.has(node.id),
  )
  const isolatedNodes = layoutableNodes.filter(
    (node) => !connectedNodeIds.has(node.id),
  )
  const positions = new Map<string, Node['position']>()
  const originalPositions = new Map(
    layoutableNodes.map((node) => [node.id, node.position]),
  )
  const sizes = new Map(nodes.map((node) => [node.id, getNodeSize(node)]))

  let connectedMinX = 0
  let connectedMaxX = 0
  let connectedMaxY = 0

  if (connectedNodes.length > 0) {
    const graph = new Graph()
      .setDefaultEdgeLabel(() => ({}))
      .setGraph({
        rankdir: 'LR',
        nodesep: NODE_GAP,
        ranksep: RANK_GAP,
        marginx: 0,
        marginy: 0,
      })

    for (const node of connectedNodes) {
      graph.setNode(node.id, sizes.get(node.id))
    }

    for (const edge of edges) {
      if (
        connectedNodeIds.has(edge.source) &&
        connectedNodeIds.has(edge.target)
      ) {
        graph.setEdge(edge.source, edge.target)
      }
    }

    layout(graph)

    connectedMinX = Number.POSITIVE_INFINITY
    for (const node of connectedNodes) {
      const graphNode = graph.node(node.id)
      const size = sizes.get(node.id) ?? {
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      }
      const position = {
        x: graphNode.x - size.width / 2,
        y: graphNode.y - size.height / 2,
      }

      positions.set(node.id, position)
      connectedMinX = Math.min(connectedMinX, position.x)
      connectedMaxX = Math.max(connectedMaxX, position.x + size.width)
      connectedMaxY = Math.max(connectedMaxY, position.y + size.height)
    }
  }

  if (isolatedNodes.length > 0) {
    const rowStartX = connectedNodes.length > 0 ? connectedMinX : 0
    const rowStartY =
      connectedNodes.length > 0 ? connectedMaxY + SECTION_GAP : 0
    const rowWidth =
      connectedNodes.length > 0
        ? Math.max(connectedMaxX - connectedMinX, MIN_ISOLATED_ROW_WIDTH)
        : MIN_ISOLATED_ROW_WIDTH
    const rowEndX = rowStartX + rowWidth

    let x = rowStartX
    let y = rowStartY
    let rowHeight = 0

    for (const node of isolatedNodes) {
      const size = sizes.get(node.id) ?? {
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      }

      if (x > rowStartX && x + size.width > rowEndX) {
        x = rowStartX
        y += rowHeight + NODE_GAP
        rowHeight = 0
      }

      positions.set(node.id, { x, y })
      x += size.width + NODE_GAP
      rowHeight = Math.max(rowHeight, size.height)
    }
  }

  if (options.initialLayout) {
    placeInitialNotes(nodes, positions, sizes)
  }

  return nodes.map((node) => {
    const position = positions.get(node.id)
    if (position) {
      return { ...node, position }
    }

    if (node.type !== 'note') {
      return node
    }

    const anchorNodeId = node.data.anchor_node_id
    if (typeof anchorNodeId !== 'string') {
      return node
    }

    const originalAnchorPosition = originalPositions.get(anchorNodeId)
    const layoutedAnchorPosition = positions.get(anchorNodeId)
    if (!originalAnchorPosition || !layoutedAnchorPosition) {
      return node
    }

    return {
      ...node,
      position: {
        x:
          node.position.x + layoutedAnchorPosition.x - originalAnchorPosition.x,
        y:
          node.position.y + layoutedAnchorPosition.y - originalAnchorPosition.y,
      },
    }
  })
}
