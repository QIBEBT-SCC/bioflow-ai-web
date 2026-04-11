import type { Edge, Node as FlowNode, NodeChange } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from '@xyflow/react'
import { nodeTypes } from '@/components/node-editor/node-registry'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { StatusEdge } from '@/components/workflow/status-edge'

const edgeTypes = { default: StatusEdge }

interface RunFlowCanvasProps {
  nodes: FlowNode[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void
  onNodeClick: (event: React.MouseEvent, node: FlowNode) => void
  onPaneClick: () => void
}

export function RunFlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onNodeClick,
  onPaneClick,
}: RunFlowCanvasProps) {
  return (
    <div className='flex-1 min-h-0'>
      <ReadOnlyProvider value={true}>
        <ReactFlow
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
          <Controls />
        </ReactFlow>
      </ReadOnlyProvider>
    </div>
  )
}
