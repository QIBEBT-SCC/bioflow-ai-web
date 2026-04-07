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
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { use, useCallback, useEffect, useMemo } from 'react'
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

      <div className='flex flex-1 min-h-0'>
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
