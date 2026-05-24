'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSample } from '@/hooks/use-sample'

interface MetaEntry {
  id: number
  key: string
  value: string
}

interface CreateSampleDialogProps {
  projectId: string
  trigger?: React.ReactNode
}

export function CreateSampleDialog({
  projectId,
  trigger,
}: CreateSampleDialogProps) {
  const t = useTranslations('Project.sample')
  const [open, setOpen] = useState(false)
  const [sampleName, setSampleName] = useState('')
  const [metaData, setMetaData] = useState<MetaEntry[]>([])
  const nextId = useRef(0)

  const createSampleMutation = useCreateSample()

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
      await createSampleMutation.mutateAsync({
        projectId,
        data: {
          project_id: projectId,
          sample_name: sampleName,
          meta_data:
            Object.keys(metaDataObject).length > 0 ? metaDataObject : undefined,
        },
      })

      toast.success(t('createSuccess'))

      setSampleName('')
      setMetaData([])
      nextId.current = 0
      setOpen(false)
    } catch {
      toast.error(t('createFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm'>
            <PlusIcon className='size-4 mr-2' />
            {t('add')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('createDialogTitle')}</DialogTitle>
          <DialogDescription>{t('createDialogDescription')}</DialogDescription>
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
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createSampleMutation.isPending}
          >
            {createSampleMutation.isPending ? t('creating') : t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
