'use client'

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  PlayIcon,
  Trash2Icon,
} from 'lucide-react'
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
  useProjectWorkflows,
  useRemoveWorkflowFromProject,
} from '@/hooks/use-project-workflow'
import { ImportWorkflowDialog } from './import-workflow-dialog'
import { RunWorkflowDialog } from './run-workflow-dialog'

interface ProjectWorkflowListProps {
  projectId: string
}

export function ProjectWorkflowList({ projectId }: ProjectWorkflowListProps) {
  const [removingWorkflow, setRemovingWorkflow] = useState<string | null>(null)
  const [runningWorkflow, setRunningWorkflow] = useState<{
    uid: string
    name: string
  } | null>(null)
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(
    new Set(),
  )

  const { data: workflows, isLoading } = useProjectWorkflows(projectId)
  const removeWorkflowMutation = useRemoveWorkflowFromProject()

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
      toast.success('工作流移除成功')
      setRemovingWorkflow(null)
    } catch {
      toast.error('工作流移除失败')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>工作流模板</h2>
            <p className='text-sm text-muted-foreground'>
              管理项目工作流，点击展开查看各样本运行状态
            </p>
          </div>
          <ImportWorkflowDialog projectId={projectId} />
        </div>

        {!workflows || workflows.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
              <p className='text-sm'>
                暂无工作流模板，点击「导入工作流」从工作流库中导入
              </p>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => {
            const isExpanded = expandedWorkflows.has(workflow.workflow_uid)
            return (
              <Card key={workflow.workflow_uid} className='overflow-hidden'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center gap-3'>
                    {/* 展开按钮 */}
                    <button
                      type='button'
                      onClick={() => toggleExpand(workflow.workflow_uid)}
                      className='text-muted-foreground hover:text-foreground transition-colors shrink-0'
                    >
                      {isExpanded ? (
                        <ChevronDown className='h-4 w-4' />
                      ) : (
                        <ChevronRight className='h-4 w-4' />
                      )}
                    </button>

                    {/* 工作流信息 */}
                    <button
                      type='button'
                      className='flex-1 text-left'
                      onClick={() => toggleExpand(workflow.workflow_uid)}
                    >
                      <div className='flex items-center gap-2'>
                        <CardTitle className='text-base'>
                          {workflow.workflow_name}
                        </CardTitle>
                        {workflow.enabled ? (
                          <Badge
                            variant='outline'
                            className='bg-green-50 text-green-600 border-green-200 text-xs'
                          >
                            已启用
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='text-xs'>
                            已禁用
                          </Badge>
                        )}
                      </div>
                      <CardDescription className='mt-0.5'>
                        导入时间：
                        {new Date(workflow.import_time).toLocaleString('zh-CN')}
                      </CardDescription>
                    </button>

                    {/* 操作按钮 */}
                    <div className='flex items-center gap-2 shrink-0'>
                      <Button
                        size='sm'
                        onClick={() =>
                          setRunningWorkflow({
                            uid: workflow.workflow_uid,
                            name: workflow.workflow_name,
                          })
                        }
                        disabled={!workflow.enabled}
                      >
                        <PlayIcon className='h-4 w-4 mr-1' />
                        运行
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:text-destructive'
                        onClick={() =>
                          setRemovingWorkflow(workflow.workflow_uid)
                        }
                      >
                        <Trash2Icon className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* 展开的运行实例列表 */}
                {isExpanded && (
                  <WorkflowRunInstances
                    projectId={projectId}
                    workflowUid={workflow.workflow_uid}
                  />
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* 运行工作流对话框 */}
      {runningWorkflow && (
        <RunWorkflowDialog
          projectId={projectId}
          workflowUid={runningWorkflow.uid}
          workflowName={runningWorkflow.name}
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
            <AlertDialogTitle>确认移除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要从项目中移除这个工作流模板吗？这不会删除工作流本身，只是解除与项目的关联。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingWorkflow && handleRemove(removingWorkflow)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {removeWorkflowMutation.isPending ? '移除中...' : '确认移除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
