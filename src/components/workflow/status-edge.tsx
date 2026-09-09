'use client'

import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  type InternalNode,
  type Node,
  Position,
  useInternalNode,
} from '@xyflow/react'
import { type NodeRunDataV2, NodeRunStatusV2 } from '@/types/workflow-v2'

const getHandleCoords = (
  node: InternalNode<Node>,
  pos: Position,
  handleId?: string | null,
) => {
  const type = pos === Position.Left ? 'target' : 'source'
  const handles = node.internals.handleBounds?.[type] ?? []
  const handle =
    (handleId ? handles.find((h) => h.id === handleId) : undefined) ??
    handles.find((h) => h.position === pos)
  if (!handle) return [0, 0] as const
  let ox = handle.width / 2
  let oy = handle.height / 2
  if (pos === Position.Left) ox = 0
  else if (pos === Position.Right) ox = handle.width
  else if (pos === Position.Top) oy = 0
  else if (pos === Position.Bottom) oy = handle.height
  return [
    node.internals.positionAbsolute.x + handle.x + ox,
    node.internals.positionAbsolute.y + handle.y + oy,
  ] as const
}

export const StatusEdge = ({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  markerEnd,
}: EdgeProps) => {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!(sourceNode && targetNode)) return null

  const [sx, sy] = getHandleCoords(sourceNode, Position.Right, sourceHandleId)
  const [tx, ty] = getHandleCoords(targetNode, Position.Left, targetHandleId)

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: Position.Right,
    targetX: tx,
    targetY: ty,
    targetPosition: Position.Left,
  })

  const runData = sourceNode.data?.run_data as NodeRunDataV2 | undefined
  const status = runData?.status

  if (status === NodeRunStatusV2.SUCCEEDED) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: '#22c55e', strokeWidth: 2 }}
      />
    )
  }

  if (status === NodeRunStatusV2.FAILED) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: '#ef4444', strokeWidth: 2 }}
      />
    )
  }

  if (status === NodeRunStatusV2.RUNNING) {
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{ stroke: '#3b82f6', strokeWidth: 2 }}
        />
        <circle fill='#3b82f6' r='4'>
          <animateMotion dur='2s' path={edgePath} repeatCount='indefinite' />
        </circle>
      </>
    )
  }

  if (status === NodeRunStatusV2.BLOCKED) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ strokeDasharray: '3,4', stroke: '#64748b', strokeWidth: 1.5 }}
      />
    )
  }

  if (status === NodeRunStatusV2.QUEUED) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ strokeDasharray: '5,4', stroke: '#8b5cf6', strokeWidth: 1.5 }}
      />
    )
  }

  if (status === NodeRunStatusV2.READY) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ strokeDasharray: '5,4', stroke: '#f59e0b', strokeWidth: 1.5 }}
      />
    )
  }

  // PENDING or no run_data — dashed
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{ strokeDasharray: '5,5', stroke: '#94a3b8', strokeWidth: 1.5 }}
    />
  )
}
