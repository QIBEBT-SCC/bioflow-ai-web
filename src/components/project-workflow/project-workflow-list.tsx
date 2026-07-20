'use client'

import {
  ChevronDown,
  ChevronRight,
  DownloadIcon,
  Loader2,
  PencilIcon,
  PlayIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { WorkflowRunInstances } from '@/components/project-workflow/workflow-run-instances'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useDownloadWorkflowPackage,
  useProjectWorkflows,
  useRemoveWorkflowFromProject,
} from '@/hooks/use-project-workflow'
import { cn } from '@/lib/utils'
import { ExecutionScope } from '@/types/workflow'
import { ImportWorkflowDialog } from './import-workflow-dialog'
import { RunWorkflowDialog } from './run-workflow-dialog'

interface ProjectWorkflowListProps {
  projectId: string
}

export function ProjectWorkflowList({ projectId }: ProjectWorkflowListProps) {
  const t = useTranslations('Project.workflow')
  const router = useRouter()
  const [removingWorkflow, setRemovingWorkflow] = useState<string | null>(null)
  const [runningWorkflow, setRunningWorkflow] = useState<{
    uid: string
    name: string
    executionScope: ExecutionScope
    autoSummary: boolean
  } | null>(null)
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(
    new Set(),
  )

  const { data: workflows, isLoading } = useProjectWorkflows(projectId, 0, 100)
  const removeWorkflowMutation = useRemoveWorkflowFromProject()
  const downloadMutation = useDownloadWorkflowPackage()

  const toggleExpand = (workflowUid: string) => {
    setExpandedWorkflows((prev) => {
      const next = new Set(prev)
      if (next.has(workflowUid)) {
        next.delete(workflowUid)
      } else {
        next.add(workflowUid)
      }
      return next
    })
  }

  const handleRemove = async (workflowUid: string) => {
    try {
      await removeWorkflowMutation.mutateAsync({ projectId, workflowUid })
      toast.success(t('removeSuccess'))
      setRemovingWorkflow(null)
    } catch {
      toast.error(t('removeFailed'))
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className='overflow-hidden'>
        <CardHeader className='border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription className='mt-1'>
                {t('description')}
              </CardDescription>
            </div>
            <ImportWorkflowDialog projectId={projectId} />
          </div>
        </CardHeader>

        <CardContent className='p-4 sm:p-5'>
          {!workflows || workflows.length === 0 ? (
            <Empty className='border py-12'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <SparklesIcon className='size-5' />
                </EmptyMedia>
                <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
                <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <ImportWorkflowDialog projectId={projectId} />
              </EmptyContent>
            </Empty>
          ) : (
            <TooltipProvider>
              <div className='space-y-3'>
                {workflows.map((workflow) => {
                  const isExpanded = expandedWorkflows.has(
                    workflow.workflow_uid,
                  )
                  const isProjectLevel =
                    workflow.execution_scope === ExecutionScope.PROJECT_LEVEL
                  const isDownloading =
                    downloadMutation.isPending &&
                    downloadMutation.variables?.workflowUid ===
                      workflow.workflow_uid

                  return (
                    <div
                      key={workflow.workflow_uid}
                      className={cn(
                        'overflow-hidden rounded-lg border bg-background shadow-xs transition-colors',
                        isExpanded ? 'border-primary/30' : 'hover:bg-muted/20',
                      )}
                    >
                      <div className='flex flex-col gap-4 p-4 md:flex-row md:items-center'>
                        <button
                          type='button'
                          onClick={() => toggleExpand(workflow.workflow_uid)}
                          className='group flex min-w-0 flex-1 flex-col gap-3 text-left sm:flex-row sm:items-start'
                        >
                          {isExpanded ? (
                            <ChevronDown className='size-5' />
                          ) : (
                            <ChevronRight className='size-5' />
                          )}
                          <span className='min-w-0 flex-1 space-y-2 pt-0.5'>
                            <span className='flex flex-wrap items-center gap-2'>
                              <span className='truncate text-base font-semibold leading-6'>
                                {workflow.workflow_name}
                              </span>
                              {workflow.enabled ? (
                                <Badge
                                  variant='outline'
                                  className='border-emerald-200 bg-emerald-50 text-emerald-700'
                                >
                                  {t('enabled')}
                                </Badge>
                              ) : (
                                <Badge
                                  variant='outline'
                                  className='border-muted bg-muted/50 text-muted-foreground'
                                >
                                  {t('disabled')}
                                </Badge>
                              )}
                              <Badge
                                variant='outline'
                                className={cn(
                                  isProjectLevel
                                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                                    : 'border-teal-200 bg-teal-50 text-teal-700',
                                )}
                              >
                                {isProjectLevel
                                  ? t('projectLevel')
                                  : t('sampleLevel')}
                              </Badge>
                            </span>
                          </span>
                        </button>

                        <div className='flex shrink-0 items-center gap-2 self-end md:self-center'>
                          <Button
                            size='sm'
                            onClick={() =>
                              setRunningWorkflow({
                                uid: workflow.workflow_uid,
                                name: workflow.workflow_name,
                                executionScope:
                                  workflow.execution_scope ??
                                  ExecutionScope.SAMPLE_LEVEL,
                                autoSummary: workflow.auto_summary ?? false,
                              })
                            }
                            disabled={!workflow.enabled}
                          >
                            <PlayIcon className='size-4 mr-1.5' />
                            {t('run')}
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='icon'
                                className='text-muted-foreground hover:text-primary'
                                onClick={() =>
                                  router.push(
                                    `/editor?workflowUid=${workflow.workflow_uid}&projectId=${projectId}`,
                                  )
                                }
                              >
                                <PencilIcon className='size-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('editWorkflow')}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='icon'
                                className='text-muted-foreground hover:text-primary'
                                onClick={() =>
                                  downloadMutation.mutate({
                                    projectId,
                                    workflowUid: workflow.workflow_uid,
                                  })
                                }
                                disabled={isDownloading}
                              >
                                {isDownloading ? (
                                  <Loader2 className='size-4 animate-spin' />
                                ) : (
                                  <DownloadIcon className='size-4' />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('downloadResults')}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='icon'
                                className='text-muted-foreground hover:border-destructive/30 hover:text-destructive'
                                onClick={() =>
                                  setRemovingWorkflow(workflow.workflow_uid)
                                }
                              >
                                <Trash2Icon className='size-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('removeWorkflow')}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className='border-t bg-muted/30'>
                          <WorkflowRunInstances
                            projectId={projectId}
                            workflowUid={workflow.workflow_uid}
                            executionScope={workflow.execution_scope}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {/* 运行工作流对话框 */}
      {runningWorkflow && (
        <RunWorkflowDialog
          projectId={projectId}
          workflowUid={runningWorkflow.uid}
          workflowName={runningWorkflow.name}
          executionScope={runningWorkflow.executionScope}
          defaultAutoSummary={runningWorkflow.autoSummary}
          open={!!runningWorkflow}
          onOpenChange={(open) => !open && setRunningWorkflow(null)}
        />
      )}

      {/* 移除确认对话框 */}
      <AlertDialog
        open={!!removingWorkflow}
        onOpenChange={(open) => !open && setRemovingWorkflow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removeDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingWorkflow && handleRemove(removingWorkflow)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {removeWorkflowMutation.isPending
                ? t('removing')
                : t('confirmRemove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
