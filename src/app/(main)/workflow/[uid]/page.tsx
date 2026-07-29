'use client'

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
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
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { StatusEdge } from '@/components/workflow/status-edge'
import { useRun } from '@/hooks/use-run'
import { useRunFlow } from '@/hooks/use-run-flow'
import { Status } from '@/types/run'

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
  const { flowNodes, edges, handleNodesChange } = useRunFlow(run ?? null)

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
                  className={`size-3 ${run?.status === Status.RUNNING ? 'animate-spin' : ''}`}
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
                <ArrowLeftIcon className='size-4 mr-1' />
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
