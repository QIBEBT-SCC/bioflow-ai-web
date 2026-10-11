import type { Edge, Node as FlowNode, NodeChange } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from '@xyflow/react'
import { MessageSquarePlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { nodeTypes } from '@/components/node-editor/node-registry'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { RunLinkProvider } from '@/components/node-editor/run-link-context'
import { SubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { SubgraphInterfaceSummary } from '@/components/node-editor/subgraph-interface-summary'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusEdge } from '@/components/workflow/status-edge'
import type { WorkflowInterface } from '@/types/workflow'

const edgeTypes = { default: StatusEdge }

interface RunFlowCanvasProps {
  viewKey?: string
  runLink: (runUid: string) => string
  graphInterface?: WorkflowInterface | null
  onEnterSubgraph: (id: string) => void
  nodes: FlowNode[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void
  onNodeClick: (event: React.MouseEvent, node: FlowNode) => void
  onPaneClick: () => void
  onAddNodeToChat: (node: FlowNode) => void
  canAttachNode: (node: FlowNode) => boolean
}

export function RunFlowCanvas({
  viewKey,
  runLink,
  graphInterface,
  onEnterSubgraph,
  nodes,
  edges,
  onNodesChange,
  onNodeClick,
  onPaneClick,
  onAddNodeToChat,
  canAttachNode,
}: RunFlowCanvasProps) {
  const t = useTranslations('Chat.node')
  const [menu, setMenu] = useState<{
    x: number
    y: number
    node: FlowNode
    viewKey?: string
  } | null>(null)
  return (
    <div className='flex-1 min-h-0 flex flex-col'>
      <DropdownMenu
        open={menu !== null && menu.viewKey === viewKey}
        onOpenChange={(open) => {
          if (!open) setMenu(null)
        }}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            tabIndex={-1}
            aria-label={t('add')}
            className='pointer-events-none fixed size-px opacity-0'
            style={{ left: menu?.x ?? 0, top: menu?.y ?? 0 }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='start'
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuItem
            onSelect={() => {
              if (menu) onAddNodeToChat(menu.node)
              setMenu(null)
            }}
          >
            <MessageSquarePlusIcon />
            {t('add')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
                onNodeContextMenu={(event, node) => {
                  if (!canAttachNode(node)) return
                  event.preventDefault()
                  setMenu({ x: event.clientX, y: event.clientY, node, viewKey })
                }}
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
