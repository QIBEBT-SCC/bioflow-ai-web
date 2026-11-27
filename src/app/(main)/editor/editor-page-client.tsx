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
  ArrowLeftIcon,
  LogOutIcon,
  PanelRightIcon,
  PlayIcon,
  SaveIcon,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { getToolArg } from '@/app/actions/tool'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import type { PageCrumb } from '@/components/layout/page-shell'
import { ArrangeMenu } from '@/components/node-editor/arrange-menu'
import { EditorTopbar } from '@/components/node-editor/editor-topbar'
import { PanelMenu } from '@/components/node-editor/menu/panel-menu'
import {
  nodeDefaultData,
  nodeTypes,
} from '@/components/node-editor/node-registry'
import { SubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { SubgraphInterfaceEditor } from '@/components/node-editor/subgraph-interface-editor'
import { WorkflowFileMenu } from '@/components/node-editor/workflow-file-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useChatSidebarResize } from '@/hooks/use-chat-sidebar-resize'
import { useInitialWorkflowLayout } from '@/hooks/use-initial-workflow-layout'
import { useProject } from '@/hooks/use-project'
import { useNewRunInstance } from '@/hooks/use-run'
import { useSubgraphInterface } from '@/hooks/use-subgraph-interface'
import { useUpdateWorkflow, useWorkflow } from '@/hooks/use-workflow'
import { generateLetterId } from '@/lib/id-generator'
import { emptyInterface } from '@/lib/subgraph'
import { layoutSubgraph } from '@/lib/subgraph-interface'
import {
  prepareWorkflowNodes,
  type WorkflowLayoutMode,
} from '@/lib/workflow-layout'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import type { CodeInfo } from '@/types/code'
import { WorkflowType } from '@/types/workflow'

function buildEditorBaseCrumbs({
  isProjectMode,
  isSubgraphMode,
  projectId,
  projectName,
  projectsLabel,
  subgraphManagementLabel,
  editorTitle,
  workflowName,
}: {
  isProjectMode: boolean
  isSubgraphMode: boolean
  projectId: string | null
  projectName?: string
  projectsLabel: string
  subgraphManagementLabel: string
  editorTitle: string
  workflowName?: string
}): PageCrumb[] {
  const tail = workflowName ? [{ label: workflowName }] : []
  if (isProjectMode && projectId) {
    return [
      { label: projectsLabel, href: '/project' },
      { label: projectName ?? projectId, href: `/project/${projectId}` },
      ...tail,
    ]
  }
  if (isSubgraphMode) {
    return [{ label: subgraphManagementLabel, href: '/subgraph' }, ...tail]
  }
  return [{ label: editorTitle }, ...tail]
}

function SaveToolbarButton({
  variant,
  disabled,
  isSaving,
  inSubgraph,
  onSave,
}: {
  variant: 'default' | 'outline'
  disabled: boolean
  isSaving: boolean
  inSubgraph: boolean
  onSave: () => void
}) {
  const t = useTranslations('editor')
  const button = (
    <Button variant={variant} size='sm' onClick={onSave} disabled={disabled}>
      <SaveIcon className='size-4' />
      {isSaving ? t('saving') : t('save')}
    </Button>
  )
  if (!inSubgraph) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{t('subgraph.save_workflow_hint')}</TooltipContent>
    </Tooltip>
  )
}

function EditorPrimaryAction({
  showExit,
  isSubmodule,
  isRunning,
  onExit,
  onRun,
}: {
  showExit: boolean
  isSubmodule: boolean
  isRunning: boolean
  onExit: () => void
  onRun: () => void
}) {
  const t = useTranslations('editor')
  if (showExit) {
    return (
      <Button variant='outline' size='sm' onClick={onExit}>
        <LogOutIcon className='size-4' />
        {t('exit')}
      </Button>
    )
  }
  if (isSubmodule) return null
  return (
    <Button size='sm' onClick={onRun} disabled={isRunning}>
      <PlayIcon className='size-4' />
      {isRunning ? t('running') : t('run')}
    </Button>
  )
}

function EditorToolbar({
  workflowName,
  hasLoadedWorkflow,
  isSaving,
  isRunning,
  isProjectMode,
  isSubgraphMode,
  isSubmodule,
  inSubgraph,
  hasNodes,
  hasEdges,
  edgesReady,
  hasInterface,
  interfacePanelOpen,
  onBackToParent,
  onWorkflowLoaded,
  onSave,
  onLayout,
  onCleanEdges,
  onToggleInterface,
  onExit,
  onRun,
}: {
  workflowName?: string
  hasLoadedWorkflow: boolean
  isSaving: boolean
  isRunning: boolean
  isProjectMode: boolean
  isSubgraphMode: boolean
  isSubmodule: boolean
  inSubgraph: boolean
  hasNodes: boolean
  hasEdges: boolean
  edgesReady: boolean
  hasInterface: boolean
  interfacePanelOpen: boolean
  onBackToParent: () => void
  onWorkflowLoaded: () => void
  onSave: () => void
  onLayout: (mode: WorkflowLayoutMode) => void
  onCleanEdges: () => void
  onToggleInterface: () => void
  onExit: () => void
  onRun: () => void
}) {
  const t = useTranslations('editor')
  const showExit = isProjectMode || isSubgraphMode
  const saveVariant = showExit || isSubmodule ? 'default' : 'outline'
  const interfaceToggleLabel = t(
    interfacePanelOpen ? 'subgraph.hide_interface' : 'subgraph.show_interface',
  )

  return (
    <TooltipProvider>
      <div className='flex h-11 items-center gap-1 border-b bg-muted/30 px-3'>
        {inSubgraph && (
          <>
            <Button variant='ghost' size='sm' onClick={onBackToParent}>
              <ArrowLeftIcon className='size-4' />
              {t('subgraph.back_to_parent')}
            </Button>
            <Separator orientation='vertical' className='mx-1 h-5!' />
          </>
        )}
        <WorkflowFileMenu
          workflowName={workflowName}
          allowLoad={!showExit}
          onWorkflowLoaded={onWorkflowLoaded}
        />
        <SaveToolbarButton
          variant={saveVariant}
          disabled={!hasLoadedWorkflow || isSaving}
          isSaving={isSaving}
          inSubgraph={inSubgraph}
          onSave={onSave}
        />

        <Separator orientation='vertical' className='mx-1 h-5!' />

        <ArrangeMenu
          layoutDisabled={!hasNodes}
          cleanEdgesDisabled={!hasEdges || !edgesReady}
          onLayout={onLayout}
          onCleanEdges={onCleanEdges}
        />

        <div className='ml-auto flex items-center gap-2'>
          {!showExit && (
            <span className='hidden text-xs text-muted-foreground xl:inline'>
              {t('right_click_to_add')}
            </span>
          )}
          {hasInterface && (
            <Button
              variant={interfacePanelOpen ? 'secondary' : 'ghost'}
              size='sm'
              onClick={onToggleInterface}
              aria-label={interfaceToggleLabel}
            >
              <PanelRightIcon className='size-4' />
              <span className='hidden sm:inline'>
                {t('subgraph.interface')}
              </span>
            </Button>
          )}
          <EditorPrimaryAction
            showExit={showExit}
            isSubmodule={isSubmodule}
            isRunning={isRunning}
            onExit={onExit}
            onRun={onRun}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}

function FlowContent() {
  const t = useTranslations('editor')
  const tProject = useTranslations('Project.detail.breadcrumb')
  const graphInterface = useNodeEditorStore((state) => state.graphInterface)
  const parents = useNodeEditorStore((state) => state.parents)

  const {
    currentWorkflowUid,
    setCurrentWorkflowUid,
    nodes,
    edges,
    setNodes,
    setEdges,
  } = useNodeEditorStore(
    useShallow((state) => ({
      currentWorkflowUid: state.currentWorkflowUid,
      setCurrentWorkflowUid: state.setCurrentWorkflowUid,
      nodes: state.nodes,
      edges: state.edges,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
    })),
  )

  const interfaceCanvas = useSubgraphInterface()

  const isOpen = useChatSidebarStore((s) => s.isOpen)
  const { chatSidebarWidth, handleChatResizeStart } = useChatSidebarResize()

  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const workflowUidParam = searchParams.get('workflowUid')
  const fromParam = searchParams.get('from')
  const isProjectMode = !!projectId
  const isSubgraphMode = !isProjectMode && fromParam === 'subgraph'

  const { fitView, getInternalNode, screenToFlowPosition } = useReactFlow()
  const { data: projectData } = useProject(projectId ?? '')
  const { data: workflowData, dataUpdatedAt: workflowDataUpdatedAt } =
    useWorkflow(currentWorkflowUid)
  const updateWorkflowMutation = useUpdateWorkflow()
  const runMutation = useNewRunInstance()
  const isSubmodule = workflowData?.wf_type === WorkflowType.SUBMODULE

  const [clickPosition, setClickPosition] = useState<XYPosition>({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [interfacePanelOpen, setInterfacePanelOpen] = useState(true)
  const prevWorkflowUidParamRef = useRef<string | null>(null)
  const loadedWorkflowUidRef = useRef<string | null>(null)
  const skipNextReloadUidRef = useRef<string | null>(null)
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

  // 从项目页或子图管理页跳转时，仅在 URL 参数变化时同步加载指定 workflow
  useEffect(() => {
    if (
      workflowUidParam &&
      workflowUidParam !== prevWorkflowUidParamRef.current
    ) {
      prevWorkflowUidParamRef.current = workflowUidParam
      if (workflowUidParam !== currentWorkflowUid) {
        setCurrentWorkflowUid(workflowUidParam)
      }
    } else if (!workflowUidParam) {
      prevWorkflowUidParamRef.current = null
    }
  }, [workflowUidParam, currentWorkflowUid, setCurrentWorkflowUid])

  // 加载workflow数据（同工作流刷新保留子图路径，并自动为子模块初始化接口）
  useEffect(() => {
    if (!preparedWorkflow || !workflowData) return
    if (skipNextReloadUidRef.current === currentWorkflowUid) {
      skipNextReloadUidRef.current = null
      return
    }
    const preservePath = loadedWorkflowUidRef.current === currentWorkflowUid
    loadedWorkflowUidRef.current = currentWorkflowUid
    const effectiveInterface =
      workflowData.workflow.interface ??
      (workflowData.wf_type === WorkflowType.SUBMODULE
        ? emptyInterface()
        : null)
    useNodeEditorStore.getState().loadGraph(
      {
        nodes: preparedWorkflow.nodes,
        edges: preparedWorkflow.edges,
        interface: effectiveInterface,
      },
      { preservePath },
    )
  }, [currentWorkflowUid, preparedWorkflow, workflowData])

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
    if (!currentWorkflowUid || !workflowData?.workflow) {
      toast.error(t('no_workflow_loaded'))
      return
    }

    const savingUid = currentWorkflowUid
    updateWorkflowMutation.mutate(
      {
        uid: savingUid,
        data: { workflow: useNodeEditorStore.getState().getRootGraph() },
      },
      {
        onSuccess: () => {
          skipNextReloadUidRef.current = savingUid
        },
      },
    )
  }, [currentWorkflowUid, updateWorkflowMutation, workflowData, t])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (
          currentWorkflowUid &&
          workflowData?.workflow &&
          !updateWorkflowMutation.isPending
        ) {
          onSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    currentWorkflowUid,
    workflowData?.workflow,
    updateWorkflowMutation.isPending,
    onSave,
  ])

  // 退出项目或子图管理编辑模式，返回来源页
  const onExit = useCallback(() => {
    if (projectId) {
      router.push(`/project/${projectId}`)
    } else if (isSubgraphMode) {
      router.push('/subgraph')
    }
  }, [projectId, isSubgraphMode, router])

  const onBackToParent = useCallback(() => {
    useNodeEditorStore.getState().leaveSubgraph()
    requestAnimationFrame(() => void fitView({ padding: 0.15 }))
  }, [fitView])

  const baseCrumbs = useMemo<PageCrumb[]>(
    () =>
      buildEditorBaseCrumbs({
        isProjectMode,
        isSubgraphMode,
        projectId,
        projectName: projectData?.name,
        projectsLabel: tProject('projects'),
        subgraphManagementLabel: t('subgraph.management.title'),
        editorTitle: t('title'),
        workflowName: workflowData?.name,
      }),
    [
      isProjectMode,
      isSubgraphMode,
      projectId,
      projectData?.name,
      tProject,
      t,
      workflowData?.name,
    ],
  )

  // 运行workflow
  const onRun = useCallback(() => {
    const workflow = useNodeEditorStore.getState().getRootGraph()
    const template_name = workflowData?.name

    runMutation.mutate({ workflow, template_name })
  }, [workflowData?.name, runMutation])

  const onAutoLayout = useCallback(
    (mode: WorkflowLayoutMode) => {
      const store = useNodeEditorStore.getState()
      const layouted = layoutSubgraph(store.getGraph(), { mode })
      store.setNodes(layouted.nodes)
      if (layouted.interface) store.setInterface(layouted.interface)
      toast.success(t('layout_complete'))

      requestAnimationFrame(() => {
        void fitView({ padding: 0.15, duration: 500 })
      })
    },
    [fitView, t],
  )

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
    <SidebarInset className='flex h-screen flex-row overflow-hidden'>
      <div className='flex-1 flex flex-col min-w-0'>
        <header className='flex shrink-0 flex-col'>
          <EditorTopbar
            title={t('title')}
            workflowName={workflowData?.name}
            baseCrumbs={baseCrumbs}
            actions={<ChatSidebarToggle />}
          />

          {/* 工具栏：返回上级 | 文档操作 | 保存 | 画布整理 | 面板切换 | 运行/退出 */}
          <EditorToolbar
            workflowName={workflowData?.name}
            hasLoadedWorkflow={Boolean(
              currentWorkflowUid && workflowData?.workflow,
            )}
            isSaving={updateWorkflowMutation.isPending}
            isRunning={runMutation.isPending}
            isProjectMode={isProjectMode}
            isSubgraphMode={isSubgraphMode}
            isSubmodule={isSubmodule}
            inSubgraph={parents.length > 0}
            hasNodes={nodes.length > 0}
            hasEdges={edges.length > 0}
            edgesReady={edgesReady}
            hasInterface={Boolean(graphInterface)}
            interfacePanelOpen={interfacePanelOpen}
            onBackToParent={onBackToParent}
            onWorkflowLoaded={() => {
              if (workflowUidParam || fromParam) router.replace('/editor')
            }}
            onSave={onSave}
            onLayout={onAutoLayout}
            onCleanEdges={onCleanDirtyEdges}
            onToggleInterface={() => setInterfacePanelOpen((open) => !open)}
            onExit={onExit}
            onRun={onRun}
          />
        </header>

        {/* React Flow 画布 */}
        <div className='flex min-h-0 flex-1 w-full'>
          <div className='relative min-w-0 flex-1'>
            <SubgraphNavigation
              value={(id) => {
                useNodeEditorStore.getState().enterSubgraph(id)
                requestAnimationFrame(() => void fitView({ padding: 0.15 }))
              }}
            >
              <ReactFlow
                nodes={interfaceCanvas.nodes}
                edges={[...renderedEdges, ...interfaceCanvas.edges]}
                onNodesChange={interfaceCanvas.onNodesChange}
                onEdgesChange={interfaceCanvas.onEdgesChange}
                onConnect={interfaceCanvas.onConnect}
                isValidConnection={interfaceCanvas.isValidConnection}
                onPaneContextMenu={onPaneContextMenu}
                onSelectionContextMenu={onPaneContextMenu}
                onNodeContextMenu={onPaneContextMenu}
                onPaneClick={closeMenu}
                nodeTypes={nodeTypes}
                deleteKeyCode={['Backspace', 'Delete']}
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
            </SubgraphNavigation>
          </div>
          {graphInterface && interfacePanelOpen && (
            <SubgraphInterfaceEditor
              onClose={() => setInterfacePanelOpen(false)}
            />
          )}

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
