'use client'

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
  const [filePath, setFilePath] = useState(mapping.file_path)
  const [description, setDescription] = useState(mapping.description)

  const updateMutation = useUpdateProjectFileMapping()

  const handleSubmit = async () => {
    if (!filePath.trim()) {
      toast.error('请输入文件路径')
      return
    }
    if (!description.trim()) {
      toast.error('请输入描述')
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

      toast.success('全局文件更新成功')
      onOpenChange(false)
    } catch {
      toast.error('全局文件更新失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>编辑全局文件</DialogTitle>
          <DialogDescription>
            修改全局文件的路径和描述（关键字不可修改）
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='keyword'>关键字</Label>
            <Input
              id='keyword'
              value={`proj:${mapping.keyword}`}
              disabled
              className='bg-muted'
            />
            <p className='text-xs text-muted-foreground'>
              关键字创建后不可修改
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
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? '更新中...' : '更新文件'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
