import { Graph, layout, type Point } from '@dagrejs/dagre'
import type {
  GfaGraph,
  GfaLink,
  GfaSegment,
} from '@/components/project/run/gfa'

export type GfaLayoutNode = {
  segment: GfaSegment
  x: number
  y: number
  width: number
  height: number
  degree: number
}

export type GfaLayoutEdge = {
  link: GfaLink
  points: Point[]
}

export type GfaLayout = {
  width: number
  height: number
  nodes: GfaLayoutNode[]
  edges: GfaLayoutEdge[]
}

const NODE_HEIGHT = 34
const MAX_DAGRE_NODES = 300
const MAX_DAGRE_EDGES = 700

function nodeWidth(segment: GfaSegment): number {
  if (!segment.length) return 104
  return Math.max(92, Math.min(190, 72 + Math.log10(segment.length + 1) * 22))
}

function graphDegrees(graph: GfaGraph): Map<string, number> {
  const degrees = new Map(graph.segments.map((segment) => [segment.name, 0]))
  for (const link of graph.links) {
    degrees.set(link.from, (degrees.get(link.from) ?? 0) + 1)
    degrees.set(link.to, (degrees.get(link.to) ?? 0) + 1)
  }
  return degrees
}

function layoutLargeGraph(
  graph: GfaGraph,
  degrees: Map<string, number>,
): GfaLayout {
  const adjacency = new Map(
    graph.segments.map((segment) => [segment.name, new Set<string>()]),
  )
  for (const link of graph.links) {
    adjacency.get(link.from)?.add(link.to)
    adjacency.get(link.to)?.add(link.from)
  }
  const unseen = new Set(graph.segments.map((segment) => segment.name))
  const positions = new Map<string, { x: number; y: number }>()
  const segmentByName = new Map(
    graph.segments.map((segment) => [segment.name, segment]),
  )
  const isolated: string[] = []
  let cursorY = 36
  let maximumX = 0

  while (unseen.size) {
    const first = unseen.values().next().value
    if (!first) break
    const component: string[] = []
    const pending = [first]
    unseen.delete(first)
    while (pending.length) {
      const name = pending.pop()
      if (!name) continue
      component.push(name)
      for (const neighbor of adjacency.get(name) ?? []) {
        if (!unseen.delete(neighbor)) continue
        pending.push(neighbor)
      }
    }
    if (component.length === 1 && (degrees.get(first) ?? 0) === 0) {
      isolated.push(first)
      continue
    }

    const root = component.reduce((best, name) =>
      (degrees.get(name) ?? 0) > (degrees.get(best) ?? 0) ? name : best,
    )
    const rankByName = new Map([[root, 0]])
    const queue = [root]
    for (let index = 0; index < queue.length; index += 1) {
      const name = queue[index]
      const nextRank = (rankByName.get(name) ?? 0) + 1
      for (const neighbor of adjacency.get(name) ?? []) {
        if (rankByName.has(neighbor)) continue
        rankByName.set(neighbor, nextRank)
        queue.push(neighbor)
      }
    }
    const ranks = new Map<number, string[]>()
    for (const name of component) {
      const rank = rankByName.get(name) ?? 0
      ranks.set(rank, [...(ranks.get(rank) ?? []), name])
    }
    let cursorX = 36
    let componentHeight = NODE_HEIGHT
    for (const rank of [...ranks.keys()].sort((a, b) => a - b)) {
      const names = ranks.get(rank)?.sort((a, b) => a.localeCompare(b)) ?? []
      const rankWidth = Math.max(
        ...names.map((name) =>
          nodeWidth(segmentByName.get(name) as GfaSegment),
        ),
      )
      let rankY = cursorY
      for (const name of names) {
        positions.set(name, {
          x: cursorX + rankWidth / 2,
          y: rankY + NODE_HEIGHT / 2,
        })
        rankY += NODE_HEIGHT + 20
      }
      componentHeight = Math.max(componentHeight, rankY - cursorY - 20)
      cursorX += rankWidth + 76
    }
    maximumX = Math.max(maximumX, cursorX)
    cursorY += componentHeight + 48
  }

  if (isolated.length) {
    const columnWidth = 220
    const columns = Math.max(
      1,
      Math.min(10, Math.ceil(Math.sqrt(isolated.length))),
    )
    isolated
      .sort((a, b) => a.localeCompare(b))
      .forEach((name, index) => {
        positions.set(name, {
          x: 36 + (index % columns) * columnWidth + columnWidth / 2,
          y: cursorY + Math.floor(index / columns) * 58 + NODE_HEIGHT / 2,
        })
      })
    maximumX = Math.max(maximumX, 72 + columns * columnWidth)
    cursorY += Math.ceil(isolated.length / columns) * 58 + 48
  }

  const nodes = graph.segments.map((segment): GfaLayoutNode => {
    const position = positions.get(segment.name) ?? { x: 36, y: 36 }
    return {
      segment,
      ...position,
      width: nodeWidth(segment),
      height: NODE_HEIGHT,
      degree: degrees.get(segment.name) ?? 0,
    }
  })
  const nodeByName = new Map(nodes.map((node) => [node.segment.name, node]))
  const edges = graph.links.map((link): GfaLayoutEdge => {
    const from = nodeByName.get(link.from)
    const to = nodeByName.get(link.to)
    return {
      link,
      points:
        from && to
          ? [
              { x: from.x, y: from.y },
              { x: to.x, y: to.y },
            ]
          : [],
    }
  })
  return {
    width: Math.max(1, maximumX + 36),
    height: Math.max(1, cursorY),
    nodes,
    edges,
  }
}

function layoutWithDagre(
  graph: GfaGraph,
  degrees: Map<string, number>,
): GfaLayout {
  const layoutGraph = new Graph({ multigraph: true })
    .setDefaultEdgeLabel(() => ({}))
    .setGraph({
      rankdir: 'LR',
      nodesep: 30,
      edgesep: 12,
      ranksep: 76,
      marginx: 36,
      marginy: 36,
      acyclicer: 'greedy',
    })

  for (const segment of graph.segments) {
    layoutGraph.setNode(segment.name, {
      width: nodeWidth(segment),
      height: NODE_HEIGHT,
    })
  }
  for (const link of graph.links) {
    layoutGraph.setEdge(link.from, link.to, {}, String(link.id))
  }
  layout(layoutGraph)

  const nodes = graph.segments.map((segment): GfaLayoutNode => {
    const node = layoutGraph.node(segment.name)
    return {
      segment,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      degree: degrees.get(segment.name) ?? 0,
    }
  })
  const nodeByName = new Map(nodes.map((node) => [node.segment.name, node]))
  const edges = graph.links.map((link): GfaLayoutEdge => {
    const edge = layoutGraph.edge({
      v: link.from,
      w: link.to,
      name: String(link.id),
    })
    const from = nodeByName.get(link.from)
    const to = nodeByName.get(link.to)
    return {
      link,
      points:
        edge.points ??
        (from && to
          ? [
              { x: from.x, y: from.y },
              { x: to.x, y: to.y },
            ]
          : []),
    }
  })
  const bounds = layoutGraph.graph()
  return {
    width: Math.max(1, bounds.width ?? 1),
    height: Math.max(1, bounds.height ?? 1),
    nodes,
    edges,
  }
}

export function layoutGfa(graph: GfaGraph): GfaLayout {
  const degrees = graphDegrees(graph)
  if (
    graph.segments.length > MAX_DAGRE_NODES ||
    graph.links.length > MAX_DAGRE_EDGES
  )
    return layoutLargeGraph(graph, degrees)
  return layoutWithDagre(graph, degrees)
}
