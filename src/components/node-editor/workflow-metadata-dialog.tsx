'use client'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateWorkflow, useWorkflow } from '@/hooks/use-workflow'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import { type Workflow, WorkflowType } from '@/types/workflow'

function MetadataForm({
  uid,
  initialWorkflow,
  onSaved,
}: {
  uid: string
  initialWorkflow: Workflow
  onSaved: () => void
}) {
  const t = useTranslations('editor.save_as_dialog')
  const id = useId()
  const [name, setName] = useState(initialWorkflow.name)
  const [description, setDescription] = useState(initialWorkflow.description)
  const [isPublic, setPublic] = useState(initialWorkflow.public)
  const mutation = useUpdateWorkflow()
  return (
    <form
      className='space-y-4'
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate(
          {
            uid,
            data: {
              name: name.trim(),
              description: description.trim(),
              public: isPublic,
              workflow: useNodeEditorStore.getState().getRootGraph(),
            },
          },
          { onSuccess: onSaved },
        )
      }}
    >
      <div className='space-y-2'>
        <Label htmlFor={`${id}-name`}>{t('name_label')}</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor={`${id}-description`}>{t('description_label')}</Label>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required={initialWorkflow.wf_type === WorkflowType.SUBMODULE}
        />
      </div>
      <div className='flex items-center gap-2'>
        <Switch
          id={`${id}-public`}
          checked={isPublic}
          onCheckedChange={setPublic}
        />
        <Label htmlFor={`${id}-public`}>{t('public')}</Label>
      </div>
      <Button
        type='submit'
        disabled={
          mutation.isPending ||
          !name.trim() ||
          (initialWorkflow.wf_type === WorkflowType.SUBMODULE &&
            !description.trim())
        }
      >
        {t('confirm')}
      </Button>
    </form>
  )
}

export function WorkflowMetadataDialog() {
  const t = useTranslations('editor.subgraph')
  const uid = useNodeEditorStore((state) => state.currentWorkflowUid)
  const { data } = useWorkflow(uid)
  const [open, setOpen] = useState(false)
  if (!uid || !data) return null
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='ghost'>
          {t('metadata')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('metadata')}</DialogTitle>
          <DialogDescription>{data.name}</DialogDescription>
        </DialogHeader>
        {open && (
          <MetadataForm
            key={uid}
            uid={uid}
            initialWorkflow={data}
            onSaved={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
