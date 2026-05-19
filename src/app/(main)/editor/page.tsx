'use client'

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type XYPosition,
} from '@xyflow/react'
import { PlayIcon, SaveIcon } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import { LoadWorkflowDialog } from '@/components/node-editor/load-workflow-dialog'
import { PanelMenu } from '@/components/node-editor/menu/panel-menu'
import {
  nodeDefaultData,
  nodeTypes,
} from '@/components/node-editor/node-registry'
import { SaveAsDialog } from '@/components/node-editor/save-as-dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useNewRunInstance } from '@/hooks/use-run'
import { useUpdateWorkflow, useWorkflow } from '@/hooks/use-workflow'
import { generateLetterId } from '@/lib/id-generator'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

function FlowContent() {
  const {
    currentWorkflowUid,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
  } = useNodeEditorStore(
    useShallow((state) => ({
      currentWorkflowUid: state.currentWorkflowUid,
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
    })),
  )

  const isOpen = useChatSidebarStore((s) => s.isOpen)

  const { screenToFlowPosition } = useReactFlow()
  const { data: workflowData } = useWorkflow(currentWorkflowUid)
  const updateWorkflowMutation = useUpdateWorkflow()
  const runMutation = useNewRunInstance()

  const [clickPosition, setClickPosition] = useState<XYPosition>({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 加载workflow数据
  useEffect(() => {
    if (currentWorkflowUid && workflowData?.workflow) {
      setNodes(workflowData.workflow.nodes || [])
      setEdges(workflowData.workflow.edges || [])
    }
  }, [currentWorkflowUid, workflowData, setNodes, setEdges])

  // 添加节点（通用方法）
  const onAddNode = useCallback(
    (nodeType: string, resourceId?: string, resourceName?: string) => {
      const nodeId = generateLetterId()
      const position = screenToFlowPosition(clickPosition, { snapToGrid: true })

      // 节点默认 data（特殊节点覆盖 registry 默认值）
      const defaultData = {
        ...nodeDefaultData[nodeType],
        ...(nodeType === 'tool' && { tool_uid: resourceId }),
        ...(nodeType === 'resource_db' && {
          db_id: resourceId,
          db_name: resourceName ?? '',
        }),
      }

      const config = { data: defaultData }
      const newNode = {
        id: nodeId,
        type: nodeType,
        dragHandle: '.nodeDragable',
        position,
        data: config?.data ?? {},
        zIndex: nodeType === 'note' ? -10 : 20,
      }

      setNodes([...nodes, newNode])
      toast.success('节点已添加')
    },
    [nodes, clickPosition, screenToFlowPosition, setNodes],
  )

  // 保存workflow
  const onSave = useCallback(() => {
    if (!currentWorkflowUid) {
      toast.error('请先加载一个workflow')
      return
    }

    const workflow = { nodes, edges }
    updateWorkflowMutation.mutate({
      uid: currentWorkflowUid,
      data: { workflow },
    })
  }, [currentWorkflowUid, nodes, edges, updateWorkflowMutation])

  // 运行workflow
  const onRun = useCallback(() => {
    const workflow = { nodes, edges }
    const template_name = workflowData?.name

    runMutation.mutate({ workflow, template_name })
  }, [nodes, edges, workflowData?.name, runMutation])

  // 右键菜单 - 记录点击位置并打开菜单
  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
      event.preventDefault()
      setClickPosition({ x: event.clientX, y: event.clientY })
      setIsMenuOpen(true)
    },
    [],
  )

  // 关闭菜单
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <SidebarInset className='h-screen flex flex-row'>
      <div className='flex-1 flex flex-col min-w-0'>
        <header className='flex flex-col shrink-0 border-b'>
          <div className='flex h-12 items-center gap-2 bg-background px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>节点编辑器</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className='ml-auto'>
              <ChatSidebarToggle />
            </div>
          </div>

          {/* 工具栏 */}
          <div className='flex h-12 items-center border-t bg-muted/30 px-3'>
            <div className='flex items-center gap-1'>
              <LoadWorkflowDialog />

              <Button
                variant='ghost'
                size='sm'
                onClick={onSave}
                disabled={
                  !currentWorkflowUid || updateWorkflowMutation.isPending
                }
              >
                <SaveIcon className='size-4 mr-2' />
                {updateWorkflowMutation.isPending ? '保存中...' : '保存'}
              </Button>

              <SaveAsDialog
                currentWorkflowName={workflowData?.name}
                disabled={nodes.length === 0}
              />

              <Separator orientation='vertical' className='!h-8 mx-2' />

              <Button
                variant='ghost'
                size='sm'
                onClick={onRun}
                disabled={runMutation.isPending}
              >
                <PlayIcon className='size-4 mr-2 text-green-500' />
                {runMutation.isPending ? '运行中...' : '运行'}
              </Button>

              <Separator orientation='vertical' className='!h-8 mx-2' />

              <div className='text-sm text-muted-foreground'>
                右键点击画布添加节点
              </div>
            </div>
          </div>
        </header>

        {/* React Flow 画布 */}
        <div className='flex-1 w-full'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={closeMenu}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ animated: true }}
            fitView
            className='bg-gray-50'
          >
            <Background
              variant={BackgroundVariant.Dots}
              className='!bg-gray-100'
            />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>

          {/* 右键菜单 */}
          <PanelMenu
            isOpen={isMenuOpen}
            position={clickPosition}
            onClose={closeMenu}
            onSelectTool={onAddNode}
          />
        </div>
      </div>
      {isOpen && <ChatSidebar pageKey='editor' />}
    </SidebarInset>
  )
}

export default function EditorPage() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  )
}
