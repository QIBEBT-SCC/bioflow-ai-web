import type { Edge, Node as FlowNode, NodeChange } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from '@xyflow/react'
import { nodeTypes } from '@/components/node-editor/node-registry'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { RunLinkProvider } from '@/components/node-editor/run-link-context'
import { SubgraphBreadcrumbs } from '@/components/node-editor/subgraph-breadcrumbs'
import { SubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { SubgraphInterfaceSummary } from '@/components/node-editor/subgraph-interface-summary'
import { StatusEdge } from '@/components/workflow/status-edge'
import type { WorkflowInterface } from '@/types/workflow'

const edgeTypes = { default: StatusEdge }

interface RunFlowCanvasProps {
  viewKey?: string
  runLink: (runUid: string) => string
  labels: string[]
  graphInterface?: WorkflowInterface | null
  onEnterSubgraph: (id: string) => void
  onNavigate: (depth: number) => void
  nodes: FlowNode[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void
  onNodeClick: (event: React.MouseEvent, node: FlowNode) => void
  onPaneClick: () => void
}

export function RunFlowCanvas({
  viewKey,
  runLink,
  labels,
  graphInterface,
  onEnterSubgraph,
  onNavigate,
  nodes,
  edges,
  onNodesChange,
  onNodeClick,
  onPaneClick,
}: RunFlowCanvasProps) {
  return (
    <div className='flex-1 min-h-0 flex flex-col'>
      <SubgraphBreadcrumbs labels={labels} onNavigate={onNavigate} />
      <div className='flex-1 min-h-0'>
        <ReadOnlyProvider value={true}>
          <RunLinkProvider value={runLink}>
            <SubgraphNavigation value={onEnterSubgraph}>
              <ReactFlow
                key={viewKey}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodesConnectable={false}
                fitView
                className='bg-gray-50'
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  className='!bg-gray-100'
                />
                <SubgraphInterfaceSummary value={graphInterface} />
                <Controls />
              </ReactFlow>
            </SubgraphNavigation>
          </RunLinkProvider>
        </ReadOnlyProvider>
      </div>
    </div>
  )
}
