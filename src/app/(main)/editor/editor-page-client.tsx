'use client'

import { useQueries } from '@tanstack/react-query'
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type XYPosition,
} from '@xyflow/react'
import {
  LogOutIcon,
  PlayIcon,
  SaveIcon,
  UnlinkIcon,
  WandSparklesIcon,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { getToolArg } from '@/app/actions/tool'
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
import { useChatSidebarResize } from '@/hooks/use-chat-sidebar-resize'
import { useInitialWorkflowLayout } from '@/hooks/use-initial-workflow-layout'
import { useNewRunInstance } from '@/hooks/use-run'
import { useUpdateWorkflow, useWorkflow } from '@/hooks/use-workflow'
import { generateLetterId } from '@/lib/id-generator'
import {
  layoutWorkflowNodes,
  prepareWorkflowNodes,
} from '@/lib/workflow-layout'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import type { CodeInfo } from '@/types/code'

function FlowContent() {
  const t = useTranslations('editor')

  const {
    currentWorkflowUid,
    setCurrentWorkflowUid,
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
      setCurrentWorkflowUid: state.setCurrentWorkflowUid,
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
  const { chatSidebarWidth, handleChatResizeStart } = useChatSidebarResize()

  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const workflowUidParam = searchParams.get('workflowUid')
  const isProjectMode = !!projectId

  const { fitView, getInternalNode, getNodes, screenToFlowPosition } =
    useReactFlow()
  const { data: workflowData, dataUpdatedAt: workflowDataUpdatedAt } =
    useWorkflow(currentWorkflowUid)
  const updateWorkflowMutation = useUpdateWorkflow()
  const runMutation = useNewRunInstance()

  const [clickPosition, setClickPosition] = useState<XYPosition>({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const preparedWorkflow = useMemo(() => {
    if (!currentWorkflowUid || !workflowData?.workflow) {
      return null
    }

    const workflowNodes = workflowData.workflow.nodes || []
    const workflowEdges = workflowData.workflow.edges || []
    const prepared = prepareWorkflowNodes(workflowNodes)
    const layoutKey = prepared.needsLayout
      ? [
          currentWorkflowUid,
          workflowDataUpdatedAt,
          ...workflowNodes.map((node) => node.id),
          ...workflowEdges.map((edge) => `${edge.source}>${edge.target}`),
        ].join('|')
      : null

    return { ...prepared, edges: workflowEdges, layoutKey }
  }, [currentWorkflowUid, workflowData, workflowDataUpdatedAt])
  const toolUids = useMemo(() => {
    const uids = new Set<string>()
    for (const node of nodes) {
      if (node.type !== 'tool') {
        continue
      }

      const toolUid = node.data?.tool_uid
      if (typeof toolUid === 'string' && toolUid) {
        uids.add(toolUid)
      }
    }

    return [...uids]
  }, [nodes])

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
  const edgeReadinessKey = `${currentWorkflowUid}:${toolUids.join('|')}:${nodes.map((node) => node.id).join('|')}`

  const [edgesReady, setEdgesReady] = useState(false)

  useInitialWorkflowLayout({
    edges,
    layoutKey: preparedWorkflow?.layoutKey ?? null,
    nodesReady: allToolsLoaded,
    setNodes,
  })

  // 从项目页跳转时，将 URL 中指定的 workflow 加载到编辑器
  useEffect(() => {
    if (workflowUidParam && workflowUidParam !== currentWorkflowUid) {
      setCurrentWorkflowUid(workflowUidParam)
    }
  }, [workflowUidParam, currentWorkflowUid, setCurrentWorkflowUid])

  // 加载workflow数据
  useEffect(() => {
    if (preparedWorkflow) {
      setNodes(preparedWorkflow.nodes)
      setEdges(preparedWorkflow.edges)
    }
  }, [preparedWorkflow, setNodes, setEdges])

  // Tool 节点的 handles 依赖异步 tool args；等 handles commit 到 DOM 后再渲染 edges，避免 React Flow 008 警告。
  useEffect(() => {
    setEdgesReady(false)
    if (!allToolsLoaded || !edgeReadinessKey) {
      return
    }

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setEdgesReady(true))
      return () => cancelAnimationFrame(raf2)
    })
    return () => cancelAnimationFrame(raf1)
  }, [allToolsLoaded, edgeReadinessKey])

  const renderedEdges = useMemo<Edge[]>(
    () => (edgesReady ? edges : []),
    [edges, edgesReady],
  )

  // 添加节点（通用方法）
  const onAddNode = useCallback(
    (nodeType: string, resourceId?: string, resourceName?: string) => {
      const nodeId = generateLetterId()
      const position = screenToFlowPosition(clickPosition, { snapToGrid: true })
      const selectedNodes =
        nodeType === 'note'
          ? nodes.filter((node) => node.selected && node.type !== 'note')
          : []
      const anchorNodeId =
        selectedNodes.length === 1 ? selectedNodes[0].id : null

      // 节点默认 data（特殊节点覆盖 registry 默认值）
      const defaultData = {
        ...nodeDefaultData[nodeType],
        ...(nodeType === 'tool' && { tool_uid: resourceId }),
        ...(nodeType === 'resource_db' && {
          db_id: resourceId,
          db_name: resourceName ?? '',
        }),
        ...(nodeType === 'note' && { anchor_node_id: anchorNodeId }),
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

      setNodes((prev) => [...prev, newNode])
      toast.success(t('node_added'))
    },
    [clickPosition, nodes, screenToFlowPosition, setNodes, t],
  )

  const onAddExistingCode = useCallback(
    (code: CodeInfo) => {
      const nodeId = generateLetterId()
      const position = screenToFlowPosition(clickPosition, { snapToGrid: true })
      const data = {
        code: code.code,
        description: code.description,
        ...(code.node_type === 'code_python' && {
          dependencies: [...code.dependencies],
        }),
      }

      setNodes((prev) => [
        ...prev,
        {
          id: nodeId,
          type: code.node_type,
          dragHandle: '.nodeDragable',
          position,
          data,
          zIndex: 20,
        },
      ])
      toast.success(t('node_added'))
    },
    [clickPosition, screenToFlowPosition, setNodes, t],
  )

  // 保存workflow
  const onSave = useCallback(() => {
    if (!currentWorkflowUid) {
      toast.error(t('no_workflow_loaded'))
      return
    }

    const workflow = { nodes, edges }
    updateWorkflowMutation.mutate({
      uid: currentWorkflowUid,
      data: { workflow },
    })
  }, [currentWorkflowUid, nodes, edges, updateWorkflowMutation, t])

  // 退出项目内编辑模式，返回项目页
  const onExit = useCallback(() => {
    if (projectId) {
      router.push(`/project/${projectId}`)
    }
  }, [projectId, router])

  // 运行workflow
  const onRun = useCallback(() => {
    const workflow = { nodes, edges }
    const template_name = workflowData?.name

    runMutation.mutate({ workflow, template_name })
  }, [nodes, edges, workflowData?.name, runMutation])

  const onAutoLayout = useCallback(() => {
    const layoutedNodes = layoutWorkflowNodes(getNodes(), edges)
    setNodes(layoutedNodes)
    toast.success(t('layout_complete'))

    requestAnimationFrame(() => {
      void fitView({ padding: 0.15, duration: 500 })
    })
  }, [edges, fitView, getNodes, setNodes, t])

  const onCleanDirtyEdges = useCallback(() => {
    const nodeIds = new Set(nodes.map((node) => node.id))
    const seenConnections = new Set<string>()
    const cleanEdges = edges.filter((edge) => {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        return false
      }

      const sourceHandles = getInternalNode(edge.source)?.internals.handleBounds
        ?.source
      const targetHandles = getInternalNode(edge.target)?.internals.handleBounds
        ?.target
      const hasSourceHandle = sourceHandles?.some(
        (handle) => handle.id === edge.sourceHandle,
      )
      const hasTargetHandle = targetHandles?.some(
        (handle) => handle.id === edge.targetHandle,
      )

      if (!hasSourceHandle || !hasTargetHandle) {
        return false
      }

      const connectionKey = JSON.stringify([
        edge.source,
        edge.sourceHandle,
        edge.target,
        edge.targetHandle,
      ])
      if (seenConnections.has(connectionKey)) {
        return false
      }

      seenConnections.add(connectionKey)
      return true
    })

    const removedCount = edges.length - cleanEdges.length
    if (removedCount === 0) {
      toast.info(t('no_dirty_edges'))
      return
    }

    setEdges(cleanEdges)
    toast.success(t('dirty_edges_removed', { count: removedCount }))
  }, [edges, getInternalNode, nodes, setEdges, t])

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
            <Separator orientation='vertical' className='mr-2! h-4!' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>{t('title')}</BreadcrumbPage>
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
              {isProjectMode ? (
                <>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onSave}
                    disabled={
                      !currentWorkflowUid || updateWorkflowMutation.isPending
                    }
                  >
                    <SaveIcon className='size-4 mr-2' />
                    {updateWorkflowMutation.isPending ? t('saving') : t('save')}
                  </Button>

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onAutoLayout}
                    disabled={nodes.length === 0}
                  >
                    <WandSparklesIcon className='size-4 mr-2' />
                    {t('auto_layout')}
                  </Button>

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onCleanDirtyEdges}
                    disabled={edges.length === 0 || !edgesReady}
                  >
                    <UnlinkIcon className='size-4 mr-2' />
                    {t('clean_dirty_edges')}
                  </Button>

                  <Button variant='ghost' size='sm' onClick={onExit}>
                    <LogOutIcon className='size-4 mr-2' />
                    {t('exit')}
                  </Button>
                </>
              ) : (
                <>
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
                    {updateWorkflowMutation.isPending ? t('saving') : t('save')}
                  </Button>

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onAutoLayout}
                    disabled={nodes.length === 0}
                  >
                    <WandSparklesIcon className='size-4 mr-2' />
                    {t('auto_layout')}
                  </Button>

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onCleanDirtyEdges}
                    disabled={edges.length === 0 || !edgesReady}
                  >
                    <UnlinkIcon className='size-4 mr-2' />
                    {t('clean_dirty_edges')}
                  </Button>

                  <SaveAsDialog
                    currentWorkflowName={workflowData?.name}
                    disabled={nodes.length === 0}
                  />

                  <Separator orientation='vertical' className='h-8! mx-2' />

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onRun}
                    disabled={runMutation.isPending}
                  >
                    <PlayIcon className='size-4 mr-2 text-green-500' />
                    {runMutation.isPending ? t('running') : t('run')}
                  </Button>

                  <Separator orientation='vertical' className='h-8! mx-2' />

                  <div className='text-sm text-muted-foreground'>
                    {t('right_click_to_add')}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* React Flow 画布 */}
        <div className='flex-1 w-full'>
          <ReactFlow
            nodes={nodes}
            edges={renderedEdges}
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
              className='bg-gray-100!'
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
            onSelectCode={onAddExistingCode}
          />
        </div>
      </div>
      {isOpen && (
        <ChatSidebar
          projectId={projectId ?? undefined}
          width={chatSidebarWidth}
          onResizeStartAction={handleChatResizeStart}
        />
      )}
    </SidebarInset>
  )
}

export function EditorPageClient() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  )
}
