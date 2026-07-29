'use client'

import { useQueries } from '@tanstack/react-query'
import type { Edge, Node as FlowNode, NodeChange } from '@xyflow/react'
import { useNodesState } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getToolArg } from '@/app/actions/tool'
import { useInitialWorkflowLayout } from '@/hooks/use-initial-workflow-layout'
import { prepareWorkflowNodes } from '@/lib/workflow-layout'
import type { RunData, RunPublic } from '@/types/run'
import { Status } from '@/types/run'
import type { WorkflowNode } from '@/types/workflow'

function getTopologyKey(run: RunPublic): string {
  return [
    run.uid,
    ...run.nodes.map((node) => `${node.id}:${node.type}`),
    ...run.edges.map((edge) => `${edge.source}>${edge.target}`),
  ].join('|')
}

function mergeRunNodes(
  currentNodes: FlowNode[],
  incomingNodes: WorkflowNode[],
): FlowNode[] {
  const currentNodeMap = new Map(currentNodes.map((node) => [node.id, node]))
  const preparedIncomingNodes = prepareWorkflowNodes(incomingNodes).nodes

  return preparedIncomingNodes.map((node) => {
    const currentNode = currentNodeMap.get(node.id)
    if (!currentNode) {
      return node
    }

    return {
      ...node,
      position: currentNode.position,
      measured: currentNode.measured,
      selected: currentNode.selected,
    }
  })
}

export function useRunFlow(run: RunPublic | null) {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([])
  const topologyKeyRef = useRef<string | null>(null)
  const [initialLayoutKey, setInitialLayoutKey] = useState<string | null>(null)
  const topologyKey = useMemo(() => (run ? getTopologyKey(run) : null), [run])

  useEffect(() => {
    if (!run || !topologyKey) {
      topologyKeyRef.current = null
      setInitialLayoutKey(null)
      setFlowNodes([])
      return
    }

    if (topologyKeyRef.current !== topologyKey) {
      const prepared = prepareWorkflowNodes(run.nodes)
      topologyKeyRef.current = topologyKey
      setFlowNodes(prepared.nodes)
      setInitialLayoutKey(prepared.needsLayout ? topologyKey : null)
      return
    }

    setFlowNodes((currentNodes) => mergeRunNodes(currentNodes, run.nodes))
  }, [run, setFlowNodes, topologyKey])

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const positionChanges = changes.filter(
        (c) => c.type === 'position' || c.type === 'dimensions',
      )
      if (positionChanges.length > 0) onNodesChange(positionChanges)
    },
    [onNodesChange],
  )

  const toolUids = useMemo(
    () => [
      ...new Set(
        run?.nodes
          ?.filter((n) => n.type === 'tool')
          .map((n) => n.data?.tool_uid as string)
          .filter(Boolean) ?? [],
      ),
    ],
    [run?.nodes],
  )

  const toolQueries = useQueries({
    queries: toolUids.map((uid) => ({
      queryKey: ['toolArg', uid],
      queryFn: () => getToolArg(uid),
      staleTime: 10 * 60 * 1000,
    })),
  })

  // 只有当 run 已加载，并且所有 tool 节点的参数都请求成功后，才认为 handles 就绪。
  const hasToolNodes = !!run?.nodes?.some((n) => n.type === 'tool')
  const allToolsLoaded = hasToolNodes
    ? toolQueries.length > 0 && toolQueries.every((q) => q.isSuccess)
    : !!run?.nodes

  // 延迟到下一帧再放行 edges，确保 ToolNode 重新渲染并把真实 handles commit 到 DOM。
  const [edgesReady, setEdgesReady] = useState(false)
  useEffect(() => {
    if (!allToolsLoaded) {
      setEdgesReady(false)
      return
    }
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setEdgesReady(true))
      return () => cancelAnimationFrame(raf2)
    })
    return () => cancelAnimationFrame(raf1)
  }, [allToolsLoaded])

  useInitialWorkflowLayout({
    edges: run?.edges ?? [],
    layoutKey: initialLayoutKey,
    nodesReady: allToolsLoaded,
    setNodes: setFlowNodes,
  })

  const edges = useMemo<Edge[]>(() => {
    if (!run?.edges || !run?.nodes || !edgesReady) return []
    const nodeMap = new Map(run.nodes.map((n) => [n.id, n]))
    const withAnimate = [Status.RUNNING, Status.WAITING, undefined]
    return run.edges.map((e) => {
      const sourceNode = nodeMap.get(e.source)
      const runData = sourceNode?.data?.run_data as RunData | undefined
      const status = runData?.status
      return { ...e, animated: withAnimate.includes(status) }
    })
  }, [run?.edges, run?.nodes, edgesReady])

  return { flowNodes, edges, handleNodesChange }
}
