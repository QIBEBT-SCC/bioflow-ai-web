'use client'

import { useQueries, useQuery } from '@tanstack/react-query'
import type { Edge, Node as FlowNode, NodeChange } from '@xyflow/react'
import { useNodesInitialized, useNodesState, useReactFlow } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRun } from '@/app/actions/run'
import { getToolArg } from '@/app/actions/tool'
import { findParentSubgraphInputs, runInterfaceView } from '@/lib/run-interface'
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

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keysA = Object.keys(objA)
  if (keysA.length !== Object.keys(objB).length) return false
  for (const key of keysA) {
    if (!Object.hasOwn(objB, key) || !deepEqual(objA[key], objB[key])) {
      return false
    }
  }
  return true
}

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
  let changed = currentNodes.length !== preparedIncomingNodes.length

  const merged = preparedIncomingNodes.map((node) => {
    const currentNode = currentNodeMap.get(node.id)
    if (!currentNode) {
      changed = true
      return node
    }
    if (
      currentNode.type === node.type &&
      deepEqual(currentNode.data, node.data)
    ) {
      return currentNode
    }

    changed = true
    return {
      ...currentNode,
      ...node,
      position: currentNode.position,
      measured: currentNode.measured,
      selected: currentNode.selected,
      dragging: currentNode.dragging,
    }
  })

  return changed ? merged : currentNodes
}

export function useRunFlow(run: WorkflowRunV2 | null) {
  const needsParentInputs = Boolean(
    run?.parent_run_uid &&
      run.parent_node_uid &&
      !run.interface?.inputs.length &&
      run.nodes.some((node) => node.type === 'resource_frozen_path'),
  )
  const parentRunUid = run?.parent_run_uid ?? ''
  const parentRunQuery = useQuery({
    queryKey: ['run-parent', parentRunUid],
    queryFn: () => getRun(parentRunUid),
    enabled: needsParentInputs && Boolean(parentRunUid),
    staleTime: Number.POSITIVE_INFINITY,
  })
  const fallbackInputs = useMemo(
    () =>
      parentRunQuery.data && run?.parent_node_uid
        ? findParentSubgraphInputs(
            parentRunQuery.data.nodes,
            run.parent_node_uid,
          )
        : undefined,
    [parentRunQuery.data, run?.parent_node_uid],
  )
  const displayRun = useMemo(
    () => (run ? { ...run, ...runInterfaceView(run, fallbackInputs) } : null),
    [run, fallbackInputs],
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

  const prevEdgesRef = useRef<Edge[]>([])
  const edges = useMemo<Edge[]>(() => {
    if (!displayRun?.edges || !displayRun?.nodes || !edgesReady) {
      prevEdgesRef.current = []
      return []
    }
    const nodeMap = new Map(displayRun.nodes.map((n) => [n.id, n]))
    const prevById = new Map(prevEdgesRef.current.map((e) => [e.id, e]))
    let changed = prevEdgesRef.current.length !== displayRun.edges.length

    const nextEdges = displayRun.edges.map((e, index) => {
      const sourceNode = nodeMap.get(e.source)
      const runData = (e.data?.run_data ?? sourceNode?.data?.run_data) as
        | NodeRunDataV2
        | undefined
      const animated = runData?.status === NodeRunStatusV2.RUNNING
      const prev = prevById.get(e.id)
      if (
        prev &&
        prev.source === e.source &&
        prev.target === e.target &&
        prev.sourceHandle === e.sourceHandle &&
        prev.targetHandle === e.targetHandle &&
        prev.animated === animated &&
        deepEqual(prev.data, e.data)
      ) {
        if (prevEdgesRef.current[index] !== prev) changed = true
        return prev
      }
      changed = true
      return { ...e, animated }
    })

    if (!changed) return prevEdgesRef.current
    prevEdgesRef.current = nextEdges
    return nextEdges
  }, [displayRun?.edges, displayRun?.nodes, edgesReady])

  const toolNames = useMemo(
    () =>
      new Map(
        toolUids.map((uid, index) => [uid, toolQueries[index]?.data?.name]),
      ),
    [toolUids, toolQueries],
  )

  return { flowNodes, edges, handleNodesChange, toolNames }
}
