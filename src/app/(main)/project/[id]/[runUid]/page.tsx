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
  SettingsIcon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { use, useCallback, useEffect, useMemo, useState } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { StatusEdge } from '@/components/workflow/status-edge'
import { useProject } from '@/hooks/use-project'
import { useRun } from '@/hooks/use-run'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import { type RunData, Status } from '@/types/run'

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

// Mock data for file tree (multi-level)
type OutputFileNode =
  | { type: 'file'; path: string; name: string; iconType?: 'json' }
  | { type: 'folder'; path: string; name: string; children: OutputFileNode[] }

const MOCK_OUTPUT_FILES: OutputFileNode[] = [
  {
    type: 'folder',
    path: 'logs',
    name: 'logs',
    children: [
      { type: 'file', path: 'logs/bwa.log', name: 'bwa.log' },
      { type: 'file', path: 'logs/samtools.log', name: 'samtools.log' },
      { type: 'file', path: 'logs/gatk.log', name: 'gatk.log' },
    ],
  },
  {
    type: 'folder',
    path: 'reports',
    name: 'reports',
    children: [
      {
        type: 'folder',
        path: 'reports/qc',
        name: 'qc',
        children: [
          {
            type: 'file',
            path: 'reports/qc/qc_report.html',
            name: 'qc_report.html',
          },
        ],
      },
      {
        type: 'file',
        path: 'reports/summary.json',
        name: 'summary.json',
        iconType: 'json',
      },
    ],
  },
]

function renderOutputNode(node: OutputFileNode) {
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

// Mock terminal output
const MOCK_TERMINAL_OUTPUT = `\x1b[32m[INFO]\x1b[0m 2026-04-07 10:00:01 Starting workflow execution
\x1b[32m[INFO]\x1b[0m 2026-04-07 10:00:02 Loading input files...
\x1b[32m[INFO]\x1b[0m 2026-04-07 10:00:05 Running BWA alignment
\x1b[33m[WARN]\x1b[0m 2026-04-07 10:02:11 Low coverage region detected at chr1:1234567
\x1b[32m[INFO]\x1b[0m 2026-04-07 10:05:33 BWA alignment completed: 98.7% mapped
\x1b[32m[INFO]\x1b[0m 2026-04-07 10:05:34 Running SAMtools sort and index
\x1b[32m[INFO]\x1b[0m 2026-04-07 10:07:12 Running GATK HaplotypeCaller
\x1b[32m[INFO]\x1b[0m 2026-04-07 10:15:44 Variant calling completed: 24,891 variants called
\x1b[32m[INFO]\x1b[0m 2026-04-07 10:15:45 Generating QC report
\x1b[32m[\x1b[1mSUCCESS\x1b[0m\x1b[32m]\x1b[0m 2026-04-07 10:16:02 Workflow completed successfully`

// Mock run statistics
const MOCK_STATS = {
  totalNodes: 6,
  successNodes: 6,
  failedNodes: 0,
  duration: '16分 01秒',
  cpuUsage: '87%',
  memoryUsage: '12.4 GB',
}

// Mock environment variables
const MOCK_ENV_VARS = [
  { key: 'REFERENCE_GENOME', value: 'hg38' },
  { key: 'THREADS', value: '16' },
  { key: 'MIN_QUALITY', value: '20' },
  { key: 'MIN_DEPTH', value: '10' },
  { key: 'OUTPUT_FORMAT', value: 'vcf.gz' },
]

function RunFlowContent({
  projectId,
  runUid,
}: {
  projectId: string
  runUid: string
}) {
  const { data: project } = useProject(projectId)
  const { data: run } = useRun(runUid, 5000)
  const isOpen = useChatSidebarStore((s) => s.isOpen)
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([])
  const [statsOpen, setStatsOpen] = useState(true)
  const [envOpen, setEnvOpen] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState(MOCK_TERMINAL_OUTPUT)
  const [selectedFile, setSelectedFile] = useState<string>()
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(true)

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

  const taskStats = run?.task_statistics
  const progress = taskStats
    ? ((taskStats.success ?? 0) / taskStats.total) * 100
    : 0

  const cfg = run ? statusConfig[run.status] : null
  const Icon = cfg?.icon

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

          <div className='ml-auto flex items-center gap-3'>
            {cfg && Icon && (
              <Badge variant={cfg.variant} className='gap-1'>
                <Icon
                  className={`h-3 w-3 ${run?.status === Status.RUNNING ? 'animate-spin' : ''}`}
                />
                {cfg.label}
              </Badge>
            )}
            {taskStats && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground pr-5'>
                <span>
                  {taskStats.success ?? 0}/{taskStats.total}
                </span>
                <Progress value={progress} className='w-24 h-1.5' />
              </div>
            )}
            <div className='ml-auto'>
              <ChatSidebarToggle />
            </div>
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
                  {[
                    { label: '总节点数', value: MOCK_STATS.totalNodes },
                    { label: '成功节点', value: MOCK_STATS.successNodes },
                    { label: '失败节点', value: MOCK_STATS.failedNodes },
                    { label: '运行时长', value: MOCK_STATS.duration },
                    { label: 'CPU 使用率', value: MOCK_STATS.cpuUsage },
                    { label: '内存用量', value: MOCK_STATS.memoryUsage },
                  ].map(({ label, value }) => (
                    <div key={label} className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>{label}</span>
                      <span className='font-medium'>{value}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 可折叠区块 2：运行参数 */}
            <Collapsible open={envOpen} onOpenChange={setEnvOpen}>
              <CollapsibleTrigger className='flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 border-b'>
                <div className='flex items-center gap-2'>
                  <SettingsIcon className='h-4 w-4 text-muted-foreground' />
                  运行参数
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-muted-foreground transition-transform ${envOpen ? 'rotate-180' : ''}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='px-4 py-3 space-y-1.5 border-b bg-muted/20'>
                  {MOCK_ENV_VARS.map(({ key, value }) => (
                    <div key={key} className='text-xs'>
                      <span className='text-muted-foreground font-mono'>
                        {key}
                      </span>
                      <span className='text-muted-foreground mx-1'>=</span>
                      <span className='font-mono font-medium'>{value}</span>
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
                  {MOCK_OUTPUT_FILES.map(renderOutputNode)}
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

          {/* 底部终端（VSCode 式折叠） */}
          <div className='shrink-0 border-t'>
            {/* 终端把手：点击展开/收起 */}
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
              className={`transition-all duration-200 overflow-hidden ${terminalOpen ? 'h-48' : 'h-0'}`}
            >
              <Terminal
                output={terminalOutput}
                onClear={() => setTerminalOutput('')}
                className='h-48 rounded-none border-0'
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
