'use client'

import type { Node as FlowNode, NodeChange } from '@xyflow/react'
import { ReactFlowProvider, useNodesState } from '@xyflow/react'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { RunFlowCanvas } from '@/components/project/run/run-flow-canvas'
import { RunLeftPanel } from '@/components/project/run/run-left-panel'
import { RunPageHeader } from '@/components/project/run/run-page-header'
import { RunTerminal } from '@/components/project/run/run-terminal'
import { SidebarInset } from '@/components/ui/sidebar'
import { useProject } from '@/hooks/use-project'
import { useRunFiles, useRunStream } from '@/hooks/use-run'
import { useTaskLogStream } from '@/hooks/use-task'
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

  return (
    <SidebarInset className='h-screen flex flex-col overflow-hidden'>
      <RunPageHeader
        projectId={projectId}
        runUid={runUid}
        projectName={project?.name}
        runName={run?.name}
      />

      {/* 主内容区：左侧面板 + 右侧画布 */}
      <div className='flex flex-1 min-h-0 overflow-hidden'>
        <RunLeftPanel
          run={run}
          runFiles={runFiles}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          isOpen={leftPanelOpen}
          onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
        />

        {/* 右侧：ReactFlow 画布 + 底部终端 */}
        <div className='flex flex-col flex-1 min-w-0 min-h-0'>
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
