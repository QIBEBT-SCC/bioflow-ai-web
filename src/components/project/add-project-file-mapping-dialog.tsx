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
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filePath, setFilePath] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useCreateProjectFileMapping()

  const handleSubmit = async () => {
    if (!keyword.trim()) {
      toast.error('请输入关键字')
      return
    }
    if (!filePath.trim()) {
      toast.error('请输入文件路径')
      return
    }
    if (!description.trim()) {
      toast.error('请输入描述')
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

      toast.success('全局文件创建成功')
      setKeyword('')
      setFilePath('')
      setDescription('')
      setOpen(false)
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      if (err?.status === 409 || err?.message?.includes('already exists')) {
        toast.error('关键字已存在，请使用其他关键字')
      } else {
        toast.error('全局文件创建失败')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size='sm' variant='outline'>
            <PlusIcon className='size-4 mr-2' />
            添加文件
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>添加全局文件</DialogTitle>
          <DialogDescription>
            创建项目级全局文件，可在工作流中使用 proj:keyword 格式引用
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='keyword'>关键字 *</Label>
            <Input
              id='keyword'
              placeholder='例如: reference_genome'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              用于工作流引用，如
              proj:reference_genome。建议使用小写字母、数字和下划线。
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='file-path'>文件路径 *</Label>
            <Input
              id='file-path'
              placeholder='例如: /data/genomes/hg38.fa'
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>描述 *</Label>
            <Textarea
              id='description'
              placeholder='例如: Human reference genome GRCh38'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? '创建中...' : '创建文件'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
