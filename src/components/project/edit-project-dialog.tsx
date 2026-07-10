'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { TagSelector } from '@/components/project/tag-selector'
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
import { Textarea } from '@/components/ui/textarea'
import { useProjectTags, useUpdateProject } from '@/hooks/use-project'
import type { ProjectPublic, ProjectTag } from '@/types/project'

interface EditProjectDialogProps {
  project: ProjectPublic
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps) {
  const t = useTranslations('Project.edit')
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [tags, setTags] = useState<ProjectTag[]>(project.tags)
  const { data: availableTags = [] } = useProjectTags()
  const updateProject = useUpdateProject()

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t('nameRequired'))
      return
    }

    try {
      await updateProject.mutateAsync({
        id: String(project.id),
        data: { name: name.trim(), description: description.trim(), tags },
      })
      toast.success(t('success'))
      onOpenChange(false)
    } catch {
      toast.error(t('failed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='edit-project-name'>{t('name')}</Label>
            <Input
              id='edit-project-name'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-project-description'>
              {t('projectDescription')}
            </Label>
            <Textarea
              id='edit-project-description'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>{t('projectTag')}</Label>
            <TagSelector
              availableTags={availableTags}
              value={tags}
              onChange={setTags}
              allowCreate={false}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={updateProject.isPending}>
            {updateProject.isPending ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
