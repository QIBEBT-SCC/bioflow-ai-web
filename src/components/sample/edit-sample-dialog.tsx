'use client'

import { PlusIcon, XIcon } from 'lucide-react'
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
import { useUpdateSample } from '@/hooks/use-sample'
import type { Sample } from '@/types/sample'

interface EditSampleDialogProps {
  projectId: string
  sample: Sample
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSampleDialog({
  projectId,
  sample,
  open,
  onOpenChange,
}: EditSampleDialogProps) {
  const [sampleName, setSampleName] = useState(sample.sample_name)
  const [metaData, setMetaData] = useState(() =>
    Object.entries(sample.meta_data || {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  )

  const updateSampleMutation = useUpdateSample()

  const handleAddMetaData = () => {
    setMetaData((prev) => [...prev, { key: '', value: '' }])
  }

  const handleRemoveMetaData = (index: number) => {
    setMetaData(metaData.filter((_, i) => i !== index))
  }

  const handleMetaDataChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    const newMetaData = [...metaData]
    newMetaData[index][field] = value
    setMetaData(newMetaData)
  }

  const handleSubmit = async () => {
    if (!sampleName.trim()) {
      toast.error('请输入样本名称')
      return
    }

    // 转换元数据为对象
    const metaDataObject: Record<string, unknown> = {}
    metaData.forEach((item) => {
      if (item.key.trim()) {
        metaDataObject[item.key] = item.value
      }
    })

    try {
      await updateSampleMutation.mutateAsync({
        projectId,
        sampleUid: sample.uid,
        data: {
          sample_name: sampleName,
          meta_data: metaDataObject,
        },
      })

      toast.success('样本更新成功')

      onOpenChange(false)
    } catch {
      toast.error('样本更新失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>编辑样本</DialogTitle>
          <DialogDescription>修改样本的名称和元数据信息</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 样本名称 */}
          <div className='space-y-2'>
            <Label htmlFor='sample-name'>样本名称 *</Label>
            <Input
              id='sample-name'
              placeholder='例如: Sample-001'
              value={sampleName}
              onChange={(e) => setSampleName(e.target.value)}
            />
          </div>

          {/* 元数据 */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label>元数据</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddMetaData}
              >
                <PlusIcon className='size-4 mr-2' />
                添加字段
              </Button>
            </div>

            {metaData.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                暂无元数据,点击"添加字段"按钮添加
              </p>
            ) : (
              <div className='space-y-2'>
                {metaData.map((item, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: no need
                  <div key={index} className='flex gap-2'>
                    <Input
                      placeholder='键'
                      value={item.key}
                      onChange={(e) =>
                        handleMetaDataChange(index, 'key', e.target.value)
                      }
                    />
                    <Input
                      placeholder='值'
                      value={item.value}
                      onChange={(e) =>
                        handleMetaDataChange(index, 'value', e.target.value)
                      }
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveMetaData(index)}
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
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateSampleMutation.isPending}
          >
            {updateSampleMutation.isPending ? '保存中...' : '保存更改'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
