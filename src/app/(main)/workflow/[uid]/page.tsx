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
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { use, useCallback, useEffect, useMemo } from 'react'
import {
  BashCodeNode,
  PythonCodeNode,
  RCodeNode,
} from '@/components/node-editor/node/code-node'
import {
  Copy2FolderNode,
  GlobalMarkerNode,
} from '@/components/node-editor/node/data-node'
import {
  DBInputNode,
  FileInputNode,
  GlobalFileNode,
  GRCh38Node,
  GRCm39Node,
  NcbiGenomeNode,
  SequenceInputNode,
  StringInputNode,
} from '@/components/node-editor/node/input-node'
import { NoteNode } from '@/components/node-editor/node/note-node'
import { ToolNode } from '@/components/node-editor/node/tool-node'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { StatusEdge } from '@/components/workflow/status-edge'
import { useRun } from '@/hooks/use-run'
import { type RunData, Status } from '@/types/run'

const nodeTypes = {
  tool: ToolNode,
  value_string: StringInputNode,
  resource_file: FileInputNode,
  resource_sequence: SequenceInputNode,
  resource_db: DBInputNode,
  resource_ncbi_genome: NcbiGenomeNode,
  resource_GRCh38: GRCh38Node,
  resource_GRCm39: GRCm39Node,
  resource_global_file: GlobalFileNode,
  copy2folder: Copy2FolderNode,
  global_mark: GlobalMarkerNode,
  code_R: RCodeNode,
  code_python: PythonCodeNode,
  code_bash: BashCodeNode,
  note: NoteNode,
}

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

function RunFlowContent({ uid }: { uid: string }) {
  const { data: run } = useRun(uid, 5000)

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([])

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
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex h-12 items-center gap-2 bg-background px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link
                  href='/workflow'
                  className='text-muted-foreground hover:text-foreground text-sm'
                >
                  工作流运行
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{run?.name ?? uid}</BreadcrumbPage>
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
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>
                  {taskStats.success ?? 0}/{taskStats.total}
                </span>
                <Progress value={progress} className='w-24 h-1.5' />
              </div>
            )}
            <Button variant='ghost' size='sm' asChild>
              <Link href='/workflow'>
                <ArrowLeftIcon className='h-4 w-4 mr-1' />
                返回
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className='flex-1 w-full'>
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
    </SidebarInset>
  )
}

export default function WorkflowRunPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = use(params)
  return (
    <ReactFlowProvider>
      <RunFlowContent uid={uid} />
    </ReactFlowProvider>
  )
}
