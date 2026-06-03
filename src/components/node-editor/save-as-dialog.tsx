'use client'

import {
  AlignLeftIcon,
  CopyIcon,
  FileTextIcon,
  GlobeIcon,
  LayersIcon,
  LockIcon,
  SaveIcon,
  SparklesIcon,
  TypeIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducer, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useSaveWorkflow } from '@/hooks/use-workflow'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import { ExecutionScope, WorkflowType } from '@/types/workflow'

interface SaveAsDialogProps {
  currentWorkflowName?: string
  disabled?: boolean
}

type SaveState = {
  name: string
  description: string
  isPublic: boolean
  workflowType: WorkflowType
  executionScope: ExecutionScope
  autoSummary: boolean
  summaryPrompt: string
}
type SaveAction =
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_DESCRIPTION'; value: string }
  | { type: 'SET_PUBLIC'; value: boolean }
  | { type: 'SET_TYPE'; value: WorkflowType }
  | { type: 'SET_SCOPE'; value: ExecutionScope }
  | { type: 'SET_AUTO_SUMMARY'; value: boolean }
  | { type: 'SET_SUMMARY_PROMPT'; value: string }
  | { type: 'RESET'; name?: string }

const INITIAL_SAVE: SaveState = {
  name: '',
  description: '',
  isPublic: false,
  workflowType: WorkflowType.TEMPLATE,
  executionScope: ExecutionScope.SAMPLE_LEVEL,
  autoSummary: false,
  summaryPrompt: '',
}

function saveReducer(state: SaveState, action: SaveAction): SaveState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.value }
    case 'SET_DESCRIPTION':
      return { ...state, description: action.value }
    case 'SET_PUBLIC':
      return { ...state, isPublic: action.value }
    case 'SET_TYPE':
      return { ...state, workflowType: action.value }
    case 'SET_SCOPE':
      return { ...state, executionScope: action.value }
    case 'SET_AUTO_SUMMARY':
      return { ...state, autoSummary: action.value }
    case 'SET_SUMMARY_PROMPT':
      return { ...state, summaryPrompt: action.value }
    case 'RESET':
      return { ...INITIAL_SAVE, name: action.name ?? '' }
  }
}

export function SaveAsDialog({
  currentWorkflowName,
  disabled,
}: SaveAsDialogProps) {
  const t = useTranslations('editor')
  const td = useTranslations('editor.save_as_dialog')
  const [
    {
      name,
      description,
      isPublic,
      workflowType,
      executionScope,
      autoSummary,
      summaryPrompt,
    },
    dispatch,
  ] = useReducer(saveReducer, INITIAL_SAVE)
  const [open, setOpen] = useState(false)

  const { nodes, edges, setCurrentWorkflowUid } = useNodeEditorStore()
  const saveWorkflowMutation = useSaveWorkflow()

  const handleSaveAs = () => {
    if (!name.trim()) return

    const workflow = {
      name: name.trim(),
      description: description.trim(),
      workflow: { nodes, edges },
      public: isPublic,
      wf_type: workflowType,
      execution_scope: executionScope,
      auto_summary: autoSummary,
      summary_prompt: autoSummary ? summaryPrompt.trim() : '',
    }

    saveWorkflowMutation.mutate(workflow, {
      onSuccess: (uid) => {
        setCurrentWorkflowUid(uid)
        setOpen(false)
        dispatch({ type: 'RESET' })
      },
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && currentWorkflowName) {
      dispatch({
        type: 'RESET',
        name: `${currentWorkflowName} - ${td('copy_suffix')}`,
      })
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' disabled={disabled}>
          <SaveIcon className='size-4 mr-2' />
          {t('save_as')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-primary/10 rounded-full'>
              <CopyIcon className='size-5 text-primary' />
            </div>
            <DialogTitle>{td('title')}</DialogTitle>
          </div>
          <DialogDescription className='pt-2'>
            {td('description')}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-6 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='name' className='flex items-center gap-2'>
              <FileTextIcon className='size-4 text-muted-foreground' />
              {td('name_label')}
            </Label>
            <Input
              id='name'
              placeholder={td('name_placeholder')}
              className='col-span-3'
              value={name}
              onChange={(e) =>
                dispatch({ type: 'SET_NAME', value: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleSaveAs()
                }
              }}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='description' className='flex items-center gap-2'>
              <AlignLeftIcon className='size-4 text-muted-foreground' />
              {td('description_label')}
            </Label>
            <Textarea
              id='description'
              placeholder={td('description_placeholder')}
              value={description}
              onChange={(e) =>
                dispatch({
                  type: 'SET_DESCRIPTION',
                  value: e.target.value,
                })
              }
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='type' className='flex items-center gap-2'>
                <TypeIcon className='size-4 text-muted-foreground' />
                {td('type_label')}
              </Label>
              <Select
                value={String(workflowType)}
                onValueChange={(value) =>
                  dispatch({
                    type: 'SET_TYPE',
                    value: Number(value) as WorkflowType,
                  })
                }
              >
                <SelectTrigger id='type'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(WorkflowType.TEMPLATE)}>
                    {td('type_template')}
                  </SelectItem>
                  <SelectItem value={String(WorkflowType.SUBMODULE)}>
                    {td('type_submodule')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='public' className='flex items-center gap-2'>
                {isPublic ? (
                  <GlobeIcon className='size-4 text-primary' />
                ) : (
                  <LockIcon className='size-4 text-muted-foreground' />
                )}
                {td('visibility_label')}
              </Label>
              <div className='flex items-center justify-between rounded-md border p-2 h-10'>
                <span className='text-sm text-muted-foreground'>
                  {isPublic ? td('public') : td('private')}
                </span>
                <Switch
                  id='public'
                  checked={isPublic}
                  onCheckedChange={(v) =>
                    dispatch({ type: 'SET_PUBLIC', value: v as boolean })
                  }
                />
              </div>
            </div>
          </div>

          <div className='grid gap-2'>
            <Label
              htmlFor='execution-scope'
              className='flex items-center gap-2'
            >
              <LayersIcon className='size-4 text-muted-foreground' />
              {td('scope_label')}
            </Label>
            <Select
              value={String(executionScope)}
              onValueChange={(value) =>
                dispatch({
                  type: 'SET_SCOPE',
                  value: Number(value) as ExecutionScope,
                })
              }
            >
              <SelectTrigger id='execution-scope'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ExecutionScope.SAMPLE_LEVEL)}>
                  {td('scope_sample')}
                </SelectItem>
                <SelectItem value={String(ExecutionScope.PROJECT_LEVEL)}>
                  {td('scope_project')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-3'>
            <div className='flex items-center justify-between rounded-md border p-3'>
              <Label htmlFor='auto-summary' className='flex items-center gap-2'>
                <SparklesIcon className='size-4 text-muted-foreground' />
                {td('auto_summary')}
              </Label>
              <Switch
                id='auto-summary'
                checked={autoSummary}
                onCheckedChange={(v) =>
                  dispatch({
                    type: 'SET_AUTO_SUMMARY',
                    value: v as boolean,
                  })
                }
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='summary-prompt'>
                {td('summary_prompt_label')}
              </Label>
              <Textarea
                id='summary-prompt'
                placeholder={td('summary_prompt_placeholder')}
                value={summaryPrompt}
                disabled={!autoSummary}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_SUMMARY_PROMPT',
                    value: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={saveWorkflowMutation.isPending}
          >
            {td('cancel')}
          </Button>
          <Button
            onClick={handleSaveAs}
            disabled={!name.trim() || saveWorkflowMutation.isPending}
            className='min-w-[80px]'
          >
            {saveWorkflowMutation.isPending ? t('saving') : td('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
