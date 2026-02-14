'use client'

import {
  Download,
  Loader2,
  MoreHorizontal,
  PlayIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

  const { data: workflows, isLoading } = useProjectWorkflows(projectId)
  const removeWorkflowMutation = useRemoveWorkflowFromProject()

  const handleRemove = async (workflowUid: string) => {
    try {
      await removeWorkflowMutation.mutateAsync({
        projectId,
        workflowUid,
      })

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
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>工作流模板</CardTitle>
              <CardDescription>
                管理项目中的工作流模板,并在样本上运行分析
              </CardDescription>
            </div>
            <ImportWorkflowDialog projectId={projectId} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[250px]'>工作流名称</TableHead>
                <TableHead className='w-[180px]'>导入时间</TableHead>
                <TableHead className='w-[100px]'>状态</TableHead>
                <TableHead className='w-[150px]'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!workflows || workflows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center py-8 text-muted-foreground'
                  >
                    暂无工作流模板,点击"导入工作流"按钮从工作流库中导入
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((workflow) => (
                  <TableRow key={workflow.workflow_uid}>
                    <TableCell className='font-medium'>
                      {workflow.workflow_name}
                    </TableCell>
                    <TableCell>
                      {new Date(workflow.import_time).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {workflow.enabled ? (
                        <Badge
                          variant='outline'
                          className='bg-green-50 text-green-600 border-green-200'
                        >
                          已启用
                        </Badge>
                      ) : (
                        <Badge variant='outline'>已禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
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
                          <PlayIcon className='h-4 w-4 mr-2' />
                          运行
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() =>
                                setRunningWorkflow({
                                  uid: workflow.workflow_uid,
                                  name: workflow.workflow_name,
                                })
                              }
                              disabled={!workflow.enabled}
                            >
                              <PlayIcon className='h-4 w-4 mr-2' />
                              运行工作流
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className='h-4 w-4 mr-2' />
                              导出配置
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-destructive'
                              onClick={() =>
                                setRemovingWorkflow(workflow.workflow_uid)
                              }
                            >
                              <Trash2Icon className='h-4 w-4 mr-2' />
                              移除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 运行工作流对话框 */}
      {runningWorkflow && (
        <RunWorkflowDialog
          projectId={projectId}
          workflowUid={runningWorkflow.uid}
          workflowName={runningWorkflow.name}
          open={!!runningWorkflow}
          onOpenChange={(open: boolean) => !open && setRunningWorkflow(null)}
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
              确定要从项目中移除这个工作流模板吗?这不会删除工作流本身,只是解除与项目的关联。
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
