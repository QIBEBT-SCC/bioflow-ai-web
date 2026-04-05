'use client'

import {
  CopyIcon,
  FileTextIcon,
  GlobeIcon,
  LayersIcon,
  LockIcon,
  SaveIcon,
  TypeIcon,
} from 'lucide-react'
import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSaveWorkflow } from '@/hooks/use-workflow'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import { ExecutionScope, WorkflowType } from '@/types/workflow'

interface SaveAsDialogProps {
  currentWorkflowName?: string
  disabled?: boolean
}

export function SaveAsDialog({
  currentWorkflowName,
  disabled,
}: SaveAsDialogProps) {
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [workflowType, setWorkflowType] = useState<WorkflowType>(
    WorkflowType.TEMPLATE,
  )
  const [executionScope, setExecutionScope] = useState<ExecutionScope>(
    ExecutionScope.SAMPLE_LEVEL,
  )
  const [open, setOpen] = useState(false)

  const { nodes, edges, setCurrentWorkflowUid } = useNodeEditorStore()
  const saveWorkflowMutation = useSaveWorkflow()

  const handleSaveAs = () => {
    if (!name.trim()) return

    const workflow = {
      name: name.trim(),
      workflow: { nodes, edges },
      public: isPublic,
      wf_type: workflowType,
      execution_scope: executionScope,
    }

    saveWorkflowMutation.mutate(workflow, {
      onSuccess: (uid) => {
        setCurrentWorkflowUid(uid)
        setOpen(false)
        setName('')
        setIsPublic(false)
        setWorkflowType(WorkflowType.TEMPLATE)
        setExecutionScope(ExecutionScope.SAMPLE_LEVEL)
      },
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && currentWorkflowName) {
      setName(`${currentWorkflowName} - 副本`)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' disabled={disabled}>
          <SaveIcon className='h-4 w-4 mr-2' />
          另存为
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-primary/10 rounded-full'>
              <CopyIcon className='h-5 w-5 text-primary' />
            </div>
            <DialogTitle>另存为副本</DialogTitle>
          </div>
          <DialogDescription className='pt-2'>
            创建一个当前工作流的完整副本。您可以修改名称并设置新的属性。
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-6 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='name' className='flex items-center gap-2'>
              <FileTextIcon className='h-4 w-4 text-muted-foreground' />
              工作流名称
            </Label>
            <Input
              id='name'
              placeholder='输入工作流名称...'
              className='col-span-3'
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSaveAs()
                }
              }}
              autoFocus
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='type' className='flex items-center gap-2'>
                <TypeIcon className='h-4 w-4 text-muted-foreground' />
                类型
              </Label>
              <Select
                value={String(workflowType)}
                onValueChange={(value) => setWorkflowType(Number(value))}
              >
                <SelectTrigger id='type'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(WorkflowType.TEMPLATE)}>
                    模板
                  </SelectItem>
                  <SelectItem value={String(WorkflowType.SUBMODULE)}>
                    子模块
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='public' className='flex items-center gap-2'>
                {isPublic ? (
                  <GlobeIcon className='h-4 w-4 text-primary' />
                ) : (
                  <LockIcon className='h-4 w-4 text-muted-foreground' />
                )}
                公开状态
              </Label>
              <div className='flex items-center justify-between rounded-md border p-2 h-10'>
                <span className='text-sm text-muted-foreground'>
                  {isPublic ? '已公开' : '私有'}
                </span>
                <Switch
                  id='public'
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
          </div>

          <div className='grid gap-2'>
            <Label
              htmlFor='execution-scope'
              className='flex items-center gap-2'
            >
              <LayersIcon className='h-4 w-4 text-muted-foreground' />
              执行范围
            </Label>
            <Select
              value={String(executionScope)}
              onValueChange={(value) => setExecutionScope(Number(value))}
            >
              <SelectTrigger id='execution-scope'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ExecutionScope.SAMPLE_LEVEL)}>
                  样本级 — 为每个样本独立运行
                </SelectItem>
                <SelectItem value={String(ExecutionScope.PROJECT_LEVEL)}>
                  项目级 — 整个项目运行一次
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={saveWorkflowMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSaveAs}
            disabled={!name.trim() || saveWorkflowMutation.isPending}
            className='min-w-[80px]'
          >
            {saveWorkflowMutation.isPending ? '保存中...' : '确认保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
