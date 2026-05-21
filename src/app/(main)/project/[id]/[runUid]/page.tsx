'use client'

import type { Node as FlowNode } from '@xyflow/react'
import { ReactFlowProvider } from '@xyflow/react'
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
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
import { RunTerminal } from '@/components/project/run/run-terminal'
import { SidebarInset } from '@/components/ui/sidebar'
import { useChatSidebarResize } from '@/hooks/use-chat-sidebar-resize'
import { useProject } from '@/hooks/use-project'
import { useRunFiles, useRunStream } from '@/hooks/use-run'
import { useRunFlow } from '@/hooks/use-run-flow'
import { useTaskLogStream } from '@/hooks/use-task'
import { cn } from '@/lib/utils'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import { type RunData, Status } from '@/types/run'

type PanelState = {
  leftPanelOpen: boolean
  leftPanelWidth: number
  terminalOpen: boolean
  terminalHeight: number
}
type PanelAction =
  | { type: 'TOGGLE_LEFT_PANEL' }
  | { type: 'SET_LEFT_WIDTH'; width: number }
  | { type: 'TOGGLE_TERMINAL' }
  | { type: 'SET_TERMINAL_HEIGHT'; height: number }

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'TOGGLE_LEFT_PANEL':
      return { ...state, leftPanelOpen: !state.leftPanelOpen }
    case 'SET_LEFT_WIDTH':
      return { ...state, leftPanelWidth: action.width }
    case 'TOGGLE_TERMINAL':
      return { ...state, terminalOpen: !state.terminalOpen }
    case 'SET_TERMINAL_HEIGHT':
      return { ...state, terminalHeight: action.height }
  }
}

type TabState = {
  openTabs: FileTab[]
  activeTabId: string
}
type TabAction =
  | { type: 'OPEN_TAB'; tab: FileTab }
  | { type: 'UPDATE_TAB'; id: string; updates: Partial<FileTab> }
  | { type: 'CLOSE_TAB'; id: string }
  | { type: 'SET_ACTIVE'; id: string }

function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'OPEN_TAB':
      return {
        openTabs: [...state.openTabs, action.tab],
        activeTabId: action.tab.id,
      }
    case 'UPDATE_TAB':
      return {
        ...state,
        openTabs: state.openTabs.map((t) =>
          t.id === action.id ? { ...t, ...action.updates } : t,
        ),
      }
    case 'CLOSE_TAB': {
      const closing = state.openTabs.find((t) => t.id === action.id)
      if (closing?.blobUrl) URL.revokeObjectURL(closing.blobUrl)
      const newTabs = state.openTabs.filter((t) => t.id !== action.id)
      let nextActiveId = state.activeTabId
      if (state.activeTabId === action.id) {
        const idx = state.openTabs.findIndex((t) => t.id === action.id)
        nextActiveId = newTabs[idx]?.id ?? newTabs[idx - 1]?.id ?? CANVAS_TAB_ID
      }
      return { openTabs: newTabs, activeTabId: nextActiveId }
    }
    case 'SET_ACTIVE':
      return { ...state, activeTabId: action.id }
  }
}

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
  const { flowNodes, edges, handleNodesChange } = useRunFlow(run)
  const [panel, dispatchPanel] = useReducer(panelReducer, {
    leftPanelOpen: true,
    leftPanelWidth: 288,
    terminalOpen: true,
    terminalHeight: 192,
  })
  const { leftPanelOpen, leftPanelWidth, terminalOpen, terminalHeight } = panel

  const isResizing = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)
  const isResizingLeft = useRef(false)
  const startX = useRef(0)
  const startLeftWidth = useRef(0)
  const leftPanelDidDrag = useRef(false)
  const { chatSidebarWidth, handleChatResizeStart } = useChatSidebarResize()

  const [tabs, dispatchTabs] = useReducer(tabReducer, {
    openTabs: [],
    activeTabId: CANVAS_TAB_ID,
  })
  const { openTabs, activeTabId } = tabs

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true
      startY.current = e.clientY
      startHeight.current = terminalHeight

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return
        const delta = startY.current - ev.clientY
        const height = Math.min(600, Math.max(80, startHeight.current + delta))
        dispatchPanel({ type: 'SET_TERMINAL_HEIGHT', height })
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

  const handleLeftPanelResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizingLeft.current = true
      leftPanelDidDrag.current = false
      startX.current = e.clientX
      startLeftWidth.current = leftPanelWidth

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizingLeft.current) return
        const delta = ev.clientX - startX.current
        if (Math.abs(delta) > 3) leftPanelDidDrag.current = true
        const width = Math.min(
          520,
          Math.max(160, startLeftWidth.current + delta),
        )
        dispatchPanel({ type: 'SET_LEFT_WIDTH', width })
      }

      const onMouseUp = () => {
        isResizingLeft.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [leftPanelWidth],
  )

  const handleLeftPanelToggle = useCallback(() => {
    if (leftPanelDidDrag.current) return
    dispatchPanel({ type: 'TOGGLE_LEFT_PANEL' })
  }, [])

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

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      if (node.type === 'tool') setSelectedToolNodeId(node.id)
    },
    [],
  )

  const handlePaneClick = useCallback(() => {
    setSelectedToolNodeId(undefined)
  }, [])

  const handleSelectFile = useCallback(
    async (path: string) => {
      const name = path.split('/').pop() ?? path
      if (openTabs.some((t) => t.id === path)) {
        dispatchTabs({ type: 'SET_ACTIVE', id: path })
        return
      }
      const fileType = getFileType(name)
      dispatchTabs({
        type: 'OPEN_TAB',
        tab: { id: path, path, name, fileType, loading: true },
      })
      try {
        if (fileType === 'image' || fileType === 'pdf') {
          const blobUrl = await getRunFileBlobUrl(runUid, path)
          dispatchTabs({
            type: 'UPDATE_TAB',
            id: path,
            updates: { loading: false, blobUrl },
          })
        } else {
          const content = await getRunFileContent(runUid, path)
          dispatchTabs({
            type: 'UPDATE_TAB',
            id: path,
            updates: { loading: false, content },
          })
        }
      } catch (err) {
        dispatchTabs({
          type: 'UPDATE_TAB',
          id: path,
          updates: { loading: false, error: String(err) },
        })
      }
    },
    [openTabs, runUid],
  )

  const handleCloseTab = useCallback((tabId: string) => {
    dispatchTabs({ type: 'CLOSE_TAB', id: tabId })
  }, [])

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
          width={leftPanelWidth}
          onToggle={handleLeftPanelToggle}
          onResizeStart={handleLeftPanelResizeStart}
        />

        {/* 右侧：选项卡栏 + 内容区 */}
        <div className='flex flex-col flex-1 min-w-0 min-h-0'>
          <RunTabBar
            activeTabId={activeTabId}
            openTabs={openTabs}
            onTabSelect={(id) => dispatchTabs({ type: 'SET_ACTIVE', id })}
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
              onToggle={() => dispatchPanel({ type: 'TOGGLE_TERMINAL' })}
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

        {isOpen && (
          <ChatSidebar
            pageKey={`run-${runUid}`}
            width={chatSidebarWidth}
            onResizeStart={handleChatResizeStart}
          />
        )}
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
