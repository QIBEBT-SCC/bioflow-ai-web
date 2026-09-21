'use client'

import {
  GitForkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteWorkflow, useWorkflows } from '@/hooks/use-workflow'
import { type WorkflowPortSummary, WorkflowType } from '@/types/workflow'
import { SubgraphDetails } from './subgraph-details'

const PAGE_SIZE = 12
const SKELETON_IDS = ['one', 'two', 'three', 'four', 'five', 'six']

export function SubgraphManagement() {
  const t = useTranslations('editor.subgraph.management')
  const [page, setPage] = useState(0)
  const [viewUid, setViewUid] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<{
    uid: string
    name: string
  } | null>(null)
  const { data, isPending, error, refetch } = useWorkflows(
    page * PAGE_SIZE,
    PAGE_SIZE,
    WorkflowType.SUBMODULE,
  )
  const deletion = useDeleteWorkflow()
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const confirmDelete = () => {
    if (!deleting || deletion.isPending) return
    deletion.mutate(deleting.uid, {
      onSuccess: () => {
        if (data?.data.length === 1 && page > 0)
          setPage((current) => current - 1)
        setDeleting(null)
      },
    })
  }
  return (
    <SidebarInset className='h-screen overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2! h-4!' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto max-w-6xl py-6'>
          <div className='mb-6'>
            <h1 className='text-2xl font-semibold'>{t('title')}</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t('description')}
            </p>
          </div>

          {isPending && (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {SKELETON_IDS.map((id) => (
                <Skeleton key={id} className='h-56 rounded-xl' />
              ))}
            </div>
          )}

          {error && (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyTitle>{t('load_error_title')}</EmptyTitle>
                <EmptyDescription>{error.message}</EmptyDescription>
              </EmptyHeader>
              <Button variant='outline' onClick={() => void refetch()}>
                {t('retry')}
              </Button>
            </Empty>
          )}

          {!isPending && !error && data?.data.length === 0 && (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <GitForkIcon />
                </EmptyMedia>
                <EmptyTitle>{t('empty_title')}</EmptyTitle>
                <EmptyDescription>{t('empty')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {!isPending && !error && data && data.data.length > 0 && (
            <>
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {data.data.map((item) => (
                  <Card key={item.uid} className='relative gap-0 py-0'>
                    <CardContent className='p-4'>
                      <div className='mb-2 flex items-start justify-between gap-2'>
                        <button
                          type='button'
                          className='line-clamp-2 text-left font-medium hover:underline after:absolute after:inset-0'
                          onClick={() => setViewUid(item.uid)}
                        >
                          {item.name}
                        </button>
                        <div className='relative z-10'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='size-8'
                              >
                                <MoreHorizontalIcon className='size-4' />
                                <span className='sr-only'>
                                  {t('more_options')}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/editor?workflowUid=${encodeURIComponent(item.uid)}`}
                                >
                                  <PencilIcon className='size-4' />
                                  {t('edit')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeleting(item)}
                              >
                                <Trash2Icon className='size-4' />
                                {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className='line-clamp-2 min-h-10 text-sm text-muted-foreground'>
                        {item.description}
                      </p>
                      <div className='mt-4 grid gap-2 border-t pt-3 text-xs'>
                        <InterfaceNames
                          label={t('inputs')}
                          ports={item.inputs ?? []}
                          emptyLabel={t('none')}
                        />
                        <InterfaceNames
                          label={t('outputs')}
                          ports={item.outputs ?? []}
                          emptyLabel={t('none')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className='mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row'>
                <p className='text-sm text-muted-foreground'>
                  {t('showing', {
                    start: page * PAGE_SIZE + 1,
                    end: Math.min((page + 1) * PAGE_SIZE, total),
                    total,
                  })}
                </p>
                <Pagination className='mx-0 w-auto'>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setPage((current) => Math.max(0, current - 1))
                        }
                        className={
                          !page
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className='px-3 text-sm tabular-nums'>
                        {page + 1} / {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((current) =>
                            Math.min(totalPages - 1, current + 1),
                          )
                        }
                        className={
                          page + 1 === totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>
      {viewUid && (
        <SubgraphDetails uid={viewUid} onClose={() => setViewUid(null)} />
      )}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deletion.isPending) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_description', { name: deleting?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletion.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deletion.isPending}
              onClick={(event) => {
                event.preventDefault()
                confirmDelete()
              }}
            >
              {deletion.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}

function InterfaceNames({
  label,
  ports,
  emptyLabel,
}: {
  label: string
  ports: WorkflowPortSummary[]
  emptyLabel: string
}) {
  return (
    <div className='grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-2'>
      <span className='pt-1 text-muted-foreground'>{label}</span>
      {ports.length > 0 ? (
        <div className='flex min-w-0 flex-wrap gap-1.5'>
          {ports.map((port) => (
            <span
              key={port.id}
              className='max-w-full truncate rounded-md bg-muted px-2 py-1'
              title={port.name}
            >
              {port.name}
            </span>
          ))}
        </div>
      ) : (
        <span className='pt-1 text-muted-foreground'>{emptyLabel}</span>
      )}
    </div>
  )
}
