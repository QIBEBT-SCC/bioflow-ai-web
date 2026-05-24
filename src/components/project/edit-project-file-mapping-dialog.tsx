'use client'

import { useTranslations } from 'next-intl'
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateProjectFileMapping } from '@/hooks/use-sample'
import type { ProjectFileMapping } from '@/types/sample'

interface EditProjectFileMappingDialogProps {
  projectId: string
  mapping: ProjectFileMapping
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectFileMappingDialog({
  projectId,
  mapping,
  open,
  onOpenChange,
}: EditProjectFileMappingDialogProps) {
  const t = useTranslations('Project.fileMapping')
  const [filePath, setFilePath] = useState(mapping.file_path)
  const [description, setDescription] = useState(mapping.description)

  const updateMutation = useUpdateProjectFileMapping()

  const handleSubmit = async () => {
    if (!filePath.trim()) {
      toast.error(t('filePathRequired'))
      return
    }
    if (!description.trim()) {
      toast.error(t('descriptionRequired'))
      return
    }

    try {
      await updateMutation.mutateAsync({
        projectId,
        mappingId: mapping.id,
        data: {
          file_path: filePath.trim(),
          description: description.trim(),
        },
      })

      toast.success(t('updateSuccess'))
      onOpenChange(false)
    } catch {
      toast.error(t('updateFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('editDialogTitle')}</DialogTitle>
          <DialogDescription>{t('editDialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='keyword'>{t('keyword')}</Label>
            <Input
              id='keyword'
              value={`proj:${mapping.keyword}`}
              disabled
              className='bg-muted'
            />
            <p className='text-xs text-muted-foreground'>
              {t('keywordImmutable')}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='file-path'>{t('filePathRequiredLabel')}</Label>
            <Input
              id='file-path'
              placeholder={t('filePathPlaceholder')}
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>{t('descriptionRequiredLabel')}</Label>
            <Textarea
              id='description'
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t('updating') : t('update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
