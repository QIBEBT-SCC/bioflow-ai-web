'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
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
import { useUpdateSample } from '@/hooks/use-sample'
import type { Sample } from '@/types/sample'

interface MetaEntry {
  id: number
  key: string
  value: string
}

interface EditSampleDialogProps {
  projectId: string
  sample: Sample
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toEntries(metaData: Sample['meta_data']): MetaEntry[] {
  let id = 0
  return Object.entries(metaData || {}).map(([key, value]) => ({
    id: id++,
    key,
    value: String(value),
  }))
}

export function EditSampleDialog({
  projectId,
  sample,
  open,
  onOpenChange,
}: EditSampleDialogProps) {
  const t = useTranslations('Project.sample')
  const [sampleName, setSampleName] = useState(sample.sample_name)
  const [metaData, setMetaData] = useState<MetaEntry[]>(
    toEntries(sample.meta_data),
  )
  const nextId = useRef(Object.keys(sample.meta_data || {}).length)

  const updateSampleMutation = useUpdateSample()

  const handleAddMetaData = () => {
    setMetaData((prev) => [
      ...prev,
      { id: nextId.current++, key: '', value: '' },
    ])
  }

  const handleRemoveMetaData = (id: number) => {
    setMetaData((prev) => prev.filter((item) => item.id !== id))
  }

  const handleMetaDataChange = (
    id: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    setMetaData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const handleSubmit = async () => {
    if (!sampleName.trim()) {
      toast.error(t('sampleNameRequired'))
      return
    }

    const metaDataObject: Record<string, unknown> = {}
    for (const item of metaData) {
      if (item.key.trim()) {
        metaDataObject[item.key] = item.value
      }
    }

    try {
      await updateSampleMutation.mutateAsync({
        projectId,
        sampleUid: sample.uid,
        data: {
          sample_name: sampleName,
          meta_data: metaDataObject,
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
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('editDialogTitle')}</DialogTitle>
          <DialogDescription>{t('editDialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 样本名称 */}
          <div className='space-y-2'>
            <Label htmlFor='sample-name'>{t('sampleNameRequiredLabel')}</Label>
            <Input
              id='sample-name'
              placeholder={t('sampleNamePlaceholder')}
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
            />
          </div>

          {/* 元数据 */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label>{t('metadata')}</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddMetaData}
              >
                <PlusIcon className='size-4 mr-2' />
                {t('addField')}
              </Button>
            </div>

            {metaData.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {t('emptyMetadata')}
              </p>
            ) : (
              <div className='space-y-2'>
                {metaData.map((item) => (
                  <div key={item.id} className='flex gap-2'>
                    <Input
                      placeholder={t('keyPlaceholder')}
                      value={item.key}
                      onChange={(e) =>
                        handleMetaDataChange(item.id, 'key', e.target.value)
                      }
                    />
                    <Input
                      placeholder={t('valuePlaceholder')}
                      value={item.value}
                      onChange={(e) =>
                        handleMetaDataChange(item.id, 'value', e.target.value)
                      }
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveMetaData(item.id)}
                    >
                      <XIcon className='size-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateSampleMutation.isPending}
          >
            {updateSampleMutation.isPending ? t('saving') : t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
