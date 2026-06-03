'use client'

import { Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
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
import { useDB, useDeleteDB } from '@/hooks/use-resource'

interface DatabaseDetailProps {
  databaseId: number
  onDelete: () => void
}

export function DatabaseDetail({ databaseId, onDelete }: DatabaseDetailProps) {
  const t = useTranslations('resource')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { data: database, isLoading } = useDB(databaseId)
  const deleteMutation = useDeleteDB()

  const confirmDelete = () => {
    deleteMutation.mutate(databaseId, {
      onSuccess: () => {
        onDelete()
      },
    })
    setIsDeleteDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className='flex h-[400px] items-center justify-center text-muted-foreground'>
        {t('loading')}
      </div>
    )
  }

  if (!database) {
    return (
      <div className='flex h-[400px] items-center justify-center text-muted-foreground'>
        {t('database_not_found')}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-2xl font-semibold'>{database.name}</h2>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='destructive'
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2Icon className='mr-2 size-4' />
            {deleteMutation.isPending ? t('deleting') : t('delete')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className='pt-6'>
          <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='col-span-2'>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('description_label')}
              </dt>
              <dd className='mt-1 text-sm'>
                {database.description || t('no_description')}
              </dd>
            </div>
            <div className='col-span-2'>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('path')}
              </dt>
              <dd className='mt-1 text-sm font-mono bg-muted p-2 rounded'>
                {database.path}
              </dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('size')}
              </dt>
              <dd className='mt-1 text-sm'>{database.size}</dd>
            </div>
            <div>
              <dt className='text-sm font-medium text-muted-foreground'>
                {t('last_update')}
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
            <AlertDialogTitle>{t('delete_confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
