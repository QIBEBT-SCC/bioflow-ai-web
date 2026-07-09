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
import { useAddSampleFile } from '@/hooks/use-sample'

interface AddSampleFileDialogProps {
  projectId: string
  sampleUid: string
  trigger?: React.ReactNode
}

export function AddSampleFileDialog({
  projectId,
  sampleUid,
  trigger,
}: AddSampleFileDialogProps) {
  const t = useTranslations('Project.sample.files')
  const [open, setOpen] = useState(false)
  const [filePath, setFilePath] = useState('')
  const [tag, setTag] = useState('')

  const addFileMutation = useAddSampleFile()

  const handleSubmit = async () => {
    // 验证必填字段
    if (!filePath.trim()) {
      toast.error(t('filePathRequired'))
      return
    }
    if (!tag.trim()) {
      toast.error(t('tagRequired'))
      return
    }

    try {
      await addFileMutation.mutateAsync({
        projectId,
        sampleUid,
        data: {
          file_path: filePath,
          tag: tag.trim(),
        },
      })

      toast.success(t('addSuccess'))

      // 重置表单
      setFilePath('')
      setTag('')
      setOpen(false)
    } catch (error: unknown) {
      // 处理 409 冲突错误（标签重复）
      const err = error as { status?: number; message?: string }
      if (err?.status === 409 || err?.message?.includes('already exists')) {
        toast.error(t('tagDuplicate'))
      } else {
        toast.error(t('addFailed'))
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
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('addDialogTitle')}</DialogTitle>
          <DialogDescription>{t('addDialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 文件路径 */}
          <div className='space-y-2'>
            <Label htmlFor='file-path'>{t('filePathRequiredLabel')}</Label>
            <Input
              id='file-path'
              placeholder={t('filePathPlaceholder')}
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              {t('filePathDescription')}
            </p>
          </div>

          {/* 文件标签 */}
          <div className='space-y-2'>
            <Label htmlFor='tag'>{t('tagRequiredLabel')}</Label>
            <Input
              id='tag'
              placeholder={t('tagPlaceholder')}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              {t('tagDescription')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={addFileMutation.isPending}>
            {addFileMutation.isPending ? t('adding') : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
