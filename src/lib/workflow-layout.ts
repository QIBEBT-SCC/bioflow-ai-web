import { Graph, layout } from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'

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

function getNodeSize(node: Node): NodeSize {
  return {
    width: node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH,
    height: node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT,
  }
}

/**
 * Arrange executable workflow nodes from left to right.
 *
 * Notes anchored to an executable node follow that node by the same displacement.
 * Global notes remain in place. Other disconnected nodes are placed below the
 * connected graph so they remain easy to find.
 */
export function layoutWorkflowNodes(nodes: Node[], edges: Edge[]): Node[] {
  const layoutableNodes = nodes.filter((node) => node.type !== 'note')
  if (layoutableNodes.length === 0) {
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
  const sizes = new Map(
    layoutableNodes.map((node) => [node.id, getNodeSize(node)]),
  )

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
