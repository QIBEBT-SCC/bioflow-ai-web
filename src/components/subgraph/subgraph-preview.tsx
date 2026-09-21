'use client'

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import { useMemo, useState } from 'react'
import { nodeTypes } from '@/components/node-editor/node-registry'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { SubgraphBreadcrumbs } from '@/components/node-editor/subgraph-breadcrumbs'
import { SubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { graphNodes } from '@/lib/subgraph'
import { interfaceView } from '@/lib/subgraph-interface'
import type { WorkflowDefinition } from '@/types/workflow'

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
      if (!node || node.type !== 'subgraph') break
      labels.push(String(node.data.name ?? id))
      graph = node.data.workflow as WorkflowDefinition
    }
    return { graph, labels }
  }, [workflow, path])
  const view = useMemo(() => {
    const boundary = interfaceView(graph)
    return {
      nodes: [...graphNodes(graph), ...boundary.nodes],
      edges: [...graph.edges, ...boundary.edges],
    }
  }, [graph])
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
            <ReactFlowProvider key={path.join('/')}>
              <ReactFlow
                nodes={view.nodes}
                edges={view.edges}
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
            </ReactFlowProvider>
          </SubgraphNavigation>
        </ReadOnlyProvider>
      </div>
    </div>
  )
}
