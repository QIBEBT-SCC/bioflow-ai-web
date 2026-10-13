import { Graph, layout } from '@dagrejs/dagre'
import type { Edge, Node, XYPosition } from '@xyflow/react'
import type { WorkflowNode } from '@/types/workflow'

const DEFAULT_NODE_WIDTH = 300
const DEFAULT_NODE_HEIGHT = 200
const MIN_ISOLATED_ROW_WIDTH = 1200
const COMPACT_ASPECT_RATIO = 16 / 9

export type WorkflowLayoutMode = 'standard' | 'compact'

interface LayoutSpacing {
  nodeGap: number
  rankGap: number
  sectionGap: number
}

const LAYOUT_SPACING: Record<WorkflowLayoutMode, LayoutSpacing> = {
  standard: { nodeGap: 80, rankGap: 140, sectionGap: 120 },
  compact: { nodeGap: 32, rankGap: 72, sectionGap: 64 },
}

interface NodeSize {
  width: number
  height: number
}

interface WorkflowLayoutOptions {
  initialLayout?: boolean
  mode?: WorkflowLayoutMode
}

interface LayoutBlock extends NodeSize {
  /** Node positions relative to the block's top-left corner. */
  positions: Map<string, XYPosition>
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
  { nodeGap, sectionGap }: LayoutSpacing,
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
      y: anchorPosition.y + anchorSize.height + nodeGap,
      ...noteSize,
    }

    let collisions = occupied.filter((rect) => overlaps(candidate, rect))
    while (collisions.length > 0) {
      candidate.y =
        Math.max(...collisions.map((rect) => rect.y + rect.height)) + nodeGap
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
      : -sectionGap
  const rowEndX = minX + Math.max(maxX - minX, MIN_ISOLATED_ROW_WIDTH)

  let x = minX
  let y = maxY + sectionGap
  let rowHeight = 0

  for (const note of globalNotes) {
    const size = sizes.get(note.id) ?? getNodeSize(note)
    if (x > minX && x + size.width > rowEndX) {
      x = minX
      y += rowHeight + nodeGap
      rowHeight = 0
    }

    positions.set(note.id, { x, y })
    x += size.width + nodeGap
    rowHeight = Math.max(rowHeight, size.height)
  }
}

function layoutDagreBlock(
  nodes: Node[],
  edges: Edge[],
  sizes: Map<string, NodeSize>,
  { nodeGap, rankGap }: LayoutSpacing,
): LayoutBlock {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const graph = new Graph()
    .setDefaultEdgeLabel(() => ({}))
    .setGraph({
      rankdir: 'LR',
      nodesep: nodeGap,
      ranksep: rankGap,
      marginx: 0,
      marginy: 0,
    })

  for (const node of nodes) {
    graph.setNode(node.id, sizes.get(node.id))
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      graph.setEdge(edge.source, edge.target)
    }
  }

  layout(graph)

  const positions = new Map<string, XYPosition>()
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const node of nodes) {
    const graphNode = graph.node(node.id)
    const size = sizes.get(node.id) ?? getNodeSize(node)
    const position = {
      x: graphNode.x - size.width / 2,
      y: graphNode.y - size.height / 2,
    }

    positions.set(node.id, position)
    minX = Math.min(minX, position.x)
    minY = Math.min(minY, position.y)
    maxX = Math.max(maxX, position.x + size.width)
    maxY = Math.max(maxY, position.y + size.height)
  }

  for (const position of positions.values()) {
    position.x -= minX
    position.y -= minY
  }

  return { positions, width: maxX - minX, height: maxY - minY }
}

/** Group nodes into weakly connected components, preserving input order. */
function findComponents(nodes: Node[], edges: Edge[]): Node[][] {
  const parent = new Map(nodes.map((node) => [node.id, node.id]))
  const find = (id: string): string => {
    let root = id
    while (parent.get(root) !== root) {
      root = parent.get(root) as string
    }
    parent.set(id, root)
    return root
  }

  for (const edge of edges) {
    if (parent.has(edge.source) && parent.has(edge.target)) {
      parent.set(find(edge.source), find(edge.target))
    }
  }

  const components = new Map<string, Node[]>()
  for (const node of nodes) {
    const root = find(node.id)
    const component = components.get(root)
    if (component) {
      component.push(node)
    } else {
      components.set(root, [node])
    }
  }

  return [...components.values()]
}

interface ShelfPacking extends NodeSize {
  offsets: XYPosition[]
}

/**
 * Pack blocks (sorted by descending height) into rows. Each row's first block
 * sets the row height; later blocks stack in columns while they fit beneath
 * the previous block, otherwise they open a new column or a new row.
 */
function shelfPack(
  blocks: LayoutBlock[],
  rowWidth: number,
  gap: number,
): ShelfPacking {
  const offsets: XYPosition[] = []
  let rowY = 0
  let rowHeight = 0
  let rowX = 0
  let column = { x: 0, width: 0, bottom: 0 }
  let width = 0

  for (const block of blocks) {
    const fitsInColumn =
      offsets.length > 0 &&
      block.width <= column.width &&
      column.bottom + gap + block.height <= rowY + rowHeight

    if (fitsInColumn) {
      offsets.push({ x: column.x, y: column.bottom + gap })
      column.bottom += gap + block.height
      continue
    }

    if (offsets.length > 0 && rowX + block.width > rowWidth) {
      rowY += rowHeight + gap
      rowHeight = 0
      rowX = 0
    }

    offsets.push({ x: rowX, y: rowY })
    column = { x: rowX, width: block.width, bottom: rowY + block.height }
    rowHeight = Math.max(rowHeight, block.height)
    width = Math.max(width, rowX + block.width)
    rowX += block.width + gap
  }

  return { offsets, width, height: rowY + rowHeight }
}

/**
 * Size of the packing once fitted into a 16:9 viewport; smaller means the
 * nodes render larger after fitView.
 */
function fittedExtent({ width, height }: NodeSize): number {
  return Math.max(width, height * COMPACT_ASPECT_RATIO)
}

/**
 * Shelf-pack blocks, trying every meaningful row width and keeping the packing
 * that renders largest in a 16:9 viewport (ties broken by smaller area).
 *
 * Taller blocks are placed first so the main workflow stays at the top-left.
 */
function packBlocks(
  blocks: LayoutBlock[],
  { sectionGap }: LayoutSpacing,
): Map<string, XYPosition> {
  const sorted = [...blocks].sort(
    (a, b) => b.height - a.height || b.width - a.width,
  )
  const candidateWidths = new Set<number>()
  let rowWidth = 0
  for (const block of sorted) {
    candidateWidths.add(block.width)
    rowWidth += block.width
    candidateWidths.add(rowWidth)
    rowWidth += sectionGap
  }

  let best: ShelfPacking | undefined
  for (const candidate of candidateWidths) {
    const packing = shelfPack(sorted, candidate, sectionGap)
    const extent = fittedExtent(packing)
    const bestExtent = best ? fittedExtent(best) : Number.POSITIVE_INFINITY
    if (
      extent < bestExtent ||
      (best &&
        extent === bestExtent &&
        packing.width * packing.height < best.width * best.height)
    ) {
      best = packing
    }
  }

  const positions = new Map<string, XYPosition>()
  sorted.forEach((block, index) => {
    const offset = best?.offsets[index] ?? { x: 0, y: 0 }
    for (const [id, position] of block.positions) {
      positions.set(id, { x: offset.x + position.x, y: offset.y + position.y })
    }
  })

  return positions
}

/**
 * Standard mode: one dagre graph for all connected nodes, with disconnected
 * nodes in rows below it.
 */
function layoutStandard(
  layoutableNodes: Node[],
  edges: Edge[],
  sizes: Map<string, NodeSize>,
  spacing: LayoutSpacing,
): Map<string, XYPosition> {
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
  const positions = new Map<string, XYPosition>()

  let connectedWidth = 0
  let connectedHeight = 0

  if (connectedNodes.length > 0) {
    const block = layoutDagreBlock(connectedNodes, edges, sizes, spacing)
    for (const [id, position] of block.positions) {
      positions.set(id, position)
    }
    connectedWidth = block.width
    connectedHeight = block.height
  }

  if (isolatedNodes.length > 0) {
    const rowStartY =
      connectedNodes.length > 0 ? connectedHeight + spacing.sectionGap : 0
    const rowEndX = Math.max(connectedWidth, MIN_ISOLATED_ROW_WIDTH)

    let x = 0
    let y = rowStartY
    let rowHeight = 0

    for (const node of isolatedNodes) {
      const size = sizes.get(node.id) ?? getNodeSize(node)

      if (x > 0 && x + size.width > rowEndX) {
        x = 0
        y += rowHeight + spacing.nodeGap
        rowHeight = 0
      }

      positions.set(node.id, { x, y })
      x += size.width + spacing.nodeGap
      rowHeight = Math.max(rowHeight, size.height)
    }
  }

  return positions
}

/**
 * Compact mode: lay out each connected component independently with tighter
 * spacing, then pack components and isolated nodes into a near-16:9 area.
 */
function layoutCompact(
  layoutableNodes: Node[],
  edges: Edge[],
  sizes: Map<string, NodeSize>,
  spacing: LayoutSpacing,
): Map<string, XYPosition> {
  const blocks = findComponents(layoutableNodes, edges).map((component) =>
    layoutDagreBlock(component, edges, sizes, spacing),
  )
  return packBlocks(blocks, spacing)
}

/**
 * Arrange executable workflow nodes from left to right.
 *
 * Notes anchored to an executable node follow that node by the same displacement.
 * Global notes remain in place. In standard mode, disconnected nodes are placed
 * below the connected graph; compact mode packs every component tightly.
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

  const mode = options.mode ?? 'standard'
  const spacing = LAYOUT_SPACING[mode]
  const originalPositions = new Map(
    layoutableNodes.map((node) => [node.id, node.position]),
  )
  const sizes = new Map(nodes.map((node) => [node.id, getNodeSize(node)]))
  const positions =
    mode === 'compact'
      ? layoutCompact(layoutableNodes, edges, sizes, spacing)
      : layoutStandard(layoutableNodes, edges, sizes, spacing)

  if (options.initialLayout) {
    placeInitialNotes(nodes, positions, sizes, spacing)
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
