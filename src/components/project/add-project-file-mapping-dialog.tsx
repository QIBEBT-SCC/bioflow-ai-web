'use client'

import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateProjectFileMapping } from '@/hooks/use-sample'

interface AddProjectFileMappingDialogProps {
  projectId: string
  trigger?: React.ReactNode
}

export function AddProjectFileMappingDialog({
  projectId,
  trigger,
}: AddProjectFileMappingDialogProps) {
  const t = useTranslations('Project.fileMapping')
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filePath, setFilePath] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useCreateProjectFileMapping()

  const handleSubmit = async () => {
    if (!keyword.trim()) {
      toast.error(t('keywordRequired'))
      return
    }
    if (!filePath.trim()) {
      toast.error(t('filePathRequired'))
      return
    }
    if (!description.trim()) {
      toast.error(t('descriptionRequired'))
      return
    }

    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          keyword: keyword.trim(),
          file_path: filePath.trim(),
          description: description.trim(),
        },
      })

      toast.success(t('createSuccess'))
      setKeyword('')
      setFilePath('')
      setDescription('')
      setOpen(false)
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      if (err?.status === 409 || err?.message?.includes('already exists')) {
        toast.error(t('keywordDuplicate'))
      } else {
        toast.error(t('createFailed'))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm' variant='outline'>
            <PlusIcon className='size-4 mr-2' />
            {t('add')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='keyword'>{t('keywordRequiredLabel')}</Label>
            <Input
              id='keyword'
              placeholder={t('keywordPlaceholder')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              {t('keywordDescription')}
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
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? t('creating') : t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
