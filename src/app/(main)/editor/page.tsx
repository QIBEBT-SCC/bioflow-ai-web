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
import { LoadWorkflowDialog } from '@/components/node-editor/load-workflow-dialog'
import { PanelMenu } from '@/components/node-editor/menu/panel-menu'
import { SaveAsDialog } from '@/components/node-editor/save-as-dialog'
import {
  PythonCodeNode,
  RCodeNode,
} from '@/components/node-editor/node/code-node'
import {Copy2FolderNode, GlobalMarkerNode} from '@/components/node-editor/node/data-node'
import {
  DBInputNode,
  FileInputNode,
  ReferenceInputNode,
  SequenceInputNode,
  StringInputNode,
} from '@/components/node-editor/node/input-node'
import { NoteNode } from '@/components/node-editor/node/note-node'
import { ToolNode } from '@/components/node-editor/node/tool-node'
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
import { useNodeEditorStore } from '@/stores/nodeviewStore'

// 注册节点类型
const nodeTypes = {
  tool: ToolNode,
  resource_value_string: StringInputNode,
  resource_file: FileInputNode,
  resource_sequence: SequenceInputNode,
  resource_db: DBInputNode,
  resource_genome: ReferenceInputNode,
  processor_copy2folder: Copy2FolderNode,
  global_mark: GlobalMarkerNode,
  // processor_concat: ConcatNode,
  code_R: RCodeNode,
  code_python: PythonCodeNode,
  note: NoteNode,
  // lineFig: LineFigNode,
}

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
    (nodeType: string, resourceId?: string) => {
      const nodeId = generateLetterId()
      const position = screenToFlowPosition(clickPosition, { snapToGrid: true })

      // 节点配置
      const nodeConfig: Record<string, any> = {
        tool: { data: { resource_uid: resourceId, args: '' } },
        resource_db: { data: { resource_uid: resourceId, args: '' } },
        value_string: { data: { args: '' } },
        resource_file: { data: { args: '' } },
        code_R: { data: { args: { description: '', code: '' } } },
        code_python: { data: { args: { description: '', code: '' } } },
        note: { data: { args: '' } },
      }

      const config = nodeConfig[nodeType]
      const newNode = {
        id: nodeId,
        type: nodeType,
        dragHandle: '.nodeDragable',
        position,
        data: config?.data ?? { args: '' },
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
    updateWorkflowMutation.mutate({ uid: currentWorkflowUid, workflow })
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
    <SidebarInset className='h-screen flex flex-col'>
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
        </div>

        {/* 工具栏 */}
        <div className='flex h-12 items-center border-t bg-muted/30 px-3'>
          <div className='flex items-center gap-1'>
            <LoadWorkflowDialog />

            <Button
              variant='ghost'
              size='sm'
              onClick={onSave}
              disabled={!currentWorkflowUid || updateWorkflowMutation.isPending}
            >
              <SaveIcon className='h-4 w-4 mr-2' />
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
              <PlayIcon className='h-4 w-4 mr-2 text-green-500' />
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
