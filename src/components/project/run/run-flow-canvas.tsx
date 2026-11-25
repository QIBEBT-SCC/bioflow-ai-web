import type { Node as FlowNode } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from '@xyflow/react'
import { MessageSquarePlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo, useState } from 'react'
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
import { useRunFlow } from '@/hooks/use-run-flow'
import type { WorkflowRunV2 } from '@/types/workflow-v2'

const edgeTypes = { default: StatusEdge }

interface RunFlowCanvasProps {
  viewKey?: string
  runLink: (runUid: string) => string
  visibleRun: WorkflowRunV2 | null
  onEnterSubgraph: (id: string) => void
  onNodeClick: (event: React.MouseEvent, node: FlowNode) => void
  onPaneClick: () => void
  onAddNodeToChat: (node: FlowNode, resolvedName: string) => void
}

export const RunFlowCanvas = memo(function RunFlowCanvas({
  viewKey,
  runLink,
  visibleRun,
  onEnterSubgraph,
  onNodeClick,
  onPaneClick,
  onAddNodeToChat,
}: RunFlowCanvasProps) {
  const t = useTranslations('Chat.node')
  const { flowNodes, edges, handleNodesChange, toolNames } =
    useRunFlow(visibleRun)
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
              if (menu) {
                const resolvedName = String(
                  menu.node.data.name ||
                    toolNames.get(String(menu.node.data.tool_uid)) ||
                    menu.node.id,
                )
                onAddNodeToChat(menu.node, resolvedName)
              }
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
                nodes={flowNodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onNodeClick={onNodeClick}
                onNodeContextMenu={(event, node) => {
                  if (!visibleRun?.nodes.some((saved) => saved.id === node.id))
                    return
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
                <SubgraphInterfaceSummary value={visibleRun?.interface} />
                <Controls />
              </ReactFlow>
            </SubgraphNavigation>
          </RunLinkProvider>
        </ReadOnlyProvider>
      </div>
    </div>
  )
})
