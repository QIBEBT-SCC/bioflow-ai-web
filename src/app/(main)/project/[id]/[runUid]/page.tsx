'use client'

import type { Node as FlowNode, NodeChange } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
} from '@xyflow/react'
import {
  BarChart3Icon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FileJsonIcon,
  FileTextIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from '@/components/ai-elements/file-tree'
import { Terminal, TerminalContent } from '@/components/ai-elements/terminal'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import { nodeTypes } from '@/components/node-editor/node-registry'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { StatusEdge } from '@/components/workflow/status-edge'
import { useProject } from '@/hooks/use-project'
import { useRunFiles, useRunStream } from '@/hooks/use-run'
import { useTaskLogStream } from '@/hooks/use-task'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import { type RunData, type RunFileNode, Status } from '@/types/run'

const edgeTypes = { default: StatusEdge }

const statusConfig = {
  [Status.WAITING]: {
    label: '等待中',
    variant: 'secondary' as const,
    icon: ClockIcon,
  },
  [Status.RUNNING]: {
    label: '运行中',
    variant: 'default' as const,
    icon: Loader2Icon,
  },
  [Status.ERROR]: {
    label: '失败',
    variant: 'destructive' as const,
    icon: XCircleIcon,
  },
  [Status.SUCCESS]: {
    label: '成功',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
  },
}

function renderOutputNode(node: RunFileNode) {
  if (node.type === 'folder') {
    return (
      <FileTreeFolder key={node.path} path={node.path} name={node.name}>
        {node.children.map(renderOutputNode)}
      </FileTreeFolder>
    )
  }
  return (
    <FileTreeFile
      key={node.path}
      path={node.path}
      name={node.name}
      icon={
        node.iconType === 'json' ? (
          <FileJsonIcon className='size-4 text-yellow-500' />
        ) : undefined
      }
    />
  )
}

function RunFlowContent({
  projectId,
  runUid,
}: {
  projectId: string
  runUid: string
}) {
  const { data: project } = useProject(projectId)
  const run = useRunStream(runUid)
  const { data: runFiles } = useRunFiles(runUid)
  const isOpen = useChatSidebarStore((s) => s.isOpen)
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([])
  const [statsOpen, setStatsOpen] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string>()
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [terminalHeight, setTerminalHeight] = useState(192)
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true
      startY.current = e.clientY
      startHeight.current = terminalHeight

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return
        const delta = startY.current - ev.clientY
        const newHeight = Math.min(
          600,
          Math.max(80, startHeight.current + delta),
        )
        setTerminalHeight(newHeight)
      }

      const onMouseUp = () => {
        isResizing.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [terminalHeight],
  )
  const [selectedToolNodeId, setSelectedToolNodeId] = useState<
    string | undefined
  >(undefined)

  const activeTaskUid = useMemo<string | undefined>(() => {
    if (selectedToolNodeId) return selectedToolNodeId
    const runningNode = flowNodes.find(
      (n) =>
        n.type === 'tool' &&
        (n.data?.run_data as RunData | undefined)?.status === Status.RUNNING,
    )
    return runningNode?.id
  }, [selectedToolNodeId, flowNodes])

  const isActiveNodeRunning = useMemo(() => {
    if (!activeTaskUid) return false
    const node = flowNodes.find((n) => n.id === activeTaskUid)
    return (
      (node?.data?.run_data as RunData | undefined)?.status === Status.RUNNING
    )
  }, [activeTaskUid, flowNodes])

  const logContent = useTaskLogStream(activeTaskUid ?? '', isActiveNodeRunning)

  useEffect(() => {
    if (run?.nodes) setFlowNodes(run.nodes)
  }, [run?.nodes, setFlowNodes])

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const positionChanges = changes.filter(
        (c) => c.type === 'position' || c.type === 'dimensions',
      )
      if (positionChanges.length > 0) onNodesChange(positionChanges)
    },
    [onNodesChange],
  )

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      if (node.type === 'tool') setSelectedToolNodeId(node.id)
    },
    [],
  )

  const handlePaneClick = useCallback(() => {
    setSelectedToolNodeId(undefined)
  }, [])

  const edges = useMemo(() => {
    if (!run?.edges || !run?.nodes) return []
    const nodeMap = new Map(run.nodes.map((n) => [n.id, n]))
    const withAnimate = [Status.RUNNING, Status.WAITING, undefined]
    return run.edges.map((e) => {
      const sourceNode = nodeMap.get(e.source)
      const runData = sourceNode?.data?.run_data as RunData | undefined
      const status = runData?.status
      return {
        ...e,
        animated: withAnimate.includes(status),
      }
    })
  }, [run?.edges, run?.nodes])

  const Icon = statusConfig[run?.status ?? Status.WAITING].icon

  return (
    <SidebarInset className='h-screen flex flex-col overflow-hidden'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex h-12 items-center gap-2 bg-background px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link
                  href='/project'
                  className='text-muted-foreground hover:text-foreground text-sm'
                >
                  项目
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Link
                  href={`/project/${projectId}`}
                  className='text-muted-foreground hover:text-foreground text-sm'
                >
                  {project?.name ?? projectId}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{run?.name ?? runUid}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className='ml-auto'>
            <ChatSidebarToggle />
          </div>
        </div>
      </header>

      {/* 主内容区：左侧面板 + 右侧画布 */}
      <div className='flex flex-1 min-h-0 overflow-hidden'>
        {/* 左侧面板：可折叠区块 + 文件树（VSCode 式折叠） */}
        <div className='flex shrink-0'>
          {/* 面板内容 */}
          <div
            className={`flex flex-col overflow-y-auto bg-background transition-all duration-200 ${leftPanelOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'} overflow-hidden`}
          >
            {/* 可折叠区块 1：运行统计 */}
            <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
              <CollapsibleTrigger className='flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 border-b'>
                <div className='flex items-center gap-2'>
                  <BarChart3Icon className='h-4 w-4 text-muted-foreground' />
                  运行统计
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-muted-foreground transition-transform ${statsOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='px-4 py-3 space-y-2 border-b bg-muted/20'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>运行状态</span>
                    {run ? (
                      <Badge variant={statusConfig[run.status].variant}>
                        <Icon
                          className={`h-3 w-3 ${run?.status === Status.RUNNING ? 'animate-spin' : ''}`}
                        />
                        {statusConfig[run.status].label}
                      </Badge>
                    ) : (
                      <span className='font-medium'>'--'</span>
                    )}
                  </div>
                  {[
                    {
                      label: '总任务数',
                      value: run?.task_statistics?.total ?? '--',
                    },
                    {
                      label: '成功任务',
                      value: run?.task_statistics?.success ?? '--',
                    },
                    {
                      label: '失败任务',
                      value: run?.task_statistics?.error ?? '--',
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>{label}</span>
                      <span className='font-medium'>{value}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 输出文件树 */}
            <div className='flex-1 overflow-y-auto'>
              <div className='px-4 py-3 text-sm font-medium border-b flex items-center gap-2 sticky top-0 bg-background'>
                <FileTextIcon className='h-4 w-4 text-muted-foreground' />
                输出文件
              </div>
              <div className='p-2'>
                <FileTree
                  defaultExpanded={new Set(['results', 'logs', 'reports'])}
                  selectedPath={selectedFile}
                  // biome-ignore lint/suspicious/noExplicitAny: FileTree.onSelect conflicts with HTMLAttributes.onSelect
                  onSelect={((path: string) => setSelectedFile(path)) as any}
                  className='border-0 rounded-none'
                >
                  {(runFiles ?? []).map(renderOutputNode)}
                </FileTree>
              </div>
            </div>
          </div>

          {/* VSCode 式折叠把手 */}
          <button
            type='button'
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className='w-4 shrink-0 border-r flex items-center justify-center hover:bg-muted/60 transition-colors bg-background group relative'
            title={leftPanelOpen ? '收起面板' : '展开面板'}
          >
            <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
              {leftPanelOpen ? (
                <ChevronLeftIcon className='h-3 w-3 text-muted-foreground' />
              ) : (
                <ChevronRightIcon className='h-3 w-3 text-muted-foreground' />
              )}
            </div>
          </button>
        </div>

        {/* 右侧：ReactFlow 画布 + 底部终端 */}
        <div className='flex flex-col flex-1 min-w-0 min-h-0'>
          {/* ReactFlow 画布 */}
          <div className='flex-1 min-h-0'>
            <ReadOnlyProvider value={true}>
              <ReactFlow
                nodes={flowNodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
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

          {/* 底部终端（VSCode 式折叠 + 拖拽调整高度） */}
          <div className='shrink-0 border-t'>
            {/* 拖拽调整把手 */}
            {terminalOpen && (
              <hr
                aria-orientation='horizontal'
                aria-label='拖拽调整终端高度'
                tabIndex={0}
                onMouseDown={handleResizeStart}
                className='h-1 w-full cursor-row-resize border-none bg-zinc-800 hover:bg-blue-500 transition-colors'
                title='拖拽调整终端高度'
              />
            )}
            {/* 终端标题栏：点击展开/收起 */}
            <button
              type='button'
              onClick={() => setTerminalOpen(!terminalOpen)}
              className='flex w-full items-center justify-between px-3 py-1 bg-zinc-900 hover:bg-zinc-800 transition-colors group'
              title={terminalOpen ? '收起终端' : '展开终端'}
            >
              <span className='text-xs text-zinc-400 font-mono flex items-center gap-1.5'>
                终端
              </span>
              <ChevronDownIcon
                className={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${terminalOpen ? '' : 'rotate-180'}`}
              />
            </button>
            <div
              className={`overflow-hidden ${terminalOpen ? '' : 'h-0'}`}
              style={terminalOpen ? { height: terminalHeight } : undefined}
            >
              <Terminal
                output={logContent ?? ''}
                isStreaming={isActiveNodeRunning}
                className='rounded-none border-0'
                style={{ height: terminalHeight }}
              >
                <TerminalContent className='max-h-full' />
              </Terminal>
            </div>
          </div>
        </div>

        {isOpen && <ChatSidebar pageKey={`run-${runUid}`} />}
      </div>
    </SidebarInset>
  )
}

export default function ProjectRunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runUid: string }>
}) {
  const { id, runUid } = use(params)
  return (
    <ReactFlowProvider>
      <RunFlowContent projectId={id} runUid={runUid} />
    </ReactFlowProvider>
  )
}
