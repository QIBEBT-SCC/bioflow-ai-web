'use client'

import {
  type Edge,
  type Node,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react'
import { useEffect, useRef } from 'react'
import { layoutWorkflowNodes } from '@/lib/workflow-layout'

interface UseInitialWorkflowLayoutOptions {
  edges: Edge[]
  layoutKey: string | null
  nodesReady: boolean
  setNodes: (nodes: Node[]) => void
}

export function useInitialWorkflowLayout({
  edges,
  layoutKey,
  nodesReady,
  setNodes,
}: UseInitialWorkflowLayoutOptions): void {
  const { fitView, getNodes } = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const completedLayoutKey = useRef<string | null>(null)

  useEffect(() => {
    if (!layoutKey) {
      completedLayoutKey.current = null
      return
    }

    if (
      completedLayoutKey.current === layoutKey ||
      !nodesReady ||
      !nodesInitialized
    ) {
      return
    }

    let fitViewFrame: number | undefined
    const layoutFrame = requestAnimationFrame(() => {
      setNodes(layoutWorkflowNodes(getNodes(), edges, { initialLayout: true }))

      fitViewFrame = requestAnimationFrame(() => {
        completedLayoutKey.current = layoutKey
        void fitView({ padding: 0.15, duration: 500 })
      })
    })

    return () => {
      cancelAnimationFrame(layoutFrame)
      if (fitViewFrame !== undefined) {
        cancelAnimationFrame(fitViewFrame)
      }
    }
  }, [
    edges,
    fitView,
    getNodes,
    layoutKey,
    nodesInitialized,
    nodesReady,
    setNodes,
  ])
}
