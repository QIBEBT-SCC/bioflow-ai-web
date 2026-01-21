'use client'

import { PlusIcon } from 'lucide-react'
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

// 文件类型选项
const fileTypeOptions = [
  { value: SampleFileType.SEQUENCING_R1, label: '测序数据 R1 (正向)' },
  { value: SampleFileType.SEQUENCING_R2, label: '测序数据 R2 (反向)' },
  { value: SampleFileType.SEQUENCING, label: '单端测序数据' },
  { value: SampleFileType.SPECTRUM, label: '光谱数据' },
  { value: SampleFileType.IMAGE, label: '图像数据' },
]

export function AddSampleFileDialog({
  projectId,
  sampleUid,
  trigger,
}: AddSampleFileDialogProps) {
  const [open, setOpen] = useState(false)
  const [dataType, setDataType] = useState<SampleFileType | ''>('')
  const [filePath, setFilePath] = useState('')

  const addFileMutation = useAddSampleFile()

  const handleSubmit = async () => {
    // 验证必填字段
    if (!dataType && dataType !== 0) {
      toast.error('请选择文件类型')
      return
    }
    if (!filePath.trim()) {
      toast.error('请输入文件路径')
      return
    }

    try {
      await addFileMutation.mutateAsync({
        projectId,
        sampleUid,
        data: {
          data_type: dataType as SampleFileType,
          file_path: filePath,
        },
      })

      toast.success('文件添加成功')

      // 重置表单
      setDataType('')
      setFilePath('')
      setOpen(false)
    } catch {
      toast.error('文件添加失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm' variant='outline'>
            <PlusIcon className='h-4 w-4 mr-2' />
            添加文件
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>添加样本文件</DialogTitle>
          <DialogDescription>
            为样本添加新的数据文件,请选择文件类型并输入文件路径。文件大小、格式和MD5校验码将由后端自动计算。
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* 文件类型 */}
          <div className='space-y-2'>
            <Label htmlFor='data-type'>文件类型 *</Label>
            <Select
              value={dataType.toString()}
              onValueChange={(value) =>
                setDataType(Number(value) as SampleFileType)
              }
            >
              <SelectTrigger id='data-type'>
                <SelectValue placeholder='选择文件类型' />
              </SelectTrigger>
              <SelectContent>
                {fileTypeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 文件路径 */}
          <div className='space-y-2'>
            <Label htmlFor='file-path'>文件路径 *</Label>
            <Input
              id='file-path'
              placeholder='例如: /data/samples/sample_R1.fq.gz'
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              输入服务器上的文件完整路径,后端将自动计算文件大小、格式和MD5校验码
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={addFileMutation.isPending}>
            {addFileMutation.isPending ? '添加中...' : '添加文件'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
