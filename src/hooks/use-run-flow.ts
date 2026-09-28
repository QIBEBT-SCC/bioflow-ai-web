'use client'

import { useQueries } from '@tanstack/react-query'
import type { Edge, Node as FlowNode, NodeChange } from '@xyflow/react'
import { useNodesInitialized, useNodesState, useReactFlow } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getToolArg } from '@/app/actions/tool'
import { runInterfaceView } from '@/lib/run-interface'
import {
  layoutWorkflowNodes,
  prepareWorkflowNodes,
} from '@/lib/workflow-layout'
import type { WorkflowNode } from '@/types/workflow'
import {
  type NodeRunDataV2,
  NodeRunStatusV2,
  type WorkflowRunV2,
} from '@/types/workflow-v2'

function getTopologyKey(run: WorkflowRunV2): string {
  return [
    run.uid,
    ...run.nodes.map((node) => `${node.id}:${node.type}`),
    ...run.edges.map(
      (edge) =>
        `${edge.source}:${edge.sourceHandle}>${edge.target}:${edge.targetHandle}`,
    ),
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

export function useRunFlow(run: WorkflowRunV2 | null) {
  const displayRun = useMemo(
    () => (run ? { ...run, ...runInterfaceView(run) } : null),
    [run],
  )
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([])
  const { fitView, getNodes } = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const topologyKeyRef = useRef<string | null>(null)
  const completedLayoutKeyRef = useRef<string | null>(null)
  const [initialLayoutKey, setInitialLayoutKey] = useState<string | null>(null)
  const topologyKey = useMemo(
    () => (displayRun ? getTopologyKey(displayRun) : null),
    [displayRun],
  )

  useEffect(() => {
    if (!displayRun || !topologyKey) {
      topologyKeyRef.current = null
      setInitialLayoutKey(null)
      setFlowNodes([])
      return
    }

    if (topologyKeyRef.current !== topologyKey) {
      const prepared = prepareWorkflowNodes(displayRun.nodes)
      topologyKeyRef.current = topologyKey
      setFlowNodes(prepared.nodes)
      setInitialLayoutKey(prepared.needsLayout ? topologyKey : null)
      return
    }

    setFlowNodes((currentNodes) =>
      mergeRunNodes(currentNodes, displayRun.nodes),
    )
  }, [displayRun, setFlowNodes, topologyKey])

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
        displayRun?.nodes
          ?.filter((n) => n.type === 'tool')
          .map((n) => n.data?.tool_uid as string)
          .filter(Boolean) ?? [],
      ),
    ],
    [displayRun?.nodes],
  )

  const toolQueries = useQueries({
    queries: toolUids.map((uid) => ({
      queryKey: ['toolArg', uid],
      queryFn: () => getToolArg(uid),
      staleTime: 10 * 60 * 1000,
    })),
  })

  // 只有当 run 已加载，并且所有 tool 节点的参数都请求成功后，才认为 handles 就绪。
  const hasToolNodes = !!displayRun?.nodes?.some((n) => n.type === 'tool')
  const allToolsLoaded = hasToolNodes
    ? toolQueries.length > 0 && toolQueries.every((q) => q.isSuccess)
    : !!displayRun?.nodes

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

  useEffect(() => {
    if (
      !initialLayoutKey ||
      completedLayoutKeyRef.current === initialLayoutKey ||
      !allToolsLoaded ||
      !nodesInitialized ||
      !displayRun
    )
      return
    let fitFrame: number | undefined
    const layoutFrame = requestAnimationFrame(() => {
      setFlowNodes(
        layoutWorkflowNodes(getNodes(), displayRun.edges, {
          initialLayout: true,
        }),
      )
      fitFrame = requestAnimationFrame(() => {
        completedLayoutKeyRef.current = initialLayoutKey
        void fitView({ padding: 0.15, duration: 500 })
      })
    })
    return () => {
      cancelAnimationFrame(layoutFrame)
      if (fitFrame !== undefined) cancelAnimationFrame(fitFrame)
    }
  }, [
    allToolsLoaded,
    displayRun,
    fitView,
    getNodes,
    initialLayoutKey,
    nodesInitialized,
    setFlowNodes,
  ])

  const edges = useMemo<Edge[]>(() => {
    if (!displayRun?.edges || !displayRun?.nodes || !edgesReady) return []
    const nodeMap = new Map(displayRun.nodes.map((n) => [n.id, n]))
    const withAnimate = [
      NodeRunStatusV2.PENDING,
      NodeRunStatusV2.READY,
      NodeRunStatusV2.QUEUED,
      NodeRunStatusV2.RUNNING,
      undefined,
    ]
    return displayRun.edges.map((e) => {
      const sourceNode = nodeMap.get(e.source)
      const runData = (e.data?.run_data ?? sourceNode?.data?.run_data) as
        | NodeRunDataV2
        | undefined
      const status = runData?.status
      return { ...e, animated: withAnimate.includes(status) }
    })
  }, [displayRun?.edges, displayRun?.nodes, edgesReady])

  return { flowNodes, edges, handleNodesChange }
}
