'use client'

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { PageTopbar } from '@/components/layout/page-shell'
import { nodeTypes } from '@/components/node-editor/node-registry'
import { ReadOnlyProvider } from '@/components/node-editor/read-only-context'
import { SubgraphBreadcrumbs } from '@/components/node-editor/subgraph-breadcrumbs'
import { SubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { SubgraphInterfaceSummary } from '@/components/node-editor/subgraph-interface-summary'
import { Progress } from '@/components/ui/progress'
import { SidebarInset } from '@/components/ui/sidebar'
import {
  RUN_STATUS_APPEARANCE,
  RunStatusBadge,
} from '@/components/workflow/run-status'
import { StatusEdge } from '@/components/workflow/status-edge'
import { useRun } from '@/hooks/use-run'
import { useRunFlow } from '@/hooks/use-run-flow'
import { useSubgraphRun } from '@/hooks/use-subgraph-run'
import { WorkflowRunStatusV2 } from '@/types/workflow-v2'

const edgeTypes = { default: StatusEdge }

function RunFlowContent({ uid }: { uid: string }) {
  const t = useTranslations('workflowMonitor')
  const { data: run } = useRun(uid, 5000)
  const { visibleRun, labels, enter, navigate } = useSubgraphRun(run)
  const { flowNodes, edges, handleNodesChange } = useRunFlow(visibleRun)

  const taskStats = run?.node_statistics
  const progress =
    taskStats && taskStats.total > 0
      ? (taskStats.succeeded / taskStats.total) * 100
      : 0

  return (
    <SidebarInset className='flex h-screen flex-col overflow-hidden'>
      <PageTopbar
        breadcrumbs={[
          { label: t('title'), href: '/workflow' },
          { label: run?.name ?? uid },
        ]}
        actions={
          <>
            {run && (
              <div className='flex items-center gap-2'>
                <RunStatusBadge
                  status={run.status}
                  label={t(
                    `status.${RUN_STATUS_APPEARANCE[run.status].labelKey}`,
                  )}
                />
                {run.status === WorkflowRunStatusV2.FAILED && !run.settled && (
                  <span className='hidden text-xs text-muted-foreground lg:inline'>
                    {t('table.unsettled')}
                  </span>
                )}
              </div>
            )}
            {taskStats && (
              <div className='hidden items-center gap-2 text-sm text-muted-foreground sm:flex'>
                <span className='tabular-nums'>
                  {taskStats.succeeded}/{taskStats.total}
                </span>
                <Progress value={progress} className='h-1.5 w-24' />
              </div>
            )}
          </>
        }
      />
      <SubgraphBreadcrumbs labels={labels} onNavigate={navigate} />

      <div className='min-h-0 w-full flex-1'>
        <ReadOnlyProvider value={true}>
          <SubgraphNavigation value={enter}>
            <ReactFlow
              key={visibleRun?.uid}
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
                className='bg-gray-100!'
              />
              <SubgraphInterfaceSummary value={visibleRun?.interface} />
              <Controls />
            </ReactFlow>
          </SubgraphNavigation>
        </ReadOnlyProvider>
      </div>
    </SidebarInset>
  )
}

export function WorkflowRunFlow({ uid }: { uid: string }) {
  return (
    <ReactFlowProvider>
      <RunFlowContent uid={uid} />
    </ReactFlowProvider>
  )
}
