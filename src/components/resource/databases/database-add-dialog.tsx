'use client'

import type React from 'react'
import { useState } from 'react'
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
import { useCreateDB } from '@/hooks/use-resource'

interface DatabaseAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DatabaseAddDialog({
  open,
  onOpenChange,
}: DatabaseAddDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [path, setPath] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [nameError, setNameError] = useState('')
  const [pathError, setPathError] = useState('')

  const createMutation = useCreateDB()

  const clearErrors = () => {
    setNameError('')
    setPathError('')
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPath('')
    setLastUpdate('')
    clearErrors()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    const newDb = {
      name,
      description: description || undefined,
      path,
      last_update: lastUpdate || '',
    }

    createMutation.mutate(newDb, {
      onSuccess: () => {
        onOpenChange(false)
        resetForm()
      },
      onError: (error: Error & { status?: number }) => {
        const status = error.status
        switch (status) {
          case 409:
            setNameError('数据库名称已存在，请使用其他名称')
            break
          case 404:
            setPathError('文件路径不存在，请检查路径是否正确')
            break
          default:
            // toast 已在 hook 中处理
            break
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>添加新数据库</DialogTitle>
            <DialogDescription>
              添加生物信息数据库的引用。所有带 * 的字段为必填项。
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>
                数据库名称 <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError('')
                }}
                required
                disabled={createMutation.isPending}
                className={
                  nameError ? 'border-red-500 focus-visible:ring-red-500' : ''
                }
              />
              {nameError && (
                <p className='text-sm text-red-500 mt-1'>{nameError}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>描述</Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createMutation.isPending}
                className='min-h-[100px]'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='path'>
                文件路径 <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='path'
                value={path}
                onChange={(e) => {
                  setPath(e.target.value)
                  if (pathError) setPathError('')
                }}
                required
                disabled={createMutation.isPending}
                className={
                  pathError ? 'border-red-500 focus-visible:ring-red-500' : ''
                }
              />
              {pathError && (
                <p className='text-sm text-red-500 mt-1'>{pathError}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='version'>更新时间</Label>
              <Input
                id='version'
                value={lastUpdate}
                onChange={(e) => setLastUpdate(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onOpenChange(false)
                clearErrors()
              }}
              disabled={createMutation.isPending}
            >
              取消
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? '添加中...' : '添加数据库'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
