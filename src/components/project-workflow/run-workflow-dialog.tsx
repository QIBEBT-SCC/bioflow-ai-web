'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRunWorkflow } from '@/hooks/use-project-workflow'
import { useSamples } from '@/hooks/use-sample'
import { ExecutionScope } from '@/types/workflow'

interface RunWorkflowDialogProps {
  projectId: string
  workflowUid: string
  workflowName: string
  executionScope: ExecutionScope
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RunWorkflowDialog({
  projectId,
  workflowUid,
  workflowName,
  executionScope,
  open,
  onOpenChange,
}: RunWorkflowDialogProps) {
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set())
  const [runNamePrefix, setRunNamePrefix] = useState('')

  const isProjectLevel = executionScope === ExecutionScope.PROJECT_LEVEL

  const { data: samples, isLoading } = useSamples(projectId)
  const runWorkflowMutation = useRunWorkflow()

  // 切换样本选择
  const toggleSample = (sampleUid: string) => {
    setSelectedSamples((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sampleUid)) {
        newSet.delete(sampleUid)
      } else {
        newSet.add(sampleUid)
      }
      return newSet
    })
  }

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedSamples.size === samples?.length) {
      setSelectedSamples(new Set())
    } else {
      setSelectedSamples(new Set(samples?.map((s) => s.uid) || []))
    }
  }

  // 运行工作流
  const handleRun = async () => {
    if (!isProjectLevel && selectedSamples.size === 0) {
      toast.error('请至少选择一个样本')
      return
    }

    try {
      const result = await runWorkflowMutation.mutateAsync({
        projectId,
        workflowUid,
        data: {
          sample_uids: isProjectLevel ? undefined : Array.from(selectedSamples),
          run_name_prefix: runNamePrefix || undefined,
        },
      })

      toast.success(
        isProjectLevel
          ? '项目级工作流已启动'
          : `成功提交 ${result.count} 个运行实例`,
      )

      // 重置状态
      setSelectedSamples(new Set())
      setRunNamePrefix('')
      onOpenChange(false)
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        toast.error('部分样本正在运行中，请等待完成后再重跑')
      } else if (error instanceof Error) {
        toast.error(`运行失败: ${error.message}`)
      } else {
        toast.error('运行失败，请重试')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>运行工作流: {workflowName}</DialogTitle>
          <DialogDescription>
            {isProjectLevel
              ? '此工作流为项目级，将在整个项目上运行一次'
              : '选择要分析的样本，对已有实例的样本将重新运行分析'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* 样本选择 - 仅样本级工作流显示 */}
          {!isProjectLevel && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>选择要分析的样本</Label>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={toggleAll}
                  disabled={!samples || samples.length === 0}
                >
                  {selectedSamples.size === samples?.length
                    ? '取消全选'
                    : '全选'}
                </Button>
              </div>

              <ScrollArea className='h-[250px] rounded-md border p-4'>
                {isLoading ? (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                  </div>
                ) : !samples || samples.length === 0 ? (
                  <div className='text-center py-12 text-muted-foreground'>
                    项目中暂无样本,请先添加样本
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {samples.map((sample) => (
                      <button
                        key={sample.uid}
                        type='button'
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left w-full ${
                          selectedSamples.has(sample.uid)
                            ? 'bg-primary/5 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleSample(sample.uid)}
                      >
                        <div className='flex items-center h-5'>
                          <input
                            type='checkbox'
                            checked={selectedSamples.has(sample.uid)}
                            onChange={() => toggleSample(sample.uid)}
                            className='h-4 w-4 rounded border-gray-300'
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <h4 className='font-medium text-sm'>
                              {sample.sample_name}
                            </h4>
                            <Badge variant='outline' className='text-xs'>
                              {sample.file_count} 个文件
                            </Badge>
                          </div>
                          {Object.keys(sample.meta_data || {}).length > 0 && (
                            <div className='flex flex-wrap gap-1 mt-1'>
                              {Object.entries(sample.meta_data || {}).map(
                                ([key, value]) => (
                                  <Badge
                                    key={key}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {key}: {String(value)}
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* 运行名称前缀 */}
          <div className='space-y-2'>
            <Label htmlFor='run-name-prefix'>
              运行名称前缀 <span className='text-muted-foreground'>(可选)</span>
            </Label>
            <Input
              id='run-name-prefix'
              placeholder='例如: Experiment-2024-01-22'
              value={runNamePrefix}
              onChange={(e) => setRunNamePrefix(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              如果不填写,将使用默认格式: 项目名-工作流名-样本名
            </p>
          </div>

          {/* 运行实例数量提示 */}
          {isProjectLevel ? (
            <div className='rounded-lg bg-muted p-3'>
              <p className='text-sm'>
                将创建 <span className='font-semibold text-primary'>1</span>{' '}
                个项目级运行实例
              </p>
            </div>
          ) : (
            selectedSamples.size > 0 && (
              <div className='rounded-lg bg-muted p-3'>
                <p className='text-sm'>
                  将创建{' '}
                  <span className='font-semibold text-primary'>
                    {selectedSamples.size}
                  </span>{' '}
                  个运行实例
                </p>
              </div>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleRun}
            disabled={
              (!isProjectLevel && selectedSamples.size === 0) ||
              runWorkflowMutation.isPending
            }
          >
            {runWorkflowMutation.isPending ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                运行中...
              </>
            ) : (
              '开始运行'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
