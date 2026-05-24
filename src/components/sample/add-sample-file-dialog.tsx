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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddSampleFile } from '@/hooks/use-sample'
import { SampleFileType } from '@/types/sample'

interface AddSampleFileDialogProps {
  projectId: string
  sampleUid: string
  trigger?: React.ReactNode
}

const fileTypeOptions = [
  { value: SampleFileType.SEQUENCING_R1, labelKey: 'sequencingR1Long' },
  { value: SampleFileType.SEQUENCING_R2, labelKey: 'sequencingR2Long' },
  { value: SampleFileType.SEQUENCING, labelKey: 'sequencingSingleLong' },
  { value: SampleFileType.SPECTRUM, labelKey: 'spectrumLong' },
  { value: SampleFileType.IMAGE, labelKey: 'imageLong' },
]

// 默认标签映射
const defaultTagPlaceholders: Record<SampleFileType, string> = {
  [SampleFileType.SEQUENCING_R1]: 'r1',
  [SampleFileType.SEQUENCING_R2]: 'r2',
  [SampleFileType.SEQUENCING]: 'single',
  [SampleFileType.SPECTRUM]: 'spectrum',
  [SampleFileType.IMAGE]: 'image',
}

export function AddSampleFileDialog({
  projectId,
  sampleUid,
  trigger,
}: AddSampleFileDialogProps) {
  const t = useTranslations('Project.sample.files')
  const [open, setOpen] = useState(false)
  const [dataType, setDataType] = useState<SampleFileType | ''>('')
  const [filePath, setFilePath] = useState('')
  const [tag, setTag] = useState('')

  const addFileMutation = useAddSampleFile()

  const handleSubmit = async () => {
    // 验证必填字段
    if (!dataType && dataType !== 0) {
      toast.error(t('fileTypeRequired'))
      return
    }
    if (!filePath.trim()) {
      toast.error(t('filePathRequired'))
      return
    }

    try {
      await addFileMutation.mutateAsync({
        projectId,
        sampleUid,
        data: {
          data_type: dataType as SampleFileType,
          file_path: filePath,
          ...(tag.trim() && { tag: tag.trim() }),
        },
      })

      toast.success(t('addSuccess'))

      // 重置表单
      setDataType('')
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
          {/* 文件类型 */}
          <div className='space-y-2'>
            <Label htmlFor='data-type'>{t('fileTypeRequiredLabel')}</Label>
            <Select
              value={dataType.toString()}
              onValueChange={(value) =>
                setDataType(Number(value) as SampleFileType)
              }
            >
              <SelectTrigger id='data-type'>
                <SelectValue placeholder={t('fileTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {fileTypeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {t(`types.${option.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor='tag'>{t('tagOptionalLabel')}</Label>
            <Input
              id='tag'
              placeholder={
                dataType !== '' && dataType !== undefined
                  ? t('tagPlaceholderWithDefault', {
                      tag: defaultTagPlaceholders[dataType as SampleFileType],
                    })
                  : t('tagPlaceholder')
              }
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
