'use client'

import { PlusIcon, XIcon } from 'lucide-react'
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
import { useCreateSample } from '@/hooks/use-sample'

interface CreateSampleDialogProps {
  projectId: string
  trigger?: React.ReactNode
}

export function CreateSampleDialog({
  projectId,
  trigger,
}: CreateSampleDialogProps) {
  const [open, setOpen] = useState(false)
  const [sampleName, setSampleName] = useState('')
  const [metaData, setMetaData] = useState<
    Array<{ key: string; value: string }>
  >([])

  const createSampleMutation = useCreateSample()

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
      await createSampleMutation.mutateAsync({
        projectId,
        data: {
          project_id: projectId,
          sample_name: sampleName,
          meta_data:
            Object.keys(metaDataObject).length > 0 ? metaDataObject : undefined,
        },
      })

      toast.success('样本创建成功')

      // 重置表单
      setSampleName('')
      setMetaData([])
      setOpen(false)
    } catch {
      toast.error('样本创建失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm'>
            <PlusIcon className='size-4 mr-2' />
            添加样本
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>创建新样本</DialogTitle>
          <DialogDescription>
            添加新的生物样本到项目中,可以选择性添加元数据信息
          </DialogDescription>
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
                  // biome-ignore lint/suspicious/noArrayIndexKey: no nedd
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
          <Button variant='outline' onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createSampleMutation.isPending}
          >
            {createSampleMutation.isPending ? '创建中...' : '创建样本'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
