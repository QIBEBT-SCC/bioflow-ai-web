'use client'

import { useQueries } from '@tanstack/react-query'
import {
  Background,
  Controls,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getToolArg } from '@/app/actions/tool'
import { nodeTypes } from '@/components/node-editor/node-registry'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { SubgraphBreadcrumbs } from '@/components/node-editor/subgraph-breadcrumbs'
import { SubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { graphNodes } from '@/lib/subgraph'
import { interfaceView, layoutSubgraph } from '@/lib/subgraph-interface'
import { prepareWorkflowNodes } from '@/lib/workflow-layout'
import type { WorkflowDefinition } from '@/types/workflow'

function PreviewCanvas({ graph }: { graph: WorkflowDefinition }) {
  const { fitView, getNodes } = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const prepared = useMemo(
    () => prepareWorkflowNodes(graphNodes(graph)),
    [graph],
  )
  const initialView = useMemo(() => {
    const baseGraph: WorkflowDefinition = {
      ...graph,
      nodes: prepared.nodes,
    }
    const boundary = interfaceView(baseGraph)
    return {
      nodes: [...prepared.nodes, ...boundary.nodes],
      edges: [...graph.edges, ...boundary.edges],
    }
  }, [graph, prepared.nodes])

  const [flowNodes, setFlowNodes] = useNodesState<Node>(initialView.nodes)
  const layoutDoneRef = useRef(false)

  useEffect(() => {
    layoutDoneRef.current = false
    setFlowNodes(initialView.nodes)
  }, [initialView.nodes, setFlowNodes])

  const toolUids = useMemo(() => {
    const uids = new Set<string>()
    for (const node of graph.nodes) {
      if (node.type !== 'tool') continue
      const toolUid = node.data?.tool_uid
      if (typeof toolUid === 'string' && toolUid) uids.add(toolUid)
    }
    return [...uids]
  }, [graph.nodes])

  const toolQueries = useQueries({
    queries: toolUids.map((uid) => ({
      queryKey: ['toolArg', uid],
      queryFn: () => getToolArg(uid),
      staleTime: 10 * 60 * 1000,
    })),
  })

  const allToolsLoaded =
    toolUids.length === 0 ||
    (toolQueries.length === toolUids.length &&
      toolQueries.every((query) => query.isSuccess))

  const [edgesReady, setEdgesReady] = useState(false)
  useEffect(() => {
    setEdgesReady(false)
    if (!allToolsLoaded) return
    let raf2: number | undefined
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEdgesReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2 !== undefined) cancelAnimationFrame(raf2)
    }
  }, [allToolsLoaded])

  useEffect(() => {
    if (
      !prepared.needsLayout ||
      layoutDoneRef.current ||
      !allToolsLoaded ||
      !nodesInitialized
    ) {
      return
    }
    let fitFrame: number | undefined
    const layoutFrame = requestAnimationFrame(() => {
      const realNodes = getNodes().filter(
        (node) => node.type !== 'subgraph_interface',
      )
      const layouted = layoutSubgraph(
        { ...graph, nodes: realNodes },
        { initialLayout: true },
      )
      const boundary = interfaceView({
        ...graph,
        nodes: layouted.nodes,
        interface: layouted.interface,
      })
      setFlowNodes([...layouted.nodes, ...boundary.nodes])
      layoutDoneRef.current = true
      fitFrame = requestAnimationFrame(() => {
        void fitView({ padding: 0.15, maxZoom: 1 })
      })
    })
    return () => {
      cancelAnimationFrame(layoutFrame)
      if (fitFrame !== undefined) cancelAnimationFrame(fitFrame)
    }
  }, [
    allToolsLoaded,
    fitView,
    getNodes,
    graph,
    nodesInitialized,
    prepared.needsLayout,
    setFlowNodes,
  ])

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={edgesReady ? initialView.edges : []}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesReconnectable={false}
      deleteKeyCode={null}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}

export function SubgraphPreview({
  workflow,
}: {
  workflow: WorkflowDefinition
}) {
  const [path, setPath] = useState<string[]>([])
  const { graph, labels } = useMemo(() => {
    let graph = workflow
    const labels: string[] = []
    for (const id of path) {
      // Each path step visits a different graph once; a Map would also scan that graph.
      // react-doctor-disable-next-line react-doctor/js-index-maps
      const node = graph.nodes.find((node) => node.id === id)
      if (!node || (node.type !== 'subgraph' && node.type !== 'foreach')) break
      labels.push(String(node.data.name ?? id))
      graph = node.data.workflow as WorkflowDefinition
    }
    return { graph, labels }
  }, [workflow, path])
  const pathKey = path.join('/')
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <SubgraphBreadcrumbs
        labels={labels}
        onNavigate={(depth) => setPath((current) => current.slice(0, depth))}
      />
      <div className='h-[55vh] min-h-72'>
        <ReadOnlyProvider value={true}>
          <SubgraphNavigation
            value={(id) => setPath((current) => [...current, id])}
          >
            <ReactFlowProvider key={pathKey}>
              <PreviewCanvas graph={graph} />
            </ReactFlowProvider>
          </SubgraphNavigation>
        </ReadOnlyProvider>
      </div>
    </div>
  )
}
