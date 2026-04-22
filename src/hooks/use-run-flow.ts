'use client'

import { useQueries } from '@tanstack/react-query'
import type { Edge, Node as FlowNode, NodeChange } from '@xyflow/react'
import { useNodesState } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getToolArg } from '@/app/actions/tool'
import type { RunData, RunPublic } from '@/types/run'
import { Status } from '@/types/run'

export function useRunFlow(run: RunPublic | null) {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([])

  useEffect(() => {
    if (run?.nodes) setFlowNodes(run.nodes)
  }, [run?.nodes, setFlowNodes])

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

  const allToolsLoaded =
    toolQueries.length === 0 || toolQueries.every((q) => !q.isLoading)

  // 延迟一个 render cycle：等 Handle 组件的 effect commit 完成后再传入 edges，
  const [edgesReady, setEdgesReady] = useState(false)
  useEffect(() => {
    setEdgesReady(allToolsLoaded)
  }, [allToolsLoaded])

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
