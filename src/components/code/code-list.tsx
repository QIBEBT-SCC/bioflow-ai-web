'use client'

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CodeTypeBadge } from '@/components/code/code-type-badge'
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
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { useCodeList, useDeleteCode } from '@/hooks/use-code'
import type { CodeNodeType } from '@/types/code'

const PAGE_SIZE = 12
const SKELETON_IDS = ['one', 'two', 'three', 'four', 'five', 'six']

export function CodeList({
  query,
  nodeType,
  currentPage,
  onPageChange,
}: {
  query: string
  nodeType?: CodeNodeType
  currentPage: number
  onPageChange: (page: number) => void
}) {
  const t = useTranslations('code.List')
  const offset = (currentPage - 1) * PAGE_SIZE
  const { data, isLoading, isError } = useCodeList({
    query,
    nodeType,
    offset,
    limit: PAGE_SIZE,
  })
  const deleteMutation = useDeleteCode()
  const [deleteTarget, setDeleteTarget] = useState<{
    uid: string
    name: string
  } | null>(null)

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.uid, {
      onSuccess: () => {
        if (data?.data.length === 1 && currentPage > 1) {
          onPageChange(currentPage - 1)
        }
        setDeleteTarget(null)
      },
    })
  }

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className='h-56 rounded-xl' />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Empty className='border'>
        <EmptyHeader>
          <EmptyTitle>{t('loadErrorTitle')}</EmptyTitle>
          <EmptyDescription>{t('loadErrorDescription')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (!data?.data.length) {
    return (
      <Empty className='border'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <span className='font-mono text-sm'>&lt;/&gt;</span>
          </EmptyMedia>
          <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {data.data.map((code) => {
          const isPython = code.node_type === 'code_python'
          const isR = code.node_type === 'code_R'
          return (
            <Card
              key={code.uid}
              className='group relative gap-0 overflow-hidden py-0 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md'
            >
              <div
                className={
                  isPython
                    ? 'h-1 bg-gradient-to-r from-blue-500 to-cyan-400'
                    : isR
                      ? 'h-1 bg-gradient-to-r from-violet-500 to-fuchsia-400'
                      : 'h-1 bg-gradient-to-r from-amber-500 to-orange-400'
                }
              />
              <CardHeader className='gap-3 px-5 pt-5 pb-3'>
                <CardTitle className='line-clamp-2 min-w-0 text-base leading-6'>
                  <Link
                    href={`/code/${code.uid}`}
                    className='after:absolute after:inset-0'
                  >
                    {code.name}
                  </Link>
                </CardTitle>

                <CardAction className='relative z-10'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='size-8'>
                        <MoreHorizontalIcon className='size-4' />
                        <span className='sr-only'>{t('moreOptions')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem asChild>
                        <Link href={`/code/${code.uid}/edit`}>
                          <PencilIcon className='size-4' />
                          {t('edit')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() =>
                          setDeleteTarget({ uid: code.uid, name: code.name })
                        }
                      >
                        <Trash2Icon className='size-4' />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>

              <CardContent className='px-5 pb-5'>
                <p className='line-clamp-3 min-h-15 text-sm leading-5 text-muted-foreground'>
                  {code.description}
                </p>
              </CardContent>

              <CardFooter className='mt-auto border-t bg-muted/20 px-5 py-3 pt-3!'>
                <CodeTypeBadge nodeType={code.node_type} />
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className='mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row'>
        <p className='text-sm text-muted-foreground'>
          {t('showing', {
            start: offset + 1,
            end: Math.min(offset + PAGE_SIZE, total),
            total,
          })}
        </p>
        <Pagination className='mx-0 w-auto'>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
            <PaginationItem>
              <span className='px-3 text-sm tabular-nums'>
                {currentPage} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: deleteTarget?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleting') : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
