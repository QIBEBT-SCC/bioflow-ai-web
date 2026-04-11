'use client'

import type { Node as FlowNode, NodeChange } from '@xyflow/react'
import { ReactFlowProvider, useNodesState } from '@xyflow/react'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRunFileBlobUrl, getRunFileContent } from '@/app/actions/run'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { FileViewer } from '@/components/project/run/file-viewer'
import { RunFlowCanvas } from '@/components/project/run/run-flow-canvas'
import { RunLeftPanel } from '@/components/project/run/run-left-panel'
import { RunPageHeader } from '@/components/project/run/run-page-header'
import {
  CANVAS_TAB_ID,
  type FileTab,
  type FileType,
  RunTabBar,
} from '@/components/project/run/run-tab-bar'

const IMAGE_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'bmp',
  'tif',
  'tiff',
])
const HTML_EXTS = new Set(['html', 'htm'])
const PDF_EXTS = new Set(['pdf'])

function getFileType(name: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (PDF_EXTS.has(ext)) return 'pdf'
  if (HTML_EXTS.has(ext)) return 'html'
  if (ext === 'json') return 'json'
  return 'text'
}

import { RunTerminal } from '@/components/project/run/run-terminal'
import { SidebarInset } from '@/components/ui/sidebar'
import { useProject } from '@/hooks/use-project'
import { useRunFiles, useRunStream } from '@/hooks/use-run'
import { useTaskLogStream } from '@/hooks/use-task'
import { cn } from '@/lib/utils'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import { type RunData, Status } from '@/types/run'

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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [terminalHeight, setTerminalHeight] = useState(192)
  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  // Tab 状态
  const [openTabs, setOpenTabs] = useState<FileTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>(CANVAS_TAB_ID)

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

  const handleSelectFile = useCallback(
    async (path: string) => {
      const name = path.split('/').pop() ?? path
      // 已开启则直接切换
      if (openTabs.some((t) => t.id === path)) {
        setActiveTabId(path)
        return
      }
      const fileType = getFileType(name)
      // 创建 loading tab
      setOpenTabs((prev) => [
        ...prev,
        { id: path, path, name, fileType, loading: true },
      ])
      setActiveTabId(path)
      try {
        if (fileType === 'image' || fileType === 'pdf') {
          const blobUrl = await getRunFileBlobUrl(runUid, path)
          setOpenTabs((prev) =>
            prev.map((t) =>
              t.id === path ? { ...t, loading: false, blobUrl } : t,
            ),
          )
        } else {
          const content = await getRunFileContent(runUid, path)
          setOpenTabs((prev) =>
            prev.map((t) =>
              t.id === path ? { ...t, loading: false, content } : t,
            ),
          )
        }
      } catch (err) {
        setOpenTabs((prev) =>
          prev.map((t) =>
            t.id === path ? { ...t, loading: false, error: String(err) } : t,
          ),
        )
      }
    },
    [openTabs, runUid],
  )

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setOpenTabs((prev) => {
        const closing = prev.find((t) => t.id === tabId)
        if (closing?.blobUrl) URL.revokeObjectURL(closing.blobUrl)
        const newTabs = prev.filter((t) => t.id !== tabId)
        if (activeTabId === tabId) {
          const idx = prev.findIndex((t) => t.id === tabId)
          const next = newTabs[idx] ?? newTabs[idx - 1]
          setActiveTabId(next?.id ?? CANVAS_TAB_ID)
        }
        return newTabs
      })
    },
    [activeTabId],
  )

  // 页面卸载时释放所有 blob URL
  const openTabsRef = useRef(openTabs)
  openTabsRef.current = openTabs
  useEffect(() => {
    return () => {
      for (const tab of openTabsRef.current) {
        if (tab.blobUrl) URL.revokeObjectURL(tab.blobUrl)
      }
    }
  }, [])

  return (
    <SidebarInset className='h-screen flex flex-col overflow-hidden'>
      <RunPageHeader
        projectId={projectId}
        runUid={runUid}
        projectName={project?.name}
        runName={run?.name}
      />

      {/* 主内容区：左侧面板 + 右侧选项卡区域 */}
      <div className='flex flex-1 min-h-0 overflow-hidden'>
        <RunLeftPanel
          run={run}
          runFiles={runFiles}
          selectedFile={activeTabId !== CANVAS_TAB_ID ? activeTabId : undefined}
          onSelectFile={handleSelectFile}
          isOpen={leftPanelOpen}
          onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
        />

        {/* 右侧：选项卡栏 + 内容区 */}
        <div className='flex flex-col flex-1 min-w-0 min-h-0'>
          <RunTabBar
            activeTabId={activeTabId}
            openTabs={openTabs}
            onTabSelect={setActiveTabId}
            onTabClose={handleCloseTab}
          />

          {/* 画布 + 终端（始终 mounted，切换 tab 时隐藏以保持状态） */}
          <div
            className={cn(
              'flex flex-col flex-1 min-h-0',
              activeTabId !== CANVAS_TAB_ID && 'hidden',
            )}
          >
            <RunFlowCanvas
              nodes={flowNodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
            />

            <RunTerminal
              logContent={logContent ?? ''}
              isStreaming={isActiveNodeRunning}
              isOpen={terminalOpen}
              onToggle={() => setTerminalOpen(!terminalOpen)}
              height={terminalHeight}
              onResizeStart={handleResizeStart}
            />
          </div>

          {/* 文件查看器选项卡内容 */}
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'flex-1 overflow-hidden',
                activeTabId !== tab.id && 'hidden',
              )}
            >
              <FileViewer
                fileName={tab.name}
                fileType={tab.fileType}
                content={tab.content}
                blobUrl={tab.blobUrl}
                loading={tab.loading}
                error={tab.error}
              />
            </div>
          ))}
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
