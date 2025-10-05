'use client'

import { Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { deleteDB, getDB } from '@/app/actions/resource'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { BioDb } from '@/types/resource'

interface DatabaseDetailProps {
  databaseId: number
  onDelete: () => void
}

export function DatabaseDetail({ databaseId, onDelete }: DatabaseDetailProps) {
  const [database, setDatabase] = useState<BioDb | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // 加载数据库详情
  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getDB(databaseId)
        setDatabase(data)
      } catch (error) {
        toast.error('加载数据库详情失败')
        console.log(error)
      }
    })
  }, [databaseId])

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteDB(databaseId)
        toast.success('数据库删除成功')
        setIsDeleteDialogOpen(false)
        onDelete()
        router.refresh()
      } catch (error: any) {
        toast.error(`删除失败: ${error.message || '未知错误'}`)
      }
    })
  }

  if (!database && !isPending) {
    return (
      <div className='flex h-[400px] items-center justify-center text-muted-foreground'>
        数据库不存在或已被删除
      </div>
    )
  }

  if (!database) {
    return (
      <div className='flex h-[400px] items-center justify-center text-muted-foreground'>
        加载中...
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>{database.name}</h2>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='destructive'
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isPending}
          >
            <Trash2Icon className='mr-2 h-4 w-4' />
            删除
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className='pt-6'>
          <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='col-span-2'>
              <dt className='text-sm font-medium text-muted-foreground'>
                描述
              </dt>
              <dd className='mt-1 text-sm'>
                {database.description || '无描述'}
              </dd>
            </div>
            <div className='col-span-2'>
              <dt className='text-sm font-medium text-muted-foreground'>
                路径
              </dt>
              <dd className='mt-1 text-sm font-mono bg-muted p-2 rounded'>
                {database.path}
              </dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-muted-foreground'>
                大小
              </dt>
              <dd className='mt-1 text-sm'>{database.size}</dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-muted-foreground'>
                最后更新
              </dt>
              <dd className='mt-1 text-sm'>{database.last_update}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除数据库</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将从系统中移除此数据库的引用。数据库文件本身不会被删除，但系统将无法再访问它。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isPending}
            >
              {isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
