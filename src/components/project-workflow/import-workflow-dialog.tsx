'use client'

import { Loader2, PlusIcon, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAddWorkflowToProject } from '@/hooks/use-project-workflow'
import { useWorkflows } from '@/hooks/use-workflow'

interface ImportWorkflowDialogProps {
  projectId: string
}

export function ImportWorkflowDialog({ projectId }: ImportWorkflowDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(
    new Set(),
  )

  const { data: workflows, isLoading } = useWorkflows(0)
  const addWorkflowMutation = useAddWorkflowToProject()

  // 过滤工作流
  const filteredWorkflows = workflows?.filter((wf) =>
    wf.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // 切换工作流选择
  const toggleWorkflow = (uid: string) => {
    setSelectedWorkflows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(uid)) {
        newSet.delete(uid)
      } else {
        newSet.add(uid)
      }
      return newSet
    })
  }

  // 导入选中的工作流
  const handleImport = async () => {
    if (selectedWorkflows.size === 0) {
      toast.error('请至少选择一个工作流')
      return
    }

    try {
      // 逐个导入工作流
      const promises = Array.from(selectedWorkflows).map((workflowUid) =>
        addWorkflowMutation.mutateAsync({
          projectId,
          data: { workflow_uid: workflowUid },
        }),
      )

      await Promise.all(promises)

      toast.success(`成功导入 ${selectedWorkflows.size} 个工作流`)
      setSelectedWorkflows(new Set())
      setOpen(false)
    } catch (error) {
      // 错误处理已在 mutation 中完成
      if (error instanceof Error) {
        if (error.message.includes('409')) {
          toast.error('部分工作流已存在于项目中')
        } else {
          toast.error('导入失败,请重试')
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className='h-4 w-4 mr-2' />
          导入工作流
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>导入工作流模板</DialogTitle>
          <DialogDescription>
            从工作流库中选择要导入到项目的工作流模板
          </DialogDescription>
        </DialogHeader>

        {/* 搜索框 */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='搜索工作流...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* 工作流列表 */}
        <ScrollArea className='h-[400px] rounded-md border p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : !filteredWorkflows || filteredWorkflows.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              {searchQuery ? '未找到匹配的工作流' : '暂无可用的工作流'}
            </div>
          ) : (
            <div className='space-y-2'>
              {filteredWorkflows.map((workflow) => (
                <button
                  key={workflow.uid}
                  type='button'
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left w-full ${
                    selectedWorkflows.has(workflow.uid)
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleWorkflow(workflow.uid)}
                >
                  <div className='flex items-center h-5'>
                    <input
                      type='checkbox'
                      checked={selectedWorkflows.has(workflow.uid)}
                      onChange={() => toggleWorkflow(workflow.uid)}
                      className='h-4 w-4 rounded border-gray-300'
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-sm'>{workflow.name}</h4>
                    <p className='text-xs text-muted-foreground mt-1'>
                      UID: {workflow.uid}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              selectedWorkflows.size === 0 || addWorkflowMutation.isPending
            }
          >
            {addWorkflowMutation.isPending ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                导入中...
              </>
            ) : (
              `导入选中项 (${selectedWorkflows.size})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
